const forge = require('node-forge')
const express = require('express')
const router = express.Router()
const nodemailer = require('nodemailer');
const axios = require("axios");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'getbigmarketing2@gmail.com',
        pass: 'zagmasaoafwwjpxj'
    }
});
const apiURL = "https://security-check-user-express.herokuapp.com";
const PRIVATE_KEY = fs.readFileSync("privateKey.key.pem", "utf8");

function emailPdfGenerator(decryptedData, path, res) {
    if (fs.existsSync('pdf/resultaten_' + path + '.pdf')) {
        const mailOptions = {
            from: 'getbigmarketingresultaat@gmail.com',
            to: decryptedData.email,
            subject: "Uw scan resultaten",
            text: "Beste " + decryptedData.name + ",\n\n In de PDF vindt u de resultaten van de security check.\n\n Met vriendelijke groet, \n\n Get Big Marketing",
            attachments: [
                {
                    filename: 'Test-Resultaten\: ' + "'" + decryptedData.host + "'" + '.pdf',
                    path: 'pdf/resultaten_' + path + '.pdf'
                }]
        };
        sendmail(mailOptions, res)
    }
}

router.post('/', async (req, res) => {
    let path = null;
    const encryptedUserData = req.body;
    const decryptedUserData = await decryptUser(encryptedUserData);
    axios.post(apiURL + "/pdf", {host: decryptedUserData.host}).then(async function (response) {
        path = response.data.scan_id;
        await prisma.User.upsert({
            where: {
                email: decryptedUserData.email,
            },
            update: {},
            create: {
                email: decryptedUserData.email
            },
        });
    }).then(() => {
        emailPdfGenerator(decryptedUserData, path, res);
    });
})

async function decryptUser(encryptedUserData) {
    const name = await decryptString(encryptedUserData.name);
    const email = await decryptString(encryptedUserData.email);
    const host = await decryptString(encryptedUserData.host);

    const decryptedUser = {
        name: name,
        email: email,
        host: host,
    }
    return decryptedUser

}

async function decryptString(encryptedString) {
    const rsa = forge.pki.privateKeyFromPem(PRIVATE_KEY);
    return await rsa.decrypt(encryptedString);
}

function sendmail(mailOptions, res){
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            res.send(error)
        } else {
            res.send({"text" : 'Email sent: ' + info.response})
        }
    });
}
module.exports = router
