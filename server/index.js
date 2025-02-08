const httpModule = require('http');
const fs = require('fs');
const express = require("express");

const app = express();

const cors = require('cors');
//var mysql = require('mysql');

const db = require('./database');
const sessions = require('./sessions');
const mail = require('./mail');
const perms = require('./rolesPermissions');
const reports = require('./reports');


const bcrypt = require('bcrypt');

const multer = require('multer');
const upload = multer({ dest: 'images/' });
const uploadPfp = multer({ dest: 'pfp/' });
const PORT = process.env.PORT || 3001;

httpModule.createServer(app).listen(PORT, () => { //Start Express Server
  console.log(`HTTP  NodeJS Server listening on port ${PORT}`);
});

let con = db.getConnection(); //Start MySQL Connection
db.logAction(con, "SERVER", "Started API", "", "0.0.0.0");

const nodemailer = require("nodemailer"); //Start Nodemailer service

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.enable('trust proxy');

app.get('/', async (req,res)=>{
  //sessions.initiatePasswordReset(con, nodemailer, "Dylang140", "dylangiliberto@gmail.com");
  //mail.sendMail(nodemailer, "dylangiliberto@gmail.com", "Pasword Reset Request", "<h1>Heading</h1><b>hello to me</b>")
  let val = await perms.checkUserPerm(con, 'Dylang140', 2);
  res.send("Hello from express server." + val);
})

app.get("/status", async (req, res) => {
  let version = await db.getVersion(con);
  console.log(version);
  res.send({
    siteVersion: version['site_version'],
    serverVersion: version['serverVersion']
  })
});

app.use("/user", async (req, res) => {
  let [verifiedPerm, verified] = await sessions.verify(con, req.body.SID, req.body.username);
  if(verified === true){
    console.log("Verified! Sending User Data! Username: " + req.body.username);
    let d = await db.getUserData(con, req.body.username);
    //console.log(d);
    res.send({
      user: d
    })
  }
  else
    res.sendStatus(403);
});

app.use("/userPublic", async (req, res) => {
  console.log("userPublic - " + (req?.body?.username ? req?.body?.username : " No User"));
  db.logAction(con, "", "userPublic", req?.body?.username, req.header('X-Real-IP'));
  let d = await db.getPublicUserData(con, req.body.username);
  //console.log(d);
  res.send({
    user: d
  })
});

app.use("/logs", async (req, res) => {
  let user = req?.body?.username;
  console.log("logs - " + (req?.body?.username ? req?.body?.username : " No User"));
  db.logAction(con, user, "logs", "", req.header('X-Real-IP'));
  let [verifiedPerm, verified] = await sessions.verify(con, req.body.SID, user);
  let isAdmin = await db.isAdministrator(con, user);
  if(verified && isAdmin){
    let d = await db.getLogs(con, req.body.requestNum, req.body.offsetNum);
    res.send({
      user: d
    })
  }
 
});

app.use("/userAdmin", async (req, res) => {
  console.log("userAdmin - " + (req?.body?.username ? req?.body?.username : " No User"));
  let [verifiedPerm, verified] = await sessions.verify(con, req.body.SID, req.body.username);
  let isAdmin = await db.isAdministrator(con, req.body.username);
  console.log("User Admin: " + req.body.username + " requesting " + req.body.targetUsername);
  console.log(verified + " " + isAdmin)
  if(verified && isAdmin){
    let d = await db.getUserData(con, req.body.targetUsername);
    //console.log(d);
    res.send({
      user: d
    });
  }
});

app.use("/lockAccount", async (req, res) => {
  console.log("Locking Account: " + (req?.body?.targetUsername ? req?.body?.targetUsername : " No User"));
  let [verifiedPerm, verified] = await sessions.verify(con, req.body.SID, req.body.username, 11); //Verfiy user + perm #11, restrictUsers
  let isAdmin = await db.isAdministrator(con, req.body.username);
  if(verified && isAdmin) {
    db.logAction(con, req.body.username, "lockAccount", req?.body?.targetUsername, req.header('X-Real-IP'));
    db.lockAccount(con, req.body.targetUsername);
    res.sendStatus(200);
  }
});

app.use("/report/:report", async (req, res) => {
  console.log("Getting Report: " + req.params.report + " for user " + req.body.username);
  let verified = sessions.verify(con, req.body.SID, req.body.user, 18); //Verify user and permission #17, generateReports
  if(verified) {
    let r = await reports.getReport(con, req.params.report);
    console.log(r);
    res.send(r);
  }
  else {
    res.sendStatus(403);
  }
  
});

