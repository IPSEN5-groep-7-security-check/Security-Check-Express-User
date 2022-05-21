// TODO: error handling
// TODO: convert to TS
// TODO: project organization
// TODO: add tests
// TODO: handle imports better

const PORT = 8080;
const MOZILLA_API_URL = "https://http-observatory.security.mozilla.org/api/v1/";

const createError = require("http-errors");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const index = require("./routes/index");
const users = require("./routes/users");
const pdf = require("./routes/pdf");
const email = require("./routes/email");
const cors = require("cors");

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const express = require("express");
const app = express();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

app.use(cors({ origin: true, credentials: true }));

// Add headers before the routes are defined
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(__dirname + "public/images"));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/", index);
app.use("/users", users);
app.use("/pdf", pdf);
app.use("/sendemail", email);

// I commented this out because it didn't work
// // catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function (err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get("env") === "development" ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render("error");
// });

// INVOKE ASSESSMENT
// See: https://github.com/mozilla/http-observatory/blob/master/httpobs/docs/api.md#invoke-assessment
// Used to invoke a new scan of a website. By default, the HTTP Observatory
// will return a cached site result if the site has been scanned anytime in the
// previous 24 hours. Regardless of the value of rescan, a site can not be
// scanned at a frequency greater than every three minutes. It will return a
// single scan object on success.
//
// Parameters:
//     host - hostname (required)
//
// POST parameters:
//     hidden - setting to "true" will hide a scan from public results returned
//     by getRecentScans
//     rescan - setting to "true" forces a rescan of a site
app.post("/api/v1/analyze", async (req, res) => {
  // TODO: check hostname blacklist and IP blacklist
  // TODO: check if the user's ip has scans remaining
  const host = req.query.host;
  const rescan = req.query.rescan || false;
  const moz = await fetch(
    `${MOZILLA_API_URL}/analyze?host=${host}&hidden=true&rescan=${rescan}`,
    {
      method: "POST",
    }
  );
  const json = await moz.json();

  // Log that the user has started a scan
  try {
    prisma.scanLog
      .create({
        data: {
          ip: req.ip,
          hostname: host,
          completed: json.state === "FINISHED" ? true : false,
          completedAt: json.state === "FINISHED" ? new Date() : null,
        },
      })
      .then(() => {
        res.send(json);
      });
  } catch (error) {
    res.status(500).json({ error: e.message });
  }
});

// RETRIEVE ASSESSMENT
// See: https://github.com/mozilla/http-observatory/blob/master/httpobs/docs/api.md#retrieve-assessment
// This is used to retrieve the results of an existing, ongoing, or completed
// scan. Returns a scan object on success.
//
// Parameters:
// host - hostname (required)
app.get("/api/v1/analyze", async (req, res) => {
  const host = req.query.host;
  const moz = await fetch(`${MOZILLA_API_URL}/analyze?host=${host}`);
  const json = await moz.json();
  res.json(json);
});

// RETRIEVE TEST RESULTS
// See: https://github.com/mozilla/http-observatory/blob/master/httpobs/docs/api.md#retrieve-test-results
// Each scan consists of a variety of subtests, including Content Security
// Policy, Subresource Integrity, etc. The results of all these tests can be
// retrieved once the scan's state has been placed in the FINISHED state. It
// will return a single tests object.
//
// Parameters:
// scan - scan_id number from the scan object
app.get("/api/v1/getScanResults", async (req, res) => {
  const scanId = req.query.scan;
  const moz = await fetch(`${MOZILLA_API_URL}/getScanResults?scan=${scanId}`);
  // TODO: modify the response body to only include preview data
  const json = await moz.json();
  res.json(json);
  // TODO: consider logging the user's ip and hostname
  // const scan = await prisma.scanLog.update({
  //   where: { ip: req.ip, completed: false, hostname: host }, // TODO: get scanId from request
  //   data: {
  //     completedAt: new Date(),
  //     completed: true,
  //   },
  // });
});

app.listen(PORT, function () {
  console.log(`Backend Application listening at http://localhost:${PORT}`);
});
