const httpModule = require('http');
const fs = require('fs');
const express = require("express");

const app = express();

const cors = require('cors');
//var mysql = require('mysql');

const db = require('./database');
const sessions = require('./sessions');

const bcrypt = require('bcrypt');

const multer = require('multer');
const upload = multer({ dest: 'images/' });
const uploadPfp = multer({ dest: 'pfp/' });
const PORT = process.env.PORT || 3001;

httpModule.createServer(app).listen(PORT, () => {
  console.log(`HTTP  NodeJS Server listening on port ${PORT}`);
});

let con = db.getConnection();
db.logAction(con, "SERVER", "Started API", "", "0.0.0.0");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.enable('trust proxy');

app.get('/', (req,res)=>{
  res.send("Hello from express server.")
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
  let verified = await sessions.verify(con, req.body.SID, req.body.username);
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
  db.logAction(con, "", "userPublic", req?.body?.username,req.ip);
  let d = await db.getPublicUserData(con, req.body.username);
  //console.log(d);
  res.send({
    user: d
  })
});

app.use("/logs", async (req, res) => {
  let user = req?.body?.username;
  console.log("logs - " + (req?.body?.username ? req?.body?.username : " No User"));
  db.logAction(con, user, "logs", "",req.ip);
  let verified = await sessions.verify(con, req.body.SID, user);
  let isAdmin = await db.isAdministrator(con, user);
  if(verified && isAdmin === 1){
    let d = await db.getLogs(con, req.body.requestNum, req.body.offsetNum);
    res.send({
      user: d
    })
  }
 
});

app.use("/userAdmin", async (req, res) => {
  console.log("userAdmin - " + (req?.body?.username ? req?.body?.username : " No User"));
  let verified = await sessions.verify(con, req.body.SID, req.body.username);
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
  let verified = await sessions.verify(con, req.body.SID, req.body.username);
  let isAdmin = await db.isAdministrator(con, req.body.username);
  if(verified && isAdmin) {
    db.logAction(con, req.body.username, "lockAccount", req?.body?.targetUsername, req.ip);
    db.lockAccount(con, req.body.targetUsername);
    res.sendStatus(200);
  }
});

