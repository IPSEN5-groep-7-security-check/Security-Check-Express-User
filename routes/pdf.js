const express = require('express')
const router = express.Router()
const pdf = require('html-pdf')
const options = {format: 'Letter'};
const ejs = require('ejs');
const path = require("path");
const logger = require("debug");
const axios = require("axios")

router.post('/', (req, res) => {
    let scan_id = null;
    let responsemsg = null;
    axios.get("http://localhost:8080/api/v1/analyze?host=" + req.body.host).then(function (response) {
        responsemsg = response
    }).finally(() =>{

        ejs.renderFile(path.join(__dirname, '../views/template.ejs'), {data: responsemsg}, (err, result) => {
            if (err) {
                logger.log('info', 'error encountered: ' + err);
            }
            else {
                try {
                    createPDF(result, options, responsemsg.data.scan_id, {"renderDelay": 1000});
                    scan_id = responsemsg.data.scan_id;
                    res.send({scan_id: scan_id});
                } catch(err) {
                    if (err) {
                        throw err;
                    }
                }
            }
        });
    })
})

function createPDF(html, options, name){
    pdf.create(html, options).toFile('./pdf/resultaten_'+ name +'.pdf', function(err, res) {
        if (err) return console.log(err);
        console.log(res);
    });
}

module.exports = router
