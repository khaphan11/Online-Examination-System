const authHandle = require('../Models/auth.handle');
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const status = require('../Config/status.json');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "contact.onlxam@gmail.com",
        pass: "onlxampbl6"
    }
})

let refreshTokens = [];

router.post('/login', (req, res) => {
    console.log(`api/auth/login called!!!!`);
    const username = req.body.username;
    const password = req.body.password;
    authHandle.login(username).then(function(user) {
        try {
            bcrypt.compare(password, user.recordset[0].Password).then((isMatch) => {
                if (isMatch) {
                    const accessToken = jwt.sign({UserID: user.recordset[0].UserID, Username: username}, process.env.ACCESS_TOKEN_SECRET, {
                        expiresIn: '1d'
                    });
                    const refreshToken = jwt.sign({UserID: user.recordset[0].UserID, Username: username}, process.env.REFRESH_TOKEN_SECRET);
                    refreshTokens.push(refreshToken);
                    user.recordset[0].Password = '';
                    res.json({status: status.Access, accessToken: accessToken, refreshToken: refreshToken, data: user.recordset[0]});
                }
                else res.json({status: status.Error, message: "Incorrect Username or Password!"});
            })
        }
        catch {
            res.json({status: status.Error, message: "Incorrect Username or Password!"});
        }
    });
})

router.post('/refreshToken', (req, res) => {
    console.log(`api/auth/refreshToken called!!!!`);
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) res.json({ status: status.Unauthorized});
    if (!refreshTokens.includes(refreshToken)) res.json({ status: status.Forbidden });

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, data) => {
        if (err) res.json({status: status.Forbidden});
        const accessToken = jwt.sign({UserID: data.UserID, Username: data.Username}, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '1d'
        });
        res.json({accessToken: accessToken});
    })
})

router.post('/logout', (req, res) => {
    console.log(`api/auth/logout called!!!!`);
    const refreshToken = req.body.refreshToken;
    refreshTokens = refreshTokens.filter(refToken => refToken !== refreshToken);
    res.json({status: status.Success});
})

router.post('/signup', (req, res) => {
    console.log(`api/auth/signup called!!!!`);
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;
    authHandle.getByUsername(username).then((value) => {
        if (value.recordset.length === 1) {
            res.json({status: status.Error, message: "Username Existed!"});
        }
        else {
            authHandle.getByEmail(email).then((value2) => {
                if (value2.recordset.length === 1) {
                    res.json({status: status.Error, message: "Email is already taken!"});
                }
                else {
                    const salt = bcrypt.genSaltSync(10);
                    const hashPassword = bcrypt.hashSync(password, salt);
                    authHandle.signup(username, hashPassword, email).then(result => {
                        const verify_mail = {
                            from: "contact.onlxam@gmail.com",
                            to: `${email}`,
                            subject: "Online Exam - Verify your account",
                            text: `
                                Hello ${username}, thanks for registering on Online Exam.
                                Please click the link below to verify you account.
                                https://onlxam-a.herokuapp.com/api/auth/verify?token=${username}
                            `,
                            html: `
                                <h1>Hello ${username}, Welcome to Online Exam<h1>
                                <p>Thanks for registering on our site.<p>
                                <p>Please click the link below to verify you account.<p>
                                <a href="https://onlxam-a.herokuapp.com/api/auth/verify?token=${username}">Verify your account</a>
                            `
                        }
                        transporter.sendMail(verify_mail, (err, info) => {
                            if (err) {
                                console.error(err)
                            }
                            else res.json({status: status.Access})
                        })
                    });
                }
            });
        }
    });
})

router.get('/verify', (req, res) => {
    console.log(`api/auth/verify called!!!!`);
    const username = req.query.token;
    authHandle.verify(username).then(() => {
        res.json({status: status.Access, message: `Verified account '${username}'. Thanks for your register.`})
    })
})

module.exports = router;
