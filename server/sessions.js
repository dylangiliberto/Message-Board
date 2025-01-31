const db = require('./database');
var crypto = require('crypto');
const bcrypt = require('bcrypt');
const mail = require('./mail');
const perms = require('./rolesPermissions');


async function generateSID(con){
    let SID = crypto.randomBytes(16).toString('base64');
    while(await db.doesSIDExist(con, SID)){
        console.log("ID Exists, Regenerating...")
        SID = crypto.randomBytes(16).toString('base64');
    }
    return SID;
}

async function generateKey(con){
    let key = crypto.randomBytes(32).toString('hex');
    while(await db.doesPwdKeyExist(con, key)){
        console.log("Key Exists, Regenerating...")
        key = crypto.randomBytes(32).toString('hex');
    }
    return key;
}

async function registerSID(con, SID, user) {
    db.createSession(con, SID, user);
    console.log("Session Registered");
}

async function getResetRequest(con, username) {
    let sql = "SELECT * FROM `password_resets` WHERE `username` = ? ORDER BY `date_requested` DESC LIMIT 1";
    return new Promise(function(resolve, reject) {
        con.query(sql, [username], function(error, result) {
            if(error) {
                reject();
            }
            resolve(result);
        });
    }); 
}

async function purgeRequests(con, code) {
    let sql = "DELETE FROM `password_resets` WHERE `date_expiry` <= NOW() OR `reset_code` = ?";
    return new Promise(function(resolve, reject) {
        con.query(sql, [code], function(error, result) {
            if(error) {
                reject();
            }
            resolve(result);
        });
    }); 
}

async function verify(con, SID, username, permission) {
    let session = await db.getSession(con, SID);
    let locked = await db.isLocked(con, username);
    console.log("VERIFYING: " + SID + " with " + session.ID);
    //console.log(session);
    if(SID && username && session.ID === SID && session.username === username && locked === 0){
        
        destroyDuplicateSessions(con, username, SID);
        if(permission ? await perms.checkUserPerm(con, username, permission) : true) { //If permission specified in paramaters, verify permission, otherwise true (proceed to regular verification)
            console.log("VERIFIED");
            return [true, true]; //[Verified perm, verified user]
        }
        console.log("VERIFIED, no permission");
        return [false, true]; //[Verified perm, verified user]
    }
    else {
        console.log("NOT VERIFIED");
        return [false, false]; //[Verified perm, verified user]
    }
}

async function destroyDuplicateSessions(con, username, keep) {
    let sessions = await db.getUserSessions(con, username);
    sessions.forEach(element => {
        if(element.ID !== keep)
            db.destroySession(con, element.ID)
    });
}

async function recentRequest(con, username) {
    let sql = "SELECT COUNT(*) FROM `password_resets` WHERE `username` = ? AND `date_requested` >= NOW() - INTERVAL 15 MINUTE";
    return new Promise(function(resolve, reject) {
        con.query(sql, [username], function (err, result) {
            if (err) {
                console.log(err);
            }
            else
                resolve(result[0]['COUNT(*)']);
        }
    )});
}

async function initiatePasswordReset(con, mailer, username, email) {
    let sql = "INSERT INTO `password_resets` (`username`, `date_expiry`, `reset_code`, `email`) VALUES (?, ?, ?, ?)";
    let key = await generateKey(con);
    let link = " <a href='board.dylang140.com/passwordreset/" + key + "'>Reset Password</a><b/>";
    con.query(sql, [username, (new Date(Date.now() + 3600000)).toISOString().slice(0, 19).replace('T', ' '), key, email], function (err, result) {
        if (err) {
            console.log(err);
        }
    });
    mail.sendMail(mailer, email, "Password Reset Request", 
        "<h1>Password Reset Request</h1><h3>A password reset request was made for the account " + 
        username + 
        ".</h3> If you did not request this, ignore this email. Otherwise, use this link to reset your password: \n " +
        link +
        "<p><p/>This link will expire in 1 hour"
    );
}

module.exports = { generateSID, verify, registerSID, initiatePasswordReset, recentRequest, getResetRequest, purgeRequests };