app.use("/unlockAccount", async (req, res) => {
  console.log("Locking Account: " + (req?.body?.targetUsername ? req?.body?.targetUsername : " No User"));
  let [verifiedPerm, verified] = await sessions.verify(con, req.body.SID, req.body.username, 11); //Verfiy user + perm #11, restrictUsers
  let isAdmin = await db.isAdministrator(con, req.body.username);
  db.logAction(con, req.body.username, "unlockAccount", req?.body?.targetUsername, req.header('X-Real-IP'));
  if(verified && isAdmin) {
    db.unlockAccount(con, req.body.targetUsername);
    res.sendStatus(200);
  }
});

app.use("/usernameAvaliable", async (req, res) => {
  console.log("Checking username: " + req.body.username);
  let exists = await db.doesUserExist(con, req.body.username);
  if(exists === false) {
    console.log(req.body.username + " Avaliable!");
    res.send(true);
  }
  else {
    console.log(req.body.username + " Not Avaliable!");
    res.send(false);
  }
});

app.use("/setPassword", async (req, res) => { //Change password for 'targetUsername' otherwise `username`
  let username = req.body.username;
  let target = (req.body?.targetUsername ? req.body.targetUsername : username);
  let newPassword = req.body.password;
  let [verifiedPerm, verified] = await sessions.verify(con, req.body.SID, username);
  let isAdmin = await db.isAdministrator(con, username);
  console.log(newPassword);
  if(verified && isAdmin === 1) {
    bcrypt.hash(newPassword, 10, function(err, hash) {
      if(!err) {
        db.logAction(con, req.body.username, "setPassword", target, req.header('X-Real-IP'));
        db.setPassword(con, target, hash);
        console.log("Set Password for " + target);
        res.sendStatus(200);
      }
      else {
        console.log("Error Encrypting Password!");
        res.sendStatus(500);
      }
    });
  }
  else {
    console.log("Did Not Change Password");
    res.sendStatus(500);
  }
});

app.use("/register", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let email = req.body.email;
  let taken = await db.doesUserExist(con, username);
  if(!taken) {
    bcrypt.hash(password, 10, function(err, hash) {
      if(!err) {
        db.logAction(con, username, "register", username, req.header('X-Real-IP'));
        db.createUser(con, username, hash, email);
        perms.assignRole(con, username, 1); //Assign default 'User' role to new users
        console.log("Registered User " + username);
        res.sendStatus(200);
      }
      else {
        console.log("Error Encrypting Password!");
        res.sendStatus(500);
      }
    });
  }
  else {
    console.log("Did Not Register User");
    res.sendStatus(500);
  }
});

//TODO: Implement role/perms on password reset (user not logged in so verification different)
app.use("/forgotpassword", async (req, res) => {
  let username = req.body.username;
  let taken = await db.doesUserExist(con, username);
  if(username && taken) {
    let resetPerm = await perms.checkUserPerm(con, username, 13); //Verfiy user has permission #13 to reset password
    if(resetPerm) {
      let recent = await sessions.recentRequest(con, username);
      
      if(recent == 0) {
        db.logAction(con, username, "Initiate Password Reset: Success", req.header('X-Real-IP'));
        let email = await db.getUserData(con, username);
        console.log(email.email);
        sessions.initiatePasswordReset(con, nodemailer, username, email.email);
        res.sendStatus(200);
      }
      else {
        db.logAction(con, username, "Initiate Password Reset: Fail (Attempts)", req.header('X-Real-IP'))
        res.statusMessage = "Reset already attempted in last 15 minutes";
        res.sendStatus(403);
      }
    }
    else {
      res.statusMessage = "User is not permitted to reset password";
      res.sendStatus(403); //No perm to reset password
    }
  }
  else {
    db.logAction(con, "", "Initiate Password Reset: Fail (Other)", req.header('X-Real-IP'))
    console.log("Did Not Initiate Reset Password");
    res.sendStatus(400);
  }
});

