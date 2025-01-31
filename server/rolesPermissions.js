async function checkUserRole(con, username, roleID){ //Check if user has a role
    let sql = "SELECT * FROM `roles` WHERE `roleID` IN(SELECT `roleID` from `user_roles` WHERE `username` = 'sikey' AND `roleID` = ?)";
    return new Promise(function(resolve, reject) {
        con.query(sql, [username, roleID], function (err, result) {
            if (err) {
                console.log(err);
            }
            else
                resolve(result);
        }
    )});
}

async function checkUserPerm(con, username, permID){ //Check if user has given permission ID
    let sql = "SELECT * FROM `permissions` WHERE `permissionID` IN (SELECT `permissionID` FROM `role_permissions` WHERE `roleID` IN (SELECT `roleID` from `user_roles` WHERE `username` = ?)) AND `permissionID` = ?";
    return new Promise(function(resolve, reject) {
        con.query(sql, [username, permID], function(error, result) {
            if(error) {
                reject();
            }
            resolve(result[0] == null ? false : true);
        });
    });
}

async function getUserRoles(con, username){ //Get all roles for a user
    let sql = "SELECT * FROM `roles` WHERE `roleID` IN (SELECT `roleID` from `user_roles` WHERE `username` = ?)";
    return new Promise(function(resolve, reject) {
        con.query(sql, [username], function(error, result) {
            if(error) {
                reject();
            }
            resolve(result);
        });
    });
}

async function getUserRolesTruthTable(con, username) {
    let sql = "SELECT `roles`.*, !ISNULL(`userRoles`.`roleID`) AS `hasRole` FROM `roles` LEFT JOIN (SELECT * FROM `roles` WHERE `roleID` IN (SELECT `roleID` from `user_roles` WHERE `username` = ?)) AS `userRoles` ON `roles`.`roleID` = `userRoles`.`roleID`";
    return new Promise(function(resolve, reject) {
        con.query(sql, [username], function(error, result) {
            if(error) {
                reject();
            }
            resolve(result);
        });
    });
}

async function getUserPerms(con, username){ //Get all permissions for a user
    let sql = "SELECT * FROM `permissions` WHERE `permissionID` IN (SELECT `permissionID` FROM `role_permissions` WHERE `roleID` IN (SELECT `roleID` from `user_roles` WHERE `username` = ?))";
    return new Promise(function(resolve, reject) {
        con.query(sql, [username], function(error, result) {
            if(error) {
                reject();
            }
            resolve(result);
        });
    });
}

async function revokeRole(con, username, roleID){ //Revoke a role from a user
    let sql = "DELETE FROM `user_roles` WHERE `username` = ? AND `roleID` = ? LIMIT 1"
    con.query(sql, [username, roleID]);
}

async function assignRole(con, username, roleID) { //Assign a user a new role
    let sql = "INSERT INTO `user_roles` (`username`, `roleID`) VALUES (?, ?);"
    con.query(sql, [username, roleID]);
}

async function getRolesList(con) { //Get list of all roles
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

async function getPermissionsList(con) { //Get list of all permissions
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

async function getRolesPermissionsList(con) { //Get list of all roles and permissions
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

async function setPermission(con, role, permission, val) { //Assign or remove permission from role
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

async function addRole(con, roleName, roleDisplayName, rolePriority, roleAbreviation, roleSite) { //Create new role, does not work well because web page does not work with non-sequentially ID'd roles
    let sql = "SELECT COUNT(*) FROM `roles`";
    let roleID = await new Promise(function(resolve, reject) {
        con.query(sql, function (err, result) {
            if(err)
                return reject(err);
            resolve(result);
        }
    )});
    sql = "INSERT INTO `roles` (`roleID`,`roleName`, `roleDisplayName`, `rolePriority`, `roleAbreviation`, `siteName`) VALUES (?,?,?,?,?,?)";
    con.query(sql, [roleID[0]['COUNT(*)'] + 1, roleName, roleDisplayName, rolePriority, roleAbreviation, roleSite]);
}

async function assignRoles(con, username, roles) { //BORKED ... Given an array of [int roleID, bool assigned], assigns users roles
    let sql;
    for(let i = 0; i < roles.length; i++) {  
        if(roles[i][1] === 0){ //Delete if entry exists and shoud not
            console.log("Removing Role " + roles[i] + " for " + username);
            sql = "DELETE FROM `user_roles` WHERE `username` = ? AND `roleID` = ? LIMIT 1;";
            con.query(sql, [username, role[i]]);
        }
        else if(roles[i][1] === 1) { //Insert if entry does not exist but should
            console.log("Adding Role " + roles[i] + " for " + username);

            sql = "INSERT INTO `user_roles` (`username`, `roleID`) VALUES (?, ?);";
            con.query(sql, [username, role[i]]);
        }//Otherwise do nothing (doesnt and shouldnt exist, or does and should exist)
    }
}

/* async function getUserRoles(con, username) {
    let sql = "SELECT `roles`.`roleID`, `roles`.`roleDisplayName` FROM MessageBoard.user_roles LEFT JOIN `roles` ON `user_roles`.`roleID` = `roles`.`roleID` WHERE `username` = ?;";
    return new Promise(function(resolve, reject) {
        con.query(sql, [username], function(error, result) {
            if(error) {
                reject();
            }
            resolve(result);
        });
    });
} */

/* async function getUserPermissions(con, username) {
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
} */

async function getUserHighestRole(con, username) {
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

module.exports = { checkUserPerm, checkUserRole, getUserRoles, getUserPerms, assignRole, assignRoles, revokeRole, getRolesList, getPermissionsList, getRolesPermissionsList, setPermission, addRole, getUserHighestRole, getUserRolesTruthTable };

