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
        pass: 'mrdpriigoykjiada'
    }
});

router.post('/', (req, res) => {
    let path = null;
    let encryptedData = req.body;
    let privateKey = fs.readFileSync("privatykey.key", "utf8");
    let toDecryptData = encryptedData.toString();
    console.log("toDecryptData::: " + toDecryptData);
    decryptedDataFromAngular(toDecryptData, privateKey);
    console.log("DECRYPTED-DATA: " + decryptedDataFromAngular);
    axios.post("http://localhost:8080/pdf", {host: encryptedData.host}).then(async function (response) {
        path = response.data.scan_id;

    }).then(() => {
        if(fs.existsSync('pdf/resultaten_'+ path +'.pdf')){
            const mailOptions = {
                from: 'getbigmarketingresultaat@gmail.com',
                to: encryptedData.email,
                subject: "Uw scan resultaten",
                text: "Beste " + encryptedData.name + ",\n\n In de PDF vindt u de resultaten van de security check.\n\n Met vriendelijke groet, \n\n Get Big Marketing",
                attachments: [
                    {
                        filename: 'Test-Resultaten\: ' +"'"+ encryptedData.host +"'"+ '.pdf',
                        path: 'pdf/resultaten_'+ path +'.pdf'
                    }]
            };
            sendmail(mailOptions, res)
        }else{
            axios.post("http://localhost:8080/sendemail", req.body).then(r => {

            })
        }
    });
})

function decryptedDataFromAngular(encryptedData, privateKey) {
    encryptedData = Buffer.from(encryptedData, "base64");
    console.log("ENCRYPTED DATA 2222:::: " + encryptedData.toString());
    const decryptedData = crypto.privateDecrypt(
        {
            key: privateKey,
            // In order to decrypt the data, we need to specify the
            // same hashing function and padding scheme that we used to
            // encrypt the data in the previous step
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        encryptedData
    );
    console.log("decrypted data: ", decryptedData.toString());
    console.log("DE RAW DATA" + decryptedData);
    return decryptedData;
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
