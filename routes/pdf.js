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
    axios.get("http://localhost:8080/api/v1/analyze?host=" + req.body.host).then(function (response) {
        ejs.renderFile(path.join(__dirname, '../views/template.ejs'), {data: response}, (err, result) => {
            if (err) {
                logger.log('info', 'error encountered: ' + err);
            }
            else {
                try {
                    createPDF(result, options, response.data.scan_id);
                    scan_id = response.data.scan_id;
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
