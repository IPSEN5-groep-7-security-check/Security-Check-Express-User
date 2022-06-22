const express = require('express')
const router = express.Router()
const pdf = require('html-pdf')
const options = {format: 'Letter'};
const ejs = require('ejs');
const path = require("path");
const logger = require("debug");
const axios = require("axios")
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

router.post('/', (req, res) => {
    let scan_id = null;
    axios.get("http://localhost:8080/api/v1/analyze?host=" + req.body.host).then(function (response) {
        axios.get("http://localhost:8080/api/v1/getScanResults?scan=" + response.data.scan_id).then(r => {
            ejs.renderFile(path.join(__dirname, '../views/template.ejs'), {analyzeData: response, resultData: r}, async (err, result) => {
                if (err) {
                    logger.log('info', 'error encountered: ' + err);
                } else {
                    try {
                        createPDF(result, options, response.data.scan_id);
                        scan_id = response.data.scan_id;
                        // let user = await prisma.user.findUnique({
                        //     where: {
                        //         email: req.body.email
                        //     },
                        // })
                        // if (!user) {
                        //     user = await prisma.user.create(
                        //         email: req.body.email;
                        //     )
                        // }
                        // const user = await prisma.user.upsert({
                        //     where: {
                        //         email: req.body.email,
                        //     },
                        //     update: {},
                        //     create: {
                        //         email: req.body.email
                        //     },
                        // });
                        // prisma.report.create({
                        //     data: {
                        //         hostname: req.body.host,
                        //         score: response.data.score,
                        //         reportData: response.data,
                        //         user: user,
                        //         userSubmittedName: req.body.name,
                        //     },
                        // }).then(() => {
                        //
                        // })
                        res.send({scan_id: scan_id});
                    } catch (err) {
                        if (err) {
                            throw err;
                        }
                    }
                }
            });
        })
    })
})

function createPDF(html, options, name){
    pdf.create(html, options).toFile('./pdf/resultaten_'+ name +'.pdf', function(err, res) {
        if (err) return console.log(err);
        console.log(res);
    });
}

module.exports = router