app.use("/resetpassword", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let code = req.body.resetcode;

  if(username && password?.length >= 8 && code) {
    let data = await sessions.getResetRequest(con, username);
    console.log(data);
    if(data[0]?.username == username) {
      let resetPerm = await perms.checkUserPerm(con, username, 13); //Verfiy user has permission #13 to reset password
      if(resetPerm) {
        if(new Date(data[0]?.date_expiry) >= Date.now()){
          db.logAction(con, username, "Password Reset: Success", req.header('X-Real-IP'));
          console.log("Password Reset for " + username + ": Success");
          bcrypt.hash(password, 10, function(err, hash) {
            db.setPassword(con, username, hash);
          });
          sessions.purgeRequests(con, code);
          res.sendStatus(200);
        }
        else {
          res.statusMessage = "Request Expired";
          res.sendStatus(403);
        }
      }
      else {
        res.statusMessage = "User is not permitted to reset password";
        res.sendStatus(403); //No perm to reset password
      }
    }
    else {
      db.logAction(con, username, "Password Reset: Fail", req.header('X-Real-IP'))
      console.log("Password Reset: Fail");
      res.statusMessage = "Something went wrong, please try again";
      res.sendStatus(403);
    }
  }
  else {
    db.logAction(con, "", "Password Reset: Fail (Other)", req.header('X-Real-IP'))
    console.log("Did Not Reset Password");
    res.sendStatus(400);
  }
});

app.use("/postComment", upload.single('image'), async (req, res) => {
  let user = req.body.username;
  let SID = req.body.SID;
  let thread = req.body.thread;
  let tags = req.body.tags;
  if(user && SID && thread) {
    let [verifiedPerm, verified] = await sessions.verify(con, SID, user, 3); //Verfiy user + perm #3, postComment
    let file = req.file ? req.file.path : "No Image";
    //console.log("File Path: " + file);
    //console.log("Verified?: " + verified);
    if(verifiedPerm === true && user && (req.body.comment || file) && thread){
      db.logAction(con, user, "postComment", thread, req.header('X-Real-IP'));
      console.log("postComment - " + (req?.body?.username ? req?.body?.username : " No User") + file);
      
      db.postComment(con, req.body.comment, thread, user, file);
        //const imagePath = req.file.path;
        //db.postComment(con, req.body.comment, thread, user, imagePath);
      let comments = await db.getComments(con, thread, user, req.body.requestDeleted);
      /*
      Array.from(tags).map(row => {
        mail.logNotification(con, row, "", user, "tag", comments[0].ID, null);
      });
      */
      res.send(comments);
    }
    else if (verified) {
      res.sendStatus(403);
    }
    else {
      res.sendStatus(401);
    }
  }
  else {
    console.log("Missing User Data");
    res.sendStatus(500);
  }
});

app.get('/images/:imageName', (req, res) => {
  const imageName = req.params.imageName;
  const readStream = fs.createReadStream(`images/${imageName}`);
  readStream.pipe(res);
});

app.get('/pfp/:imageName', (req, res) => {
  const imageName = req.params.imageName;
  const readStream = fs.createReadStream(`pfp/${imageName}`);
  readStream.pipe(res);
});

app.use("/deleteComment", async (req, res) => {
  let comment = req.body.comment;
  let user = req.body.username;
  let SID = req.body.SID;
  let thread = req.body.thread;
  let setDeleted = req.body.setDeleted;
  
  if(comment && user && SID && thread){
    let author = await db.isCommentAuthor(con, comment, user);
    let [verifiedPerm, verified] = [false, false];
    if(author) {
      [verifiedPerm, verified] = await sessions.verify(con, SID, user, 4); //Verify perm #4, delete own comment
    }
    else {
      [verifiedPerm, verified] = await sessions.verify(con, SID, user, 9); //Verify perm #9, delete others comment
    }
    if(verifiedPerm){
      db.logAction(con, req.body.username, "deleteComment", comment.ID, req.header('X-Real-IP'));
      console.log("Deleteing/Restoring Comment ID: " + comment.ID + " User: " + user + " SID: " + SID + "SetDeleted: " + setDeleted);
      db.deleteComment(con, setDeleted, comment.ID, thread);
      let comments = await db.getComments(con, thread, user, req.body.requestDeleted);
      res.send(comments);
    }
    else {
      if(verified) {
        console.log("Could not delete a comment...");
        res.sendStatus(403); //No Perm
      }
      else {
        console.log("Could not delete a comment...");
        res.sendStatus(401); //Not logged in
      }
    }
  }
  else {
    console.log("Could not delete a comment...");
    res.sendStatus(400); //No data
  }
  
});

