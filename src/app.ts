// TODO: better error handling
// TODO: project organization
import express, { Request } from "express";
import fetch from "node-fetch";
import { PrismaClient } from "@prisma/client";
import { CorsOptions } from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import pdf from "./routes/pdf";
import email from "./routes/email";
import cors from "cors";

const PORT = 8080;
const MOZILLA_API_URL = "https://http-observatory.security.mozilla.org/api/v1/";

//  const createError = require("http-errors");
//  const path = require("path");
//  const cookieParser = require("cookie-parser");
// import { cookieParser } from "cookie-parser";

const app = express();
const prisma = new PrismaClient();
import session from "express-session";
app.use(express.static("public"));

// use session middleware
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 },
  })
);

const corsOptions: CorsOptions = { origin: true, credentials: true };

app.use(cors(corsOptions));

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

  // Pass to next layer of middleware
  next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/pdf", pdf);
app.use("/sendemail", email);

async function isHostnameBanned(host: string) {
  const bannedHostname = await prisma.hostnameBlacklist.findUnique({
    where: {
      hostname: host,
    },
  });
  return bannedHostname ? true : false;
}

async function isIPBanned(ip: string) {
  const bannedIp = await prisma.iPBlacklist.findUnique({
    where: {
      ip: ip,
    },
  });
  if (bannedIp && bannedIp.expiresAt.getUTCDate() > Date.now()) {
    return true;
  } else {
    return false;
  }
}

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
app.post(
  "/api/v1/analyze",
  async (
    req: Request<null, any, null, { host: string; rescan: boolean }>,
    res
  ) => {
    const host = req.query.host;
    if (typeof host !== "string" || host === "") {
      throw new Error("Missing hostname");
    }
    const ip = req.ip;
    const rescan = req.query.rescan || false;
    if (await isIPBanned(ip)) {
      res.status(403).send({ error: "Client IP is banned" });
    } else if (await isHostnameBanned(host?.toString())) {
      res.status(400).send({ error: `The hostname ${host} is not allowed` });
    } else {
      const observatoryRes = await fetch(
        `${MOZILLA_API_URL}/analyze?host=${host}&hidden=true&rescan=${rescan}`,
        {
          method: "POST",
        }
      );
      const json = await observatoryRes.json();
      res.send(json);
    }
  }
);

// TODO: find one place to put this for both the frontend and backend
export interface Scan {
  algorithm_version: number;
  end_time?: string;
  grade?: string;
  hidden: boolean;
  response_headers: {};
  scan_id: number;
  score?: number;
  likelihood_indicator?: "UNKNOWN" | "LOW" | "MEDIUM" | "HIGH" | "MAXIMUM";
  start_time?: string;
  state: "ABORTED" | "FAILED" | "FINISHED" | "PENDING" | "STARTING" | "RUNNING";
  tests_failed?: number;
  tests_passed?: number;
  tests_quantity?: number;
}

// RETRIEVE ASSESSMENT
// See: https://github.com/mozilla/http-observatory/blob/master/httpobs/docs/api.md#retrieve-assessment
// This is used to retrieve the results of an existing, ongoing, or completed
// scan. Returns a scan object on success.
//
// Parameters:
// host - hostname (required)
app.get(
  "/api/v1/analyze/",
  async (req: Request<null, any, null, { host: string }>, res) => {
    const host = req.query.host;
    if (typeof host !== "string" || host === "") {
      throw new Error("Missing hostname");
    }
    const observatoryRes = await fetch(
      `${MOZILLA_API_URL}/analyze?host=${host}`
    );
    const json = (await observatoryRes.json()) as Scan;
    const scanId = json.scan_id;
    // We use upsert because we only want to record the log if it doesn't exist
    // already. The update object is empty because we do not want to update an
    // existing log entry.
    if (observatoryRes && scanId) {
      await prisma.scanLog.upsert({
        where: {
          observatoryScanId_ip: {
            ip: req.ip,
            observatoryScanId: scanId,
          },
        },
        update: {},
        create: {
          ip: req.ip,
          hostname: host,
          observatoryScanId: scanId,
        },
      });
    }
    res.send(json);
  }
);

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
  const observatoryRes = await fetch(
    `${MOZILLA_API_URL}/getScanResults?scan=${scanId}`
  );
  const json = await observatoryRes.json();

  // TODO: modify the response body to only include preview data
  const previewData = json;

  res.send(previewData);
});

app.listen(PORT, function () {
  console.log(`Backend Application listening at http://localhost:${PORT}`);
});
