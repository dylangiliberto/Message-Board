var mysql = require('mysql');
var pwd = require('./passwords');

function getConnection(){
    var con = mysql.createConnection({
        host: "127.0.0.1",
        user: pwd.db_username,
        password: pwd.db_password,
        database: "MessageBoard",
        charset: "utf8mb4_unicode_ci"
    });
    con.connect(function(err) {
        if (err) throw (err);
        console.log("Connected!");
    });
    return con;
}

function getVersion(con) {
    let sql = "SELECT * FROM `server_data` WHERE ID = 1";
    return new Promise(function(resolve, reject) {
        con.query(sql, function(err, result) {
            if(!err) {
                resolve(result[0]);
            }
        })
    });
}

function doesSIDExist(con, SID) {
    let sql = "SELECT * from `sessions` WHERE `ID` = \"" + SID +"\"";
    return new Promise(function(resolve, reject) {
        con.query(sql, function (err, result) {
            if (err) {
                return reject(err);
            }
            if(result[0])
                resolve(true);
            else
                resolve(false);
        });
    });
}

function doesUserExist(con, user) {
    let sql = "SELECT * FROM `users` WHERE `username` = ?";
    return new Promise(function(resolve, reject) {
        con.query(sql, [user], function(err, result) {
            //console.log(result);
            if(result[0] != undefined) {
                if(result[0].username != undefined){
                    resolve(true);
                 }
                else {
                    resolve(false);
                }
            }
            else {
                resolve(false);
            }
        });
    });
}

function createUser(con, username, password, email) {
    let sql = "INSERT INTO `users` (username, password, email, displayName) VALUES (?, ?, ?, ?)";
    con.query(sql, [username, password, email, username]);
}

function getSession(con, SID) {
    let sql = "SELECT * from `sessions` WHERE `ID` = ?";
    return new Promise(function(resolve, reject) {
        con.query(sql, [SID], function (err, result) {
            if (err) {
                resolve("");
            }
            if(result[0])
                resolve(result[0]);
            else
                resolve("");
        });
    });
}

function getUserSessions(con, username) {
    let sql = "SELECT * from `sessions` WHERE `username` = \"" + username +"\"";
    return new Promise(function(resolve, reject) {
        con.query(sql, function (err, result) {
            if (err) {
                return reject(err);
            }
            if(result)
                resolve(result);
            else
                resolve("");
        });
    });
}

function createSession(con, SID, username) {
    let sql = "INSERT INTO `sessions` (ID, username) VALUES (\"" + SID + "\", \"" + username + "\")";

    con.query(sql);
}

function destroySession(con, SID) {
    let sql = "DELETE from `sessions` WHERE `ID` = ? LIMIT 1";
    console.log("Destroying: " + SID);
    con.query(sql, [SID]);
}

function getHashword(con, username) {
    let sql = "SELECT * FROM users WHERE username = \"" + username + "\";";

    return new Promise(function(resolve, reject) {
        con.query(sql, function (err, result) {
            //console.log(result);
            if (err) {
                return reject(err);
            }
            if(result[0])
                resolve(result[0].password);
            else
                resolve("No Such User");
        });
    });
}

function getUserData(con, username) {
    let sql = "SELECT * FROM users WHERE username = \"" + username + "\";";

    return new Promise(function(resolve, reject) {
        con.query(sql, function (err, result) {
            //console.log(result);
            if (err) {
                return reject(err);
            }
            if(result[0])
                resolve(result[0]);
            else
                resolve("No Such User");
        });
    });
}

function loggedIn(con, username) {
    let sql = "UPDATE `users` SET `date_last_logged_in` = CURRENT_TIMESTAMP WHERE `username` = ? LIMIT 1";
    con.query(sql, [username]);
}

function isCommentAuthor(con, comment, username) {
    let sql = "SELECT `username` FROM  `comment` WHERE `id` = ?";
    console.log(comment.ID + " " + username);
    return new Promise(function(resolve, reject) {
        con.query(sql, [comment.ID], function (err, result) {
            if(err)
                return reject(err);
            if(result){
                if(result[0].username === username)
                    resolve(true);
                resolve(false);
            }
            else
                resolve(false);
        }
    )});
}

function postComment(con, comment, thread, username, imageURL) {
    let sql = "INSERT INTO `comment` (username, thread, body, title, imageURL) VALUES (?,?,?,?,?)";
    con.query(sql, [username, thread, comment, "No Title", imageURL]);
    sql = "UPDATE `thread` SET `last_activity` = CURRENT_TIMESTAMP(), `NumComments` = `NumComments` + 1 WHERE `ID` = ?";
    con.query(sql, [thread]);
}