app.use("/deleteCommentPerm", async (req, res) => {
  let comment = req.body.comment;
  let user = req.body.username;
  let SID = req.body.SID;
  let thread = req.body.thread;
  let [verifiedPerm, verified] = await sessions.verify(con, SID, user);
  let admin = await db.isAdministrator(con, user);

  if(comment && user && SID && thread && verified && admin){
    db.logAction(con, req.body.username, "deleteCommentPerm", comment, req.header('X-Real-IP'));
    console.log("Permanently Deleteing Comment ID: " + comment + " User: " + user + " SID: " + SID);
    db.deleteCommentPerm(con, comment, thread);
    let comments = await db.getComments(con, thread, user, req.body.requestDeleted);
    res.send(comments);
  }
  else {
    console.log("Could not delete a comment...");
    res.sendStatus(403);
  }
});

app.use("/login", async (req, res) => {
  if(req.body.username && req.body.password){
    console.log("login - " + (req?.body?.username ? req?.body?.username : " No User"));
    let user = await db.getUserData(con, req.body.username).then(function(rows) { //Get user info from DB to compare and then send if verified
      return rows;
    });
    if(user.username === req.body.username) {
      let permLogin = await perms.checkUserPerm(con, req.body.username, 16); //Check perm #16 -  login
      if(user.locked === 0 && permLogin){ //Check account not locked AND has role perm to login (16), TODO: Un-implement lock feature, can soon be accomplished with roles
        db.logAction(con, req.body.username, "login", "", req.header('X-Real-IP'));
        let token = await sessions.generateSID(con); //Generate SID
        let permissions = await perms.getUserPerms(con, req.body.username); //Get perms list to send to client (so client can not load/request features user doesn't have access to)
        let pass = req.body.password;
        let hash = user.password;
        hash = hash.replace(/^\$2y(.+)$/i, '$2a$1');

        bcrypt.compare(pass, hash, function(err, v) { //Compare entered password to stored, encrypted password
          let verified = v || false;
          if(verified) { //Success
            console.log("User " + req.body.username + " Logged in!");
            sessions.registerSID(con, token, req.body.username); //Register session
            db.loggedIn(con, req.body.username); //Update account "last seen" stat
            res.send({ //Send data
              user: user,
              permissions: permissions,
              token: token
            });
          }
          else { //401 - Not authorized
            res.statusMessage = 'Incorrect Password';
            res.sendStatus(403); //Sends 403 for all cases and login page displays message sent. No need to redirect on client since user not logged in, no need to log out etc.
          }
        });
      }
      else { //403 - Forbidden. Haven't verified password, but user not permitted to login
        res.statusMessage = 'Login not permitted for this account';
        res.sendStatus(403);
      }
    }
    else { //404/401 - idk, user not found
      res.statusMessage = 'User Not Found';
      res.sendStatus(403);
    }
  }
  else { //400 - Missing data
    res.statusMessage = 'Missing Username or Password';
    res.sendStatus(403);
  }
});

app.use("/logAdminOtherUser", async (req, res) => {
  if(req.body.username && req.body.SID){
    let [verifiedPerm, verified] = await sessions.verify(con, req.body.SID, req.body.username, 20); //Check perm #20, logInAsOtherUser
    if(verifiedPerm)  {
      console.log("login admin as user - " + req?.body?.username + " as " + req?.body?.targetUsername);
      let user = await db.getUserData(con, req.body.targetUsername).then(function(rows) {
        return rows;
      });
      if(user.username === req.body.targetUsername) {
        db.logAction(con, req.body.username, "login admin as user", req?.body?.targetUsername, req.header('X-Real-IP'));
        let token = await sessions.generateSID(con);
        let permissions = await perms.getUserPerms(con, req.body.username);
  
        
        if(verified) {
          console.log("User " + req.body.username + " logged in as " + req?.body?.targetUsername);
          sessions.registerSID(con, token, req.body.targetUsername);
          res.send({
            user: user,
            permissions: permissions,
            token: token
          });
        }
      }
      else {
        res.statusMessage = 'User Not Found';
        res.sendStatus(404);
      }
    }
    else {
      res.statusMessage = 'No Permission';
      res.sendStatus(403);
    }
  }
  else {
    res.statusMessage = 'Missing Username or Password';
    res.sendStatus(400);
  }
});

app.use("/logout", async (req, res) => {
  let SID = req.body.token;
  console.log("logout - " + SID);
  //console.log(req.body);
  if(SID){
    db.logAction(con, req.body.username, "logout", '', req.header('X-Real-IP'));
    db.destroySession(con, SID);
  }
});

