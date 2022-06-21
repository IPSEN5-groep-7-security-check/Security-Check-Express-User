const forge = require('node-forge')
const express = require('express')
const router = express.Router()
const nodemailer = require('nodemailer');
const axios = require("axios");
const fs = require("fs");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'getbigmarketingresultaat@gmail.com',
        pass: 'mrdpriigoykjiada'
    }
});
const PRIVATE_KEY = fs.readFileSync("privateKey.key.pem", "utf8");

function emailPdfGenerator(encryptedData, path) {
    if (fs.existsSync('pdf/resultaten_' + path + '.pdf')) {
        const mailOptions = {
            from: 'getbigmarketingresultaat@gmail.com',
            to: encryptedData.email,
            subject: "Uw scan resultaten",
            text: "Beste " + encryptedData.name + ",\n\n In de PDF vindt u de resultaten van de security check.\n\n Met vriendelijke groet, \n\n Get Big Marketing",
            attachments: [
                {
                    filename: 'Test-Resultaten\: ' + "'" + encryptedData.host + "'" + '.pdf',
                    path: 'pdf/resultaten_' + path + '.pdf'
                }]
        };
        sendmail(mailOptions, res)
    } else {
        axios.post("http://localhost:8080/sendemail", encryptedData).then(r => {

        })
    }
}

router.post('/', async (req, res) => {
    console.log("POST======")
    let path = null;
    const encryptedUserData = req.body;
    // console.log("RECEIVED ENCRYPTED BODY: " + JSON.stringify(encryptedUserData));
    // console.log("toDecryptData::: " + encryptedUserData);
    // console.log("IS NAME === HOST?1 ", encryptedUserData.name === encryptedUserData.host);
    const decryptedUserData = await decryptUser(encryptedUserData)
    // console.log("IS NAME === HOST?2 ", encryptedUserData.name === encryptedUserData.host);
    // console.log("DECRYPTED-DATA: " + JSON.stringify(decryptedUserData));
    // console.log("IS NAME === HOST?3 ", encryptedUserData.name === encryptedUserData.host);
    axios.post("http://localhost:8080/pdf", {host: decryptedUserData.host}).then(async function (response) {
        path = response.data.scan_id;

    }).then(() => {
        emailPdfGenerator(decryptedUserData, path);
    });
})

async function decryptUser(encryptedUserData) {
    const name = await decryptString(encryptedUserData.name);
    // console.log("NAME::: ", encryptedUserData.name.substring(0,6)," ||||| ",name);
    const email = await decryptString(encryptedUserData.email);
    // console.log("EMAIL::: ", encryptedUserData.email.substring(0,6)," ||||| ",email);
    const host = await decryptString(encryptedUserData.host);
    // console.log("HOST::: ", encryptedUserData.host.substring(0,6)," ||||| ",host);

    const decryptedUser = {
        name: name,
        email: email,
        host: host,
    }
    console.log("DECRYPTED USERRRR: ", decryptedUser);
    return decryptedUser

}

async function decryptString(encryptedString) {
    const rsa = forge.pki.privateKeyFromPem(PRIVATE_KEY);
    console.log("STRING LEN::: ", encryptedString.length)
    return await rsa.decrypt(encryptedString);
}

function sendmail(mailOptions, res){
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error)
            res.send(error)
        } else {
            res.send({"text" : 'Email sent: ' + info.response})
            console.log('Email sent: ' + info.response);
        }
    });
}

module.exports = router
