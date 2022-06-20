const express = require('express')
const router = express.Router()
const nodemailer = require('nodemailer');
const axios = require("axios");
const fs = require("fs");
const crypto = require("crypto");
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'getbigmarketingresultaat@gmail.com',
        pass: 'onsMooiWachtwoord'
    }
});

function fillPdfFileWithRightInfo(encryptedData) {
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
    return mailOptions;
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

function emailPdfGenerator(encryptedData) {
    if (fs.existsSync('pdf/resultaten_' + path + '.pdf')) {
        sendmail(fillPdfFileWithRightInfo(encryptedData), res);
    } else {
        axios.post("http://localhost:8080/sendemail", req.body).then(() => {
        })
    }
}

router.post('/', async (req, res) => {
    let path = null;
    const encryptedData = req.body;
    console.log("RECEIVED ENCRYPTED BODY: " + encryptedData);

    const privateKey = fs.readFileSync("privateKey.key.pem", "utf8");
    console.log("toDecryptData::: " + encryptedData);

    const decryptedData = decryptAngularEncryptedDataRequest(encryptedData, privateKey);
    console.log("DECRYPTED-DATA: " + decryptedData);
    axios.post("http://localhost:8080/pdf", {host: encryptedData.host}).then(async function (response) {
        path = response.data.scan_id;

    }).then(() => {
        emailPdfGenerator(encryptedData);
    });
})

function decryptAngularEncryptedDataRequest(encryptedData, privateKey) {
    // encryptedData = Buffer.from(encryptedData, "base64");
    const toDecryptData = JSON.parse(encryptedData);
    // console.log("ENCRYPTED DATA 2222:::: " + encryptedData);
    console.log("ENCRYPTED DATA 2222:::: " + body);
    const decryptedData = crypto.privateDecrypt(
        {
            key: privateKey,
            // In order to decrypt the data, we need to specify the
            // same hashing function and padding scheme that we used to
            // encrypt the data in the previous step
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        toDecryptData
    );
    console.log("decrypted data: ", decryptedData.toString());
    console.log("DE RAW DATA" + decryptedData);
    return decryptedData;
}

module.exports = router