app.use("/threads", async (req, res) => {
  let sendDeleted = false;
  
  if(req?.body?.requestDeleted) {
    let isAdmin = await db.isAdministrator(con, req?.body?.username);
    if(isAdmin)
      sendDeleted = true;
  }
  if(sendDeleted){
    sql = "SELECT `thread`.*, `users`.`displayName`, `users`.`displayNameHex` FROM `thread` LEFT JOIN `users` ON `users`.`username` = `thread`.`username`" +
        "WHERE `archived` = 0 ORDER BY `pinned` DESC, `last_activity` DESC";
  }
  else {
    sql = "SELECT `thread`.*, `users`.`displayName`, `users`.`displayNameHex` FROM `thread` LEFT JOIN `users` ON `users`.`username` = `thread`.`username`" +
        "WHERE `archived` = 0 AND `deleted` = 0 ORDER BY `pinned` DESC, `last_activity` DESC";
  }
  console.log("threads - " + (req?.body?.username ? req?.body?.username : " No User"));
  db.logAction(con, req.body.username, "threads", '', req.header('X-Real-IP'));
  con.query(sql, function (err, result, fields) {
    if (err) throw err;
    res.send({
      threads: result
    });
  });
});

app.use("/threadsPage", async (req, res) => {
  let sendDeleted = false;
  let requestNum = req.body.requestNum;
  let requestStart = req.body.requestStart;
  let threadsCount;
  
  if(req?.body?.requestDeleted) {
    let isAdmin = await db.isAdministrator(con, req?.body?.username);
    if(isAdmin)
      sendDeleted = true;
  }
  if(sendDeleted){
    sql = "SELECT `thread`.*, `users`.`displayName`, `users`.`displayNameHex` FROM `thread` LEFT JOIN `users` ON `users`.`username` = `thread`.`username`" +
        "WHERE `archived` = 0 ORDER BY `pinned` DESC, `last_activity` DESC LIMIT ? OFFSET ?";
        threadsCount = await db.countThreads(con, true);
  }
  else {
    sql = "SELECT `thread`.*, `users`.`displayName`, `users`.`displayNameHex` FROM `thread` LEFT JOIN `users` ON `users`.`username` = `thread`.`username`" +
        "WHERE `archived` = 0 AND `deleted` = 0 ORDER BY `pinned` DESC, `last_activity` DESC LIMIT ? OFFSET ?";
        threadsCount = await db.countThreads(con, false);
  }
  db.logAction(con, req.body.username, "threadsPage", '', req.header('X-Real-IP'));
  console.log("threadsPage - " + (req?.body?.username ? req?.body?.username : " No User"));
  con.query(sql, [requestNum, requestStart],function (err, result, fields) {
    if (err) throw err;
    res.send({
      threads: result,
      threadsCount: threadsCount
    });
  });
});

app.use("/topicsPage", async (req, res) => {
  let sendDeleted = false;
  let requestNum = req.body.requestNum;
  let requestStart = req.body.requestStart;
  let topicsCount;
  
  if(req?.body?.requestDeleted && req?.body?.username) {
    let v = await sessions.verify(con, req.body.SID, req.body.username, 19); //Verify user has perm to view deleted topics, #19
    sendDeleted = (v ? true : false);
  }
  if(sendDeleted){
    sql = "SELECT * FROM `topic` ORDER BY `pinned` DESC, `last_activity` DESC LIMIT ? OFFSET ?";
    topicsCount = await db.countThreads(con, true);
  }
  else {
    sql = "SELECT * FROM `topic` WHERE `deleted` = 0 AND `public` = 1 ORDER BY `pinned` DESC, `last_activity` DESC LIMIT ? OFFSET ?";
    topicsCount = await db.countThreads(con, false);
  }
  db.logAction(con, req.body.username, "topicsPage", '', req.header('X-Real-IP'));
  console.log("topicsPage - " + (req?.body?.username ? req?.body?.username : " No User"));
  con.query(sql, [requestNum, requestStart],function (err, result, fields) {
    if (err) throw err;
    res.send({
      topics: result,
      topicsCount: topicsCount
    });
  });
});

