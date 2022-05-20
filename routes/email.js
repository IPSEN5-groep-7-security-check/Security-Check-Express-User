const express = require('express')
const router = express.Router()
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'EMAIL',
        pass: 'PASSWORD'
    }
});

router.post('/', (req, res) => {
    // var attachment = (typeof req.body.attachment !="undefined") ? req.body.attachment : ''; test
    var mailOptions = {
        from: 'EMAIL',
        to: req.body.to,
        subject: req.body.subject,
        text: req.body.text,
        attachments: [
            {   // use URL as an attachment
                filename: 'Resultaten.pdf',
                path: 'PATH_To_RESULTATENPDF'
            }]
        };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
})

module.exports = router