function deleteComment(con, setDeleted, comment, thread) {
    let sql = "UPDATE `comment` SET `deleted` = ? WHERE `ID` = ? LIMIT 1";
    con.query(sql, [setDeleted, comment]);
    if(setDeleted === 1) {
        sql = "UPDATE `thread` SET `NumComments` = `NumComments` - 1, `last_activity` = (SELECT IFNULL(" +
            " (SELECT `time_created` FROM `comment` WHERE `comment`.`thread` = `thread`.`ID` AND `comment`.`deleted` = 0" +
            " ORDER BY `time_created` DESC LIMIT 1), `thread`.`date_created`)) WHERE `ID`= ?";
        con.query(sql, [thread]);
    }
    else {
        sql = "UPDATE `thread` SET `NumComments` = `NumComments` + 1 WHERE `ID` = ?";
        con.query(sql, [thread]);
        console.log("Restored Comment ID: " + comment)
    }
}

function deleteCommentPerm(con, comment, thread) {
    //Erase comment from database
    let sql = "DELETE FROM `comment` WHERE `ID` = ? LIMIT 1";
    con.query(sql, [comment]);
    //Decrement comment count on thread
    //Nevermind don't do that, it's already done in deleteComment, which must be called first
}

function getComments(con, thread, user, getDeleted) {
    if(!user) {
        let sql = 'SELECT `comment`.*, `users`.`imageURL` AS `pfpURL`, `users`.`displayName`, `users`.`displayNameHex`' +
                ' FROM `comment` LEFT JOIN `users` ON `users`.`username` = `comment`.`username`' +
                ' WHERE `comment`.`thread` = ? AND `deleted` = 0 AND `inReplyTo` IS NULL' +
                ' ORDER BY `comment`.`time_created` DESC';
        return new Promise(function(resolve, reject) {
            con.query(sql, [thread], function (err, result) {
                if(err)
                    return reject(err);
                if(result[0])
                    resolve(result);
                else
                    resolve({});
            }
        )});
    }
    else {
        let sql = '';
        if(getDeleted) {
            sql = 'SELECT `comment`.*, `likes`.`like_ID`, `users`.`imageURL` AS `pfpURL`, `users`.`displayName`, `users`.`displayNameHex`' +
            ' FROM `comment` LEFT JOIN `likes` ON `likes`.comment_id=`comment`.id AND `likes`.`username` = ?' +
            ' LEFT JOIN `users` ON `users`.`username` = `comment`.`username`' +
            ' WHERE thread = ? AND `inReplyTo` IS NULL ORDER BY time_created DESC';
        }
        else {
            sql = 'SELECT `comment`.*, `likes`.`like_ID`, `users`.`imageURL` AS `pfpURL`, `users`.`displayName`, `users`.`displayNameHex`' +
            ' FROM `comment` LEFT JOIN `likes` ON `likes`.comment_id=`comment`.id AND `likes`.`username` = ?' +
            ' LEFT JOIN `users` ON `users`.`username` = `comment`.`username`' +
            ' WHERE thread = ? AND deleted = 0 AND `inReplyTo` IS NULL ORDER BY time_created DESC';
        }
        return new Promise(function(resolve, reject) {
            con.query(sql, [user, thread], function (err, result) {
                if(err)
                    return reject(err);
                if(result[0])
                    resolve(result);
                else
                    resolve({});
            }
        )});
    }
}

function getTopTwoReplies(con, comment) {
    sql = "SELECT `comment`.*, `users`.`displayName`, `users`.`displayNameHex` " +
            "FROM `comment` " +
            "LEFT JOIN `users` ON `users`.`username` = `comment`.`username` " +
            "WHERE `inReplyTo` = ? " +
            "ORDER BY `time_created` DESC LIMIT 2";
    return new Promise(function(resolve, reject) {
        con.query(sql, [comment], function (err, result) {
            if(err)
                return reject(err);
            if(result[0])
                resolve(result[0]);
            else
                resolve({});
        }
    )});
}

function isCommentLiked(con, comment, user) {
    let sql = "SELECT COUNT(*) FROM `likes` WHERE `username` = ? AND `comment_id` = ?";
    return new Promise(function(resolve, reject) {
        con.query(sql, [user, comment], function (err, result) {
            //console.log(result[0]['COUNT(*)']);
            if(err)
                return reject(err);
            if(result[0]['COUNT(*)'] > 0)
                resolve(true);
            else
                resolve(false);
        }
    )});
}