app.use("/archivedThreads", async (req, res) => {
  let sendDeleted = false;
  
  if(req?.body?.requestDeleted) {
    let isAdmin = await db.isAdministrator(con, req?.body?.username);
    if(isAdmin)
      sendDeleted = true;
  }
  if(sendDeleted) {
    sql = "SELECT `thread`.*, `users`.`displayName` FROM `thread` LEFT JOIN `users` ON `users`.`username` = `thread`.`username`" +
        "WHERE `archived` = 1 ORDER BY `pinned` DESC, `last_activity` DESC";
  }
  else {
    sql = "SELECT `thread`.*, `users`.`displayName` FROM `thread` LEFT JOIN `users` ON `users`.`username` = `thread`.`username`" +
        "WHERE `archived` = 1 AND `deleted` = 0 ORDER BY `pinned` DESC, `last_activity` DESC";
  }
  console.log("/archivedThreads called....");
  con.query(sql, function (err, result, fields) {
    if (err) throw err;
    res.send({
      threads: result
    });
  });
});

app.use("/newThread", async (req, res) => {
  let title = req.body.title;
  let desc = req.body.desc;
  let username = req.body.username;
  let SID = req.body.SID;
  console.log("Creating Thread: " + title);
  let [verifiedPerm, verified] = await sessions.verify(con, SID, username, 2); //Verfiy user + perm #2, createThread
  if(verifiedPerm) {
    db.logAction(con, req.body.username, "newThread", title, req.header('X-Real-IP'));
    db.createThread(con, title, desc, username);
    db.loggedIn(con, username);
    res.sendStatus(200);
  }
  else if (verified) {
    res.sendStatus(403);
  }
  else {
    res.sendStatus(401);
  }
});

app.use("/updateThread", async (req, res) => {
  let username = req.body.username;
  let SID = req.body.SID;
  let thread = req.body.thread;
  let setDeleted = req.body.setDeleted;
  let setLocked = req.body.setLocked;
  let setArchived = req.body.setArchived;
  console.log(thread);
  console.log(setLocked === 1 ? "Locking Thread..." : "Unlocking Thread...");
  console.log(setDeleted === 1 ? "Deleting Thread..." : "Restoring Thread...");
  let [verifiedPerm, verified] = await sessions.verify(con, SID, username);
  if(verified) {
    db.logAction(con, req.body.username, "updateThread", thread, req.header('X-Real-IP'));
    db.lockThread(con, thread, (setLocked ? 1 : 0));
    db.deleteThread(con, thread, (setDeleted ? 1 : 0));
    db.archiveThread(con, thread, (setArchived ? 1 : 0));
    let threadData = await db.getThreadData(con, thread);
    res.send({threadData: threadData});
  }
  else {
    res.sendStatus(403);
  }
});

app.use("/comments", async (req, res) => {
  const threadID = req.body.id;
  const user = req.body.username;
  const SID = req.body.SID;
  if(threadID) {
    let thread = await db.getThreadData(con, threadID);
    let isAdmin = await db.isAdministrator(con, req?.body?.username);
    if(thread[0]?.deleted == 0 || isAdmin){
      let sendDeleted = (req?.body?.requestDeleted && isAdmin) ? true : false;
      db.logAction(con, req.body.username, "comments", threadID, req.header('X-Real-IP'));
      console.log("/comments called");
      console.log("SID: " + SID + " User: " + user);
      if(!SID || (SID && user)){ 
        let [verifiedPerm, verified] = SID ? (await sessions.verify(con, SID, user, 1)) : [true, true]; //Verfiy user + perm #1, viewThread (Also, permit anon users)
        if(verifiedPerm) {
          let comments = await db.getComments(con, threadID, user, sendDeleted);
          db.loggedIn(con, user);
          res.send({comments: comments[0] ? comments : {}, thread: thread});
        }
        else if (verified) {
          res.sendStatus(403);
        }
        else {
          res.sendStatus(401);
        }
      }
      else {
        res.sendStatus(400);
      }
    }
  }
  else {
    res.sendStatus(400);
  }
});

app.get("/threadData", async (req, res) => {
  const id = req.query.id;
  let thread = await db.getThreadData(con, id);
  res.send({thread: thread});
});

app.use("/likeComment", async (req, res) => {
  const comment = req.body.comment;
  const SID = req.body.SID;
  const user = req.body.username;
  const thread = req.body.thread;
  //console.log("ID: " + comment + " Thread: " + thread + " User: " + user + " SID: " + SID);
  if(user && comment && SID && thread) {
    let [verifiedPerm, verified] = await sessions.verify(con, SID, user, 5); //Verfiy user + perm #5, like comment
    if(verifiedPerm){
      db.logAction(con, req.body.username, "likeComment", comment, req.header('X-Real-IP'));
      let liked = await db.isCommentLiked(con, comment, user);
      db.loggedIn(con, user);
      if(liked){
        console.log("Un-liking comment id: " + comment + " User: " + user);
        let c = await db.unlikeComment(con, comment, user);
        //console.log(c);
        res.send({liked: false, count: c[0]});
      }
      else {
        console.log("Liking comment id: " + comment + " User: " + user);
        let c = await db.likeComment(con, comment, user);
        //console.log(c);
        res.send({liked: true, count: c[0]});
      }
    }
    else if (verified) {
      res.sendStatus(403);
    }
    else {
      res.sendStatus(401);
    }
  }
  else {
    console.log("Liking: " + comment + ", but user not logged in");
    res.sendStatus(400);
  }
});
//jonathan

