function findPermission(perms, perm) {
    for(let i = 0; i < perms.length; i++){
        if(perms[i].permissionID === perm)
            return true; 
    } 
}

module.exports = {findPermission}; 