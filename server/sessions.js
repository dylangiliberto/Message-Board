const db = require('./database');
var crypto = require('crypto');

async function generateSID(con){
    let SID = crypto.randomBytes(16).toString('base64');
    while(await db.doesSIDExist(con, SID)){
        console.log("ID Exists, Regenerating...")
        SID = crypto.randomBytes(16).toString('base64');
    }
    return SID;
}

async function registerSID(con, SID, user) {
    db.createSession(con, SID, user);
    console.log("Session Registered");
}

async function verify(con, SID, username) {
    let session = await db.getSession(con, SID);
    console.log("VERIFYING: " + SID + " with " + session.ID);
    //console.log(session);
    if(SID && username && session.ID === SID && session.username === username){
        console.log("VERIFIED");
        destroyDuplicateSessions(con, username, SID);
        return true;
    }
    else {
        console.log("NOT VERIFIED");
        return false;
    }
}

async function destroyDuplicateSessions(con, username, keep) {
    let sessions = await db.getUserSessions(con, username);
    sessions.forEach(element => {
        if(element.ID !== keep)
            db.destroySession(con, element.ID)
    });
}

module.exports = { generateSID, verify, registerSID };

