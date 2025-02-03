async function getReport(con, report){
    switch(report) {
        case "site":
            let r = await getSiteReport(con);
            return r;

    }
}

async function getSiteReport(con) {
    let sql = "CALL `Messageboard`.`messageSiteCountsReport`();"
    return con.query(sql, function (err, result) {
        if (err) {
            return reject(err);
        }
        if(result){
            resolve(result);
        }
    });
}

module.exports = { getReport };