app.use("/updateBio", async (req, res) => {
  const bio = req.body.bio;
  const SID = req.body.SID;
  const user = req.body.username;
  //console.log("ID: " + comment + " Thread: " + thread + " User: " + user + " SID: " + SID);
  if(bio && SID && user) {
    let [verifiedPerm, verified] = await sessions.verify(con, SID, user);
    if(verified === true){
      db.logAction(con, req.body.username, "updateBio", user, req.header('X-Real-IP'));
      db.updateBio(con, bio, user);
      res.sendStatus(200);
    }
    else {
      console.log("Could not verify user while updating bio!");
      res.sendStatus(401);
    }
  }
  else {
    console.log("Data missing while updating bio!");
    res.sendStatus(400);
  }
});

app.use("/updateUsername", async (req, res) => {
  const newName = req.body.newName;
  const SID = req.body.SID;
  const user = req.body.username;
  //console.log("ID: " + comment + " Thread: " + thread + " User: " + user + " SID: " + SID);
  if(newName && SID && user) {
    let [verifiedPerm, verified] = await sessions.verify(con, SID, user);
    if(verified === true){
      db.logAction(con, newName, "updateUsername", user, req.header('X-Real-IP'));
      db.updateUsername(con, newName, user);
      res.sendStatus(200);
    }
    else {
      console.log("Could not verify user while updating username!");
      res.sendStatus(401);
    }
  }
  else {
    console.log("Data missing while updating username!");
    res.sendStatus(400);
  }
});

app.use("/updateDisplayName", async (req, res) => {
  const newName = req.body.newName;
  const SID = req.body.SID;
  const user = req.body.username;
  const hexCode = req.body.newHexCode;
  //console.log("ID: " + comment + " Thread: " + thread + " User: " + user + " SID: " + SID);
  try {
    if(newName && SID && user) {
      let [verifiedPerm, verified] = await sessions.verify(con, SID, user);
      if(verified === true){
        db.logAction(con, req.body.username, "updateDisplayName", '', req.header('X-Real-IP'));
        db.updateDisplayName(con, newName, user, hexCode);
        let d = await db.getUserData(con, req.body.username);
        res.send(d);
      }
      else {
        console.log("SID" + SID + " Username: " + user + " NewDisplayName: " + newName);
        console.log("Could not verify user while updating Display Name!");
        res.sendStatus(401);
      }
    }
    else {
      console.log("SID" + SID + " Username: " + user + " NewDisplayName: " + newName);
      console.log("Data missing while updating Display Name!");
      res.sendStatus(400);
    }
  }
  catch {
    res.sendStatus(500);
  }
});

app.use("/updatePfp", uploadPfp.single('image'), async (req, res) => {
  const SID = req.body.SID;
  const user = req.body.username;
  let file = req.file ? req.file.path : "No Image";
  console.log("File Path: " + file);
  if(file) {
    if(SID && user) {
      let [verifiedPerm, verified] = await sessions.verify(con, SID, user);
      if(verified === true){
        db.logAction(con, req.body.username, "updatePfp", file, req.header('X-Real-IP'));
        db.updatePfp(con, file, user);
        res.sendStatus(200);
      }
      else {
        console.log("Could not verify user while updating PFP!");
        res.sendStatus(401);
      }
    }
    else {
      console.log("Data missing while updating PFP!");
      res.sendStatus(400);
    }
  }
  else {
    console.log("No file to upload!");
  }
});

app.use("/getRolePermissionTable", async (req, res) => {
  const id = req.query.id;
  let permissions = await perms.getPermissionsList(con, id);
  let roles = await perms.getRolesList(con, id);
  let rolePerms = await perms.getRolesPermissionsList(con, id);
  res.send({roles: roles, perms: permissions, rolePerms, rolePerms});
});

