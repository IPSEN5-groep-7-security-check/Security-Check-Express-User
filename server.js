// TODO: error handling
// TODO: convert to TS
// TODO: project organization
// TODO: add tests
// TODO: handle imports better

const PORT = 8080;
const MOZILLA_API_URL = "https://http-observatory.security.mozilla.org/api/v1/";

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const express = require("express");
const app = express();

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
  res.json(json);
  // TODO: log that the scan was invoked
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
  // TODO: log that the scan has been completed
});

app.listen(PORT, function () {
  console.log(`Backend Application listening at http://localhost:${PORT}`);
});
