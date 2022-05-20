const express = require('express')
const router = express.Router()
const pdf = require('html-pdf')
const options = {format: 'Letter'};
const ejs = require('ejs');
const path = require("path");
const logger = require("debug");

router.post('/', (req, res) => {

    // Dummy data
    let data = {
        "end_time": "Tue, 22 Mar 2016 21:51:41 GMT",
        "grade": "A",
        "hidden": false,
        "response_headers": "yes",
        "scan_id": 1,
        "score": 90,
        "likelihood_indicator": "LOW",
        "start_time": "Tue, 22 Mar 2016 21:51:40 GMT",
        "state": "FINISHED",
        "tests_failed": 2,
        "tests_passed": 9,
        "tests_quantity": 11
    }

    ejs.renderFile(path.join(__dirname, '../views/template.ejs'), {data: data}, (err, result) => {
        if (err) {
            logger.log('info', 'error encountered: ' + err);
        }
        else {
            try {
                createPDF(result, options);
            } catch(err) {
                if (err) {
                    throw err;
                }
            }
        }
    });

    res.end();
})

function createPDF(html, options){
    pdf.create(html, options).toFile('./resultaten.pdf', function(err, res) {
        if (err) return console.log(err);
        console.log(res);
    });
}

module.exports = router