app.use("/updatePermTable", async (req, res) => {
  let permissions = await perms.getPermissionsList(con);
  let roles = await perms.getRolesList(con); 
  let [verifiedPerm, verified] = await sessions.verify(con, req.body.SID, req.body.username, 15); //Verfiy user + perm #15, modifyRolePermissions
  let table = req.body.table;
  if(verifiedPerm) {
    try {
      for(let i = 0; i < table.length; i++) {
        for(let j = 0; j < table[0].length; j++) {
          perms.setPermission(con, roles[j].roleID, permissions[i].permissionID, table[i][j]);
        }
      }
      res.sendStatus(200)
    }
    catch(err) {
      console.log(err);
      res.sendStatus(500);
    }
  }
  else if (verified) {
    res.sendStatus(403);
  }
  else {
    res.sendStatus(401);
  }
});

app.use("/addRole", async (req, res) => {
  const SID = req.body.SID;
  const user = req.body.username;
  const roleN = req.body.roleName;
  const roleD = req.body.roleDisplayName;
  const roleP = req.body.rolePriority;
  const roleA = req.body.roleAbreviation;
  const roleS = req.body.roleSite;

  if(SID && user && roleN && roleD && roleP && roleA && roleS) {
    let [verifiedPerm, verified] = await sessions.verify(con, SID, user);
    let admin = await db.isAdministrator(con, user);
    if(verified && admin) {
      try {
        perms.addRole(con, roleN, roleD, roleP, roleA, roleS);
        res.sendStatus(200);
      }
      catch(err) {
        console.log(err);
        res.sendStatus(500);
      }
    }
    else {
      res.sendStatus(403);
    }
  }
  else {
    res.sendStatus(500);
  }
});

app.use("/setUserRoles", async (req, res) => { //Borked
  const SID = req.body.SID;
  const user = req.body.username;

  const target = req.body.targetUsername;
  const roles = req.body.roles;
 
  console.log(user + " " + SID + " " + target + " " + roles);

  if(SID && user && target && roles) {
    let [verifiedPerm, verified] = await sessions.verify(con, SID, user);
    let admin = await db.isAdministrator(con, user);
    if(verified && admin) {
      try {
        perms.assignRoles(con, target, roles);
        console.log("Success updating roles");
        let newRoles = await perms.getUserRolesTruthTable(con, target);
        res.send({roles: newRoles});
      }
      catch(err) {
        console.log(err);
        res.sendStatus(500);
      }
    }
    else {
      res.sendStatus(403);
    }
  }
  else {
    res.sendStatus(500);
  }
});

app.use("/setUserRole", async (req, res) => { //Toggle one role (rather than a list of roles). Hopefully not borked
  const SID = req.body.SID;
  const user = req.body.username;

  const target = req.body.targetUsername;
  const roleID = req.body.roleID;
  const value = req.body.value
 
  console.log(user + " " + SID + " " + target + " " + roleID);

  if(SID && user && target && roleID) {
    let [verifiedPerm, verified] = await sessions.verify(con, SID, user);
    let admin = await db.isAdministrator(con, user);
    if(verified && admin) {
      try {
        if(value === true) {
          perms.assignRole(con, target, roleID);
          console.log("Success assigning role " + roleID + " to " + target);
        }
        else {
          perms.revokeRole(con, target, roleID);
          console.log("Success revoking role " + roleID + " from " + target);
        }
        let newRoles = await perms.getUserRolesTruthTable(con, target);
        res.send({roles: newRoles});
      }
      catch(err) {
        console.log(err);
        res.sendStatus(500);
      }
    }
    else {
      res.sendStatus(403);
    }
  }
  else {
    res.sendStatus(500);
  }
});

app.use("/getUserRoles", async (req, res) => {
  const SID = req.body.SID;
  const user = req.body.username;

  const target = req.body.targetUsername;

  let roles = await perms.getUserRoles(con, target);

  res.send({roles: roles});
});

app.use("/getUserRolesTruthTable", async (req, res) => {
  const SID = req.body.SID;
  const user = req.body.username;

  const target = req.body.targetUsername;

  let roles = await perms.getUserRolesTruthTable(con, target);

  res.send({roles: roles});
});

app.use("/getUserPermissions", async (req, res) => {
  const SID = req.body.SID;
  const user = req.body.username;

  const target = req.body.targetUsername;

  let perms = await perms.getUserPermissions(con, target);

  res.send({permissions: perms});
});

app.use("/test", async (req, res) => {
  let perms = await db.userHasPermission(con, 'Dylang140', 7);

  res.send(perms);
});