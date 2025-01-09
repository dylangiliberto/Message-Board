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
        console.log("Successfully Connected to Database!");
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

function isLocked(con, username) {
    let sql = "SELECT `locked` from `users` WHERE `username` = ?";
    return new Promise(function(resolve, reject) {
        con.query(sql, [username], function (err, result) {
            if (err) {
                resolve("");
            }
            if(result[0])
                resolve(result[0].locked);
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

function countThreads(con, deleted) {
    let sql = "SELECT COUNT (*) FROM `thread` WHERE `archived` = 0 AND`deleted` = 0";
    if(deleted) {
        sql = "SELECT COUNT (*) FROM `thread` WHERE `archived` = 0";
    }
    
    return new Promise(function(resolve, reject) {
       con.query(sql, function(err, result) {
            if(err)
                reject(err);
            else{
                resolve(result[0]["COUNT (*)"]);
            }
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

function getUserData(con, username) {
    let sql = "SELECT * FROM users WHERE username = ?;";

    return new Promise(function(resolve, reject) {
        con.query(sql, [username], function (err, result) {
            if (err) {
                return reject(err);
            }
            if(result[0]){
                resolve(result[0]);
            }
                
            else
                resolve("No Such User");
        });
    });
}

function getPublicUserData(con, username) {
    let sql = "SELECT `username`,`imageURL`,`displayName`,`displayNameHex`,`user_bio`,`date_created`,`date_last_logged_in` FROM users WHERE username = ?;";

    return new Promise(function(resolve, reject) {
        con.query(sql, [username], function (err, result) {
            if (err) {
                return reject(err);
            }
            if(result[0]){
                resolve(result[0]);
            }
                
            else
                resolve("No Such User");
        });
    });
}

function loggedIn(con, username) {
    let sql = "UPDATE `users` SET `date_last_logged_in` = CURRENT_TIMESTAMP WHERE `username` = ? LIMIT 1";
    con.query(sql, [username]);
}

function lockAccount(con, username) {
    let sql = "UPDATE `users` SET `locked` = ? WHERE `username` = ? LIMIT 1";
    con.query(sql, [1, username]);
}
function unlockAccount(con, username) {
    let sql = "UPDATE `users` SET `locked` = ? WHERE `username` = ? LIMIT 1";
    con.query(sql, [0, username]);
}

function isCommentAuthor(con, comment, username) {
    let sql = "SELECT `username` FROM  `comment` WHERE `id` = ?";
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
        console.log('Verifying Admin for' + username);
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

function getRolesList(con) {
    let sql = "SELECT * FROM `roles`";
    console.log('Getting Roles List');
    return new Promise(function(resolve, reject) {
        con.query(sql, function (err, result) {
            if(err)
                return reject(err);
            resolve(result);
        }
    )});
}

function getPermissionsList(con) {
    let sql = "SELECT * FROM `permissions`";
    console.log('Getting Permissions List');
    return new Promise(function(resolve, reject) {
        con.query(sql, function (err, result) {
            if(err)
                return reject(err);
            resolve(result);
        }
    )});
}

function getRolesPermissionsList(con) {
    let sql = "SELECT * FROM `role_permissions`";
    console.log('Getting Role Permissions List');
    return new Promise(function(resolve, reject) {
        con.query(sql, function (err, result) {
            if(err)
                return reject(err);
            resolve(result);
        }
    )});
}

function setPermission(con, role, permission, val) {
    let sql = "SELECT `role_permissionID` FROM `role_permissions` WHERE `roleID` = ? AND `permissionID` = ?";
    
    con.query(sql, [role, permission], function (err, result) {
        let exists = result[0] ? true : false;
        if(err)
            return reject(err);
        else if(exists && val === 0) {
            console.log("Removing: " + role + " " + permission);
            let sql = "DELETE FROM `role_permissions` WHERE `roleID` = ? AND `permissionID` = ? LIMIT 1";
            con.query(sql, [role, permission]);
        }
        else if(!exists && val > 0) {
            console.log("Adding: " + role + " " + permission);
            let sql = "INSERT  INTO `role_permissions` (`roleID`, `permissionID`) VALUES (?, ?);";
            con.query(sql, [role, permission]);
        }
    });
}

function addRole(con, roleName, roleDisplayName, rolePriority, roleAbreviation) {
    let sql = "INSERT INTO `roles` (`roleName`, `roleDisplayName`, `rolePriority`, `roleAbreviation`) VALUES (?,?,?,?)";
    con.query(sql, [roleName, roleDisplayName, rolePriority, roleAbreviation]);
}

function assignRole(con, username, roleID) {
    let sql = "INSERT INTO `user_roles` (`username`, `roleID`) VALUES (?, ?);"
    con.query(sql, [username, roleID]);
}

function setPassword(con, username, newPassword) {
    let sql = "UPDATE `MessageBoard`.`users` SET `password` = ? WHERE (`username` = ?)";
    con.query(sql, [newPassword, username]);
}

function logAction(con, username, action, action_id, ip) {
    let sql = "INSERT INTO `MessageBoard`.`logs` (`username`, `action`, `action_item_id`, `ip_address`) VALUES (?,?,?,?)";
    con.query(sql, [username, action, action_id, ip]);
}

function getLogs(con, num, offset) {
    let sql = "SELECT * FROM `logs` ORDER BY `ID` DESC LIMIT ?";
    return new Promise(function(resolve, reject) {
        con.query(sql, [num], function(error, result) {
            if(error) {
                reject();
            }
            resolve(result);
        });
    });
}

async function assignRoles(con, username, roles) { //Given an array of [int roleID, bool assigned], assigns users roles
    let sql;
    let exists;
    for(let i = 0; i < roles.length; i++) {
        sql = "SELECT `user_roleID` FROM `user_roles` WHERE `username` = ? AND `roleID` = ?;";
        exists = await con.query(sql, [username, roles[i][0]]); //roles should be 2d array, [[roleID, val],[roleID, val]]
        if(exists){
            exists = exists[0]?.user_roleID > 0;
            if(exists && roles[i][1] === 0){ //Delete if entry exists and shoud not
                sql = "DELETE FROM `user_roles` WHERE `username` = ? AND `roleID` = ? LIMIT 1;";
                con.query(sql, [username, role[i]]);
            }
            else if(!exists && roles[i][1] === 1) { //Insert if entry does not exist but should
                sql = "INSERT INTO `user_roles` (`username`, `roleID`) VALUES (?, ?);";
                con.query(sql, [username, role[i]]);
            }//Otherwise do nothing (doesnt and shouldnt exist, or does and should exist)
        }
    }
    con.query(sql, [username, roleID]);
}

function getUserRoles(con, username) {
    let sql = "SELECT `roles`.`roleID`, `roles`.`roleDisplayName` FROM MessageBoard.user_roles LEFT JOIN `roles` ON `user_roles`.`roleID` = `roles`.`roleID` WHERE `username` = ?;";
    return new Promise(function(resolve, reject) {
        con.query(sql, [username], function(error, result) {
            if(error) {
                reject();
            }
            resolve(result);
        });
    });
}

function getUserPermissions(con, username) {
    let sql = "SELECT `permissionID` FROM `role_permissions` WHERE `roleID` = (" +
    "SELECT `user_roles`.`roleID` FROM MessageBoard.user_roles LEFT JOIN `roles` ON " + 
    "`roles`.`roleID` = `user_roles`.`roleID` WHERE `username` = ? ORDER BY `roles`.`rolePriority` DESC LIMIT 1);";
    console.log("getting user perms for " + username);
    return new Promise(function(resolve, reject) {
        con.query(sql, [username], function(error, result) {
            if(error) {
                console.log(error);
                reject();
            }
            resolve(result.permissionID);
        });
    });
}

function getUsersHighestRole(con, username) {
    let sql = "SELECT `user_roles`.`roleID` FROM MessageBoard.user_roles LEFT JOIN `roles` ON `roles`.`roleID` = `user_roles`.`roleID` WHERE `username` = ? ORDER BY `roles`.`rolePriority` DESC LIMIT 1;";
    return new Promise(function(resolve, reject) {
        con.query(sql, [username], function(error, result) {
            if(error) {
                reject();
            }
            resolve(result);
        });
    });
}

async function userHasPermission(con, username, permissionID) {
    let roleID = await getUsersHighestRole(con, username);
    if(roleID[0]?.roleID) {
        let sql = "SELECT `role_permissionID` FROM `role_permissions` WHERE `roleID` = ? AND `permissionID` = ?";
        let res = await new Promise(function(resolve, reject) {
            con.query(sql, [roleID[0].roleID, permissionID], function(error, result) {
                if(error) {
                    console.log(error);
                    resolve(false);
                }
                resolve(result);
            });
        });
        return res[0]?.role_permissionID > 0;
    }
    else {
        console.log("No roleID");
        return false;
    }
}

module.exports = { getConnection, getVersion, getUserData, createUser, doesSIDExist, doesUserExist, getSession, getUserSessions, 
    createSession, destroySession, postComment, getComments, isCommentLiked, likeComment, unlikeComment, getThreadData, deleteComment, deleteCommentPerm,
    loggedIn, createThread, lockThread, deleteThread, archiveThread, updateBio, updatePfp, updateUsername, updateDisplayName, isAdministrator,
    getTopTwoReplies, isCommentAuthor, getRolesList, getPermissionsList, getRolesPermissionsList, setPermission, addRole, assignRole, assignRoles, getUserRoles,
    getUserPermissions, getUsersHighestRole, userHasPermission, countThreads, isLocked, getPublicUserData, lockAccount, unlockAccount, setPassword, logAction, getLogs };