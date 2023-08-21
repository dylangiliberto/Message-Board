const express = require("express");
const cors = require('cors');
var mysql = require('mysql');

const db = require('./database');
const sessions = require('./sessions');

const PORT = process.env.PORT || 3001;

const app = express();
const bcrypt = require('bcrypt');

const multer = require('multer');
const upload = multer({ dest: 'images/' });
const uploadPfp = multer({ dest: 'pfp/' });
const fs = require('fs');

let con = db.getConnection();

app.use(cors());
app.use(express.json());
//app.use(express.urlencoded({ extended: true }));

app.use("/api", (req, res) => {
    res.send({
      token: "Hello from my server hehe"
    });
});

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
  console.log("Sending Public User Data! Username: " + req.body.username);
  let d = await db.getUserData(con, req.body.username);
  //console.log(d);
  res.send({
    user: d
  })
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

app.use("/register", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let email = req.body.email;
  let taken = await db.doesUserExist(con, username);
  if(!taken) {
    bcrypt.hash(password, 10, function(err, hash) {
      if(!err) {
        db.createUser(con, username, hash, email);
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
    console.log("File Path: " + file);
    console.log("Verified?: " + verified);
    if(verified === true && user && req.body.comment && thread){
      console.log("Verified! Posting Comment! Username: " + user);
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
    console.log("User " + req.body.username + " attempting log in...");
    let hash = await db.getHashword(con, req.body.username).then(function(rows) {
      return rows;
    });
    let user = await db.getUserData(con, req.body.username).then(function(rows) {
      return rows;
    });
    if(user.username === req.body.username) {
      let token = await sessions.generateSID(con);
      
      let pass = req.body.password;
      hash = hash.replace(/^\$2y(.+)$/i, '$2a$1');
      //console.log("Comapring: " + req.body.password + " with " + hash);
      bcrypt.compare(pass, hash, function(err, v) {
        console.log("Verified: " + v);
        let verified = v || false;
        if(verified) {
          console.log("User " + req.body.username + " Logged in!");
          //console.log(user);
          console.log("Session ID: " + token);
          sessions.registerSID(con, token, req.body.username);
          db.loggedIn(con, req.body.username);
          res.send({
            user: user,
            token: token
          });
        }
        else {
          res.sendStatus(403);
        }
      });
    }
    else {
      res.sendStatus(403);
    }
  }
  else {
    res.send({
      token: false
    });
  }
});

app.use("/logout", async (req, res) => {
  let SID = req.body.token;
  console.log("Logging Out: " + SID);
  //console.log(req.body);
  if(SID)
    db.destroySession(con, SID);
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
  console.log("/threads called....");
  con.query(sql, function (err, result, fields) {
    if (err) throw err;
    res.send({
      threads: result
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
  
  let sendDeleted = false;
  
  if(req?.body?.requestDeleted && user) {
    let isAdmin = await db.isAdministrator(con, req?.body?.username);
    if(isAdmin)
      sendDeleted = true;
  }

  console.log("/comments called");
  console.log("SID: " + SID + " User: " + user);
  if(!SID || (SID && user)){
    let verified = SID ? (await sessions.verify(con, SID, user)) : true;
    if(verified) {
      let comments = await db.getComments(con, threadID, user, sendDeleted);
      let thread = await db.getThreadData(con, threadID);
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

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});