app.use("/unlockAccount", async (req, res) => {
  console.log("Locking Account: " + (req?.body?.targetUsername ? req?.body?.targetUsername : " No User"));
  let verified = await sessions.verify(con, req.body.SID, req.body.username);
  let isAdmin = await db.isAdministrator(con, req.body.username);
  db.logAction(con, req.body.username, "unlockAccount", req?.body?.targetUsername, req.ip);
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
  let verified = await sessions.verify(con, req.body.SID, username);
  let isAdmin = await db.isAdministrator(con, username);
  console.log(newPassword);
  if(verified && isAdmin === 1) {
    bcrypt.hash(newPassword, 10, function(err, hash) {
      if(!err) {
        db.logAction(con, req.body.username, "setPassword", target, req.ip);
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
        db.logAction(con, username, "register", username, req.ip);
        db.createUser(con, username, hash, email);
        db.assignRole(con, username, 1); //Assign default 'User' role to new users
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

app.use("/postComment", upload.single('image'), async (req, res) => {
  let user = req.body.username;
  let SID = req.body.SID;
  let thread = req.body.thread;
  if(user && SID && thread) {
    let verified = await sessions.verify(con, SID, user);
    let file = req.file ? req.file.path : "No Image";
    //console.log("File Path: " + file);
    //console.log("Verified?: " + verified);
    if(verified === true && user && (req.body.comment || file) && thread){
      db.logAction(con, user, "postComment", thread, req.ip);
      console.log("postComment - " + (req?.body?.username ? req?.body?.username : " No User") + file);
      db.postComment(con, req.body.comment, thread, user, file);
        //const imagePath = req.file.path;
        //db.postComment(con, req.body.comment, thread, user, imagePath);
      let comments = await db.getComments(con, thread, user, req.body.requestDeleted);
      res.send(comments);
    }
    else if (!verified) {
      res.sendStatus(403);
    }
    else {
      res.sendStatus(500);
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
  let verified = await sessions.verify(con, SID, user);
  let author = await db.isCommentAuthor(con, comment, user);
  let admin = await db.isAdministrator(con, user);
  
  if(comment && user && SID && thread && verified && (author || admin)){
    db.logAction(con, req.body.username, "deleteComment", comment.ID, req.ip);
    console.log("Deleteing/Restoring Comment ID: " + comment.ID + " User: " + user + " SID: " + SID + "SetDeleted: " + setDeleted);
    db.deleteComment(con, setDeleted, comment.ID, thread);
    let comments = await db.getComments(con, thread, user, req.body.requestDeleted);
    res.send(comments);
  }
  else {
    console.log("Could not delete a comment...");
    res.sendStatus(403);
  }
});

app.use("/deleteCommentPerm", async (req, res) => {
  let comment = req.body.comment;
  let user = req.body.username;
  let SID = req.body.SID;
  let thread = req.body.thread;
  let verified = await sessions.verify(con, SID, user);
  let admin = await db.isAdministrator(con, user);

  if(comment && user && SID && thread && verified && admin){
    db.logAction(con, req.body.username, "deleteCommentPerm", comment, req.ip);
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
    let user = await db.getUserData(con, req.body.username).then(function(rows) {
      return rows;
    });
    if(user.username === req.body.username) {
      if(user.locked === 0){
        db.logAction(con, req.body.username, "login", "", req.ip);
        let token = await sessions.generateSID(con);
        let perms = await db.getUserPermissions(con, req.body.username);
        let pass = req.body.password;
        let hash = user.password;
        hash = hash.replace(/^\$2y(.+)$/i, '$2a$1');

        bcrypt.compare(pass, hash, function(err, v) {
          console.log("Verified: " + v);
          let verified = v || false;
          if(verified) {
            console.log("User " + req.body.username + " Logged in!");
            //console.log("Session ID: " + token);
            sessions.registerSID(con, token, req.body.username);
            console.log(perms);
            db.loggedIn(con, req.body.username);
            res.send({
              user: user,
              permissions: perms,
              token: token
            });
          }
          else {
            res.statusMessage = 'Incorrect Password';
            res.sendStatus(403);
          }
        });
      }
      else{
        res.statusMessage = 'Account Locked';
        res.sendStatus(403);
      }
    }
    else {
      res.statusMessage = 'User Not Found';
      res.sendStatus(403);
    }
  }
  else {
    res.statusMessage = 'Missing Username or Password';
    res.sendStatus(403);
  }
});

app.use("/logout", async (req, res) => {
  let SID = req.body.token;
  console.log("logout - " + SID);
  //console.log(req.body);
  if(SID){
    db.logAction(con, req.body.username, "logout", '', req.ip);
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
  db.logAction(con, req.body.username, "threads", '', req.ip);
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
  db.logAction(con, req.body.username, "threadsPage", '', req.ip);
  console.log("threadsPage - " + (req?.body?.username ? req?.body?.username : " No User"));
  con.query(sql, [requestNum, requestStart],function (err, result, fields) {
    if (err) throw err;
    res.send({
      threads: result,
      threadsCount: threadsCount
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
  let verified = await sessions.verify(con, SID, username);
  if(verified) {
    db.logAction(con, req.body.username, "newThread", title, req.ip);
    db.createThread(con, title, desc, username);
    db.loggedIn(con, username);
    res.sendStatus(200);
  }
  else {
    res.sendStatus(403);
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
  let verified = await sessions.verify(con, SID, username);
  if(verified) {
    db.logAction(con, req.body.username, "updateThread", thread, req.ip);
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
  let thread = await db.getThreadData(con, threadID);
  if(thread[0].ID == threadID) {
    let isAdmin = await db.isAdministrator(con, req?.body?.username);
    if(thread[0]?.deleted == 0 || isAdmin){
      let sendDeleted = false;
  
      if(req?.body?.requestDeleted && user && isAdmin) {
        sendDeleted = true;
      }
      db.logAction(con, req.body.username, "comments", threadID, req.ip);
      console.log("/comments called");
      console.log("SID: " + SID + " User: " + user);
      if(!SID || (SID && user)){
        let verified = SID ? (await sessions.verify(con, SID, user)) : true;
        if(verified) {
          let comments = await db.getComments(con, threadID, user, sendDeleted);
          
          let topReplies = {ID: 0};
          //comments.forEach(async (e) =>  {
          //  console.log( await db.getTopTwoReplies(con, e.ID));
          //});
          db.loggedIn(con, user);
          //console.log({comments: comments});
          res.send({comments: comments[0] ? comments : {}, thread: thread, topReplies: topReplies});
        }
        else {
          res.sendStatus(403);
        }
      }
      else {
        res.sendStatus(403);
      }
    }
    else{
      console.log("hey1");
      res.sendStatus(404);
    }
  }
  else {
    console.log("hey2");

    res.sendStatus(404);
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
    let verified = await sessions.verify(con, SID, user);
    if(verified === true){
      db.logAction(con, req.body.username, "likeComment", comment, req.ip);
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
    else {
      res.sendStatus(403);
    }
  }
  else {
    console.log("Liking: " + comment + ", but user not logged in");
    res.send(false);
  }
});
//jonathan

app.use("/updateBio", async (req, res) => {
  const bio = req.body.bio;
  const SID = req.body.SID;
  const user = req.body.username;
  //console.log("ID: " + comment + " Thread: " + thread + " User: " + user + " SID: " + SID);
  if(bio && SID && user) {
    let verified = await sessions.verify(con, SID, user);
    if(verified === true){
      db.logAction(con, req.body.username, "updateBio", user, req.ip);
      db.updateBio(con, bio, user);
      res.sendStatus(200);
    }
    else {
      console.log("Could not verify user while updating bio!");
      res.sendStatus(403);
    }
  }
  else {
    console.log("Data missing while updating bio!");
    res.sendStatus(403);
  }
});

app.use("/updateUsername", async (req, res) => {
  const newName = req.body.newName;
  const SID = req.body.SID;
  const user = req.body.username;
  //console.log("ID: " + comment + " Thread: " + thread + " User: " + user + " SID: " + SID);
  if(newName && SID && user) {
    let verified = await sessions.verify(con, SID, user);
    if(verified === true){
      db.logAction(con, newName, "updateUsername", user, req.ip);
      db.updateUsername(con, newName, user);
      res.sendStatus(200);
    }
    else {
      console.log("Could not verify user while updating username!");
      res.sendStatus(403);
    }
  }
  else {
    console.log("Data missing while updating username!");
    res.sendStatus(403);
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
      let verified = await sessions.verify(con, SID, user);
      if(verified === true){
        db.logAction(con, req.body.username, "updateDisplayName", '', req.ip);
        db.updateDisplayName(con, newName, user, hexCode);
        let d = await db.getUserData(con, req.body.username);
        res.send(d);
      }
      else {
        console.log("SID" + SID + " Username: " + user + " NewDisplayName: " + newName);
        console.log("Could not verify user while updating Display Name!");
        res.sendStatus(403);
      }
    }
    else {
      console.log("SID" + SID + " Username: " + user + " NewDisplayName: " + newName);
      console.log("Data missing while updating Display Name!");
      res.sendStatus(403);
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
      let verified = await sessions.verify(con, SID, user);
      if(verified === true){
        db.logAction(con, req.body.username, "updatePfp", file, req.ip);
        db.updatePfp(con, file, user);
        res.sendStatus(200);
      }
      else {
        console.log("Could not verify user while updating PFP!");
        res.sendStatus(403);
      }
    }
    else {
      console.log("Data missing while updating PFP!");
      res.sendStatus(403);
    }
  }
  else {
    console.log("No file to upload!");
  }
});

app.use("/getRolePermissionTable", async (req, res) => {
  const id = req.query.id;
  let perms = await db.getPermissionsList(con, id);
  let roles = await db.getRolesList(con, id);
  let rolePerms = await db.getRolesPermissionsList(con, id);
  res.send({roles: roles, perms: perms, rolePerms, rolePerms});
});

app.use("/updatePermTable", async (req, res) => {
  let perms = await db.getPermissionsList(con);
  let roles = await db.getRolesList(con);
 
  let table = req.body;
  try {
    for(let i = 0; i < table.length; i++) {
      for(let j = 0; j < table[0].length; j++) {
        db.setPermission(con, roles[j].roleID, perms[i].permissionID, table[i][j]);
      }
    }
    res.sendStatus(200)
  }
  catch(err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.use("/addRole", async (req, res) => {
  const SID = req.body.SID;
  const user = req.body.username;
  const roleN = req.body.roleName;
  const roleD = req.body.roleDisplayName;
  const roleP = req.body.rolePriority;
  const roleA = req.body.roleAbreviation;

  if(SID && user && roleN && roleD && roleP && roleA) {
    let verified = await sessions.verify(con, SID, user);
    let admin = await db.isAdministrator(con, user);
    if(verified && admin) {
      try {
        db.addRole(con, roleN, roleD, roleP, roleA);
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

app.use("/setUserRoles", async (req, res) => {
  const SID = req.body.SID;
  const user = req.body.username;

  const target = req.body.targetUsername;
  const roles = req.body.roles;
 
  console.log(user + " " + SID + " " + target + " " + roles);

  if(SID && user && target && roles) {
    let verified = await sessions.verify(con, SID, user);
    let admin = await db.isAdministrator(con, user);
    if(verified && admin) {
      try {
        db.assignRoles(con, target, roles);
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

app.use("/getUserRoles", async (req, res) => {
  const SID = req.body.SID;
  const user = req.body.username;

  const target = req.body.targetUsername;

  let roles = await db.getUserRoles(con, target);

  res.send({roles: roles});
});

app.use("/getUserPermissions", async (req, res) => {
  const SID = req.body.SID;
  const user = req.body.username;

  const target = req.body.targetUsername;

  let perms = await db.getUserPermissions(con, target);

  res.send({permissions: perms});
});

app.use("/test", async (req, res) => {
  let perms = await db.userHasPermission(con, 'Dylang140', 7);

  res.send(perms);
});