function likeComment(con, comment, user) {
    let sql = "UPDATE `comment` SET `likes` = `likes` + 1 WHERE `ID` = ?";
    con.query(sql, [comment]);
    sql = "INSERT INTO `likes` (username, comment_id) VALUES (?, ?)";
    con.query(sql, [user, comment]);
    sql = "SELECT `likes` FROM `comment` WHERE `ID` = ?";
    return new Promise(function(resolve, reject) {
        con.query(sql, [comment], function (err, result) {
            if(err)
                return reject(err);
            resolve(result);
        }
    )});
}

function unlikeComment(con, comment, user) {
    let sql = "UPDATE `comment` SET `likes` = `likes` - 1 WHERE `ID` = ?";
    con.query(sql, [comment]);
    sql = "DELETE FROM `likes` WHERE `username` = ? AND `comment_id` = ?";
    con.query(sql, [user, comment]);
    sql = "SELECT `likes` FROM `comment` WHERE `ID` = ?";
    return new Promise(function(resolve, reject) {
        con.query(sql, [comment], function (err, result) {
            if(err)
                return reject(err);
            resolve(result);
        }
    )});
}

function getThreadData(con, thread) {
    sql = "SELECT `thread`.*, `users`.`displayName` FROM `thread` LEFT JOIN `users` ON `users`.`username` = `thread`.`username` WHERE `thread`.`ID` = ?";
    return new Promise(function (resolve, reject) {
        con.query(sql, [thread], function (err, result, fields) {
            if (err) reject(err);
            else resolve(result);
          });
    });
}

function createThread(con, title, desc, username) {
    let sql = "INSERT INTO `thread` (username, title, description) VALUES (?, ?, ?)";
    con.query(sql, [username, title, desc], function (err, result, fields) {
        if (err) throw err;
    });
}

function lockThread(con, thread, lock) {
    let sql = "UPDATE `thread` SET `locked` = ? WHERE `ID` = ? LIMIT 1";
    con.query(sql, [lock, thread]);
}

function deleteThread(con, thread, deleted) {
    let sql = "UPDATE `thread` SET `deleted` = ? WHERE `ID` = ? LIMIT 1";
    con.query(sql, [deleted, thread]);
}

function archiveThread(con, thread, archived) {
    let sql = "UPDATE `thread` SET `archived` = ? WHERE `ID` = ? LIMIT 1";
    con.query(sql, [archived, thread]);
}

function updateBio(con, bio, username) {
    let sql = "UPDATE `users` SET `user_bio` = ? WHERE `username` = ? LIMIT 1";
    console.log("Set new Bio!");
    con.query(sql, [bio, username]);
}

function updateUsername(con, newName, username) {
    let sql = "UPDATE `users` SET `username` = ? WHERE `username` = ? LIMIT 1";
    console.log("Set new Username for " + username + "!");
    con.query(sql, [newName, username]);
}

function updateDisplayName(con, newName, username, hex) {
    if(hex) {
        try {
            let sql = "UPDATE `users` SET `displayName` = ?, `displayNameHex` = ? WHERE `username` = ? LIMIT 1";
            console.log("Set new Display Name for " + username + "!");
            con.query(sql, [newName, hex, username]);
        }
        catch {
            console.log("Error updating display name!");
        }
    }
    else {
        try {
            let sql = "UPDATE `users` SET `displayName` = ? WHERE `username` = ? LIMIT 1";
            console.log("Set new Display Name for " + username + "!");
            con.query(sql, [newName, hex, username]);
        }
        catch {
            console.log("Error updating display name!");
        }
    }
}

function updatePfp(con, pfpURL, username) {
    let sql = "UPDATE `users` SET `imageURl` = ? WHERE `username` = ? LIMIT 1";
    console.log("Set new PFP!");
    con.query(sql, [pfpURL, username]);
}

function isAdministrator(con, username) {
    if(username){
        let sql = "SELECT administrator FROM users WHERE username = ?";
        console.log('Verifying Admin');
        return new Promise(function(resolve, reject) {
            con.query(sql, [username], function (err, result) {
                if(err)
                    return reject(err);
                resolve(result[0].administrator);
            }
        )});
    }
    else {
        return false;
    }
}

module.exports = { getConnection, getVersion, getHashword, getUserData, createUser, doesSIDExist, doesUserExist, getSession, getUserSessions, 
    createSession, destroySession, postComment, getComments, isCommentLiked, likeComment, unlikeComment, getThreadData, deleteComment, deleteCommentPerm,
    loggedIn, createThread, lockThread, deleteThread, archiveThread, updateBio, updatePfp, updateUsername, updateDisplayName, isAdministrator,
    getTopTwoReplies, isCommentAuthor };