const roleHandle = require('../Models/role.handle');
const status = require('../Config/status.json');
const jwt = require('jsonwebtoken');

const class_GroupFunction = 10;

function verifyToken(req, res, next) {
    const authorizationHeader = req.headers['authorization'];
    if (!authorizationHeader) {
        console.log('Error Header Authorization');
        res.json({status: status.Error, message: 'Error Header Authorization'});
    }
    else {
        token = authorizationHeader.split(' ')[1];
        if (!token) res.json({status: status.Error, message: 'Error Token'});
        else {
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, data) => {
                if (err) res.json({status: status.Unauthorized, message: 'Unauthorized'});
                try { 
                    req.Username = data.Username;
                    req.UserID = data.UserID;
                    next();
                }
                catch {}
            })
        }
    };
}

function checkRole_All(req, res, next) {
    const view_type = 1;
    roleHandle.getRole(req.UserID, class_GroupFunction).then(function(role) {
        if (role.recordset[0].Enable >= view_type) next();
        else res.json({status: status.Forbidden, message: `As a ${role.recordsets[0][0].RoleName}, you cannot access this function!`});
    });
}

module.exports = {
    verifyToken,
    checkRole_All
}