const express = require('express')
const router = express.Router()
const nodemailer = require('nodemailer');
const axios = require("axios");

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
    axios.post("http://localhost:8080/pdf", {host: req.body.host}).then(function (response) {
        const mailOptions = {
            from: 'getbigmarketingresultaat@gmail.com',
            to: req.body.email,
            subject: "Uw scan resultaten",
            text: "Beste " + req.body.name
            ,
            attachments: [
                {   // use URL as an attachment
                    filename: 'Resultaten.pdf',
                    path: 'pdf/resultaten_'+ response.data.scan_id +'.pdf'
                }]
        };

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error)
                res.send(error)
            } else {
                res.send({"text" : 'Email sent: ' + info.response})
                console.log('Email sent: ' + info.response);
            }
        });
    })


})

module.exports = router
