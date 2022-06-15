const express = require('express')
const router = express.Router()
const nodemailer = require('nodemailer');
const axios = require("axios");
const fs = require("fs");

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
    axios.post("http://localhost:8080/pdf", {host: req.body.host}).then(async function (response) {
        path = response.data.scan_id

    }).then(() => {
        if(fs.existsSync('pdf/resultaten_'+ path +'.pdf')){
            const mailOptions = {
                from: 'getbigmarketingresultaat@gmail.com',
                to: req.body.email,
                subject: "Uw scan resultaten",
                text: "Beste " + req.body.name + ",\n\n In de PDF vindt u de resultaten van de security check.\n\n Met vriendelijke groet, \n\n Get Big Marketing",
                attachments: [
                    {
                        filename: 'Resultaten.pdf',
                        path: 'pdf/resultaten_'+ req.body.host +'.pdf'
                    }]
            };
            sendmail(mailOptions, res)
        }else{
            axios.post("http://localhost:8080/sendemail", req.body).then(r => {

            })
        }
    });


})

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
