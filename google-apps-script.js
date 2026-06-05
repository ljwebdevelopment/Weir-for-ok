/**
 * ================================================================
 *  Wier Campaign – Google Apps Script Web App
 *  Receives form submissions and writes them to Google Sheets.
 * ================================================================
 *
 *  HOW TO DEPLOY (do this once):
 *  ─────────────────────────────
 *  1. Open your Google Sheet:
 *     https://docs.google.com/spreadsheets/d/1AX3oePb47PTTJhsb0GTEOsPcU46dhdQ15fAnlWGeZmk
 *
 *  2. In the menu bar, click:
 *        Extensions → Apps Script
 *
 *  3. You'll see a code editor open. DELETE everything in there
 *     and PASTE this entire file.
 *
 *  4. Click the floppy-disk icon (Save project) or press Ctrl+S.
 *     Name the project something like "Wier Campaign Forms".
 *
 *  5. Click "Deploy" (top-right) → "New deployment".
 *
 *  6. In the dialog that appears:
 *       - Click the gear icon next to "Type" and select: Web app
 *       - Description: Wier Campaign Form Handler
 *       - Execute as: Me (your Google account)
 *       - Who has access: Anyone
 *       - Click "Deploy"
 *
 *  7. Google will ask you to authorize the script. Click through
 *     the permission screens (you may see a "not verified" warning
 *     — click "Advanced" → "Go to Wier Campaign Forms (unsafe)").
 *     This is your own script, so it's safe.
 *
 *  8. Copy the Web app URL that appears (it looks like:
 *       https://script.google.com/macros/s/AKfycb.../exec)
 *
 *  9. Open the website file:  js/main.js
 *     Find the line near the top that says:
 *       const SCRIPT_URL = '';
 *     Replace the empty string with your Web App URL:
 *       const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
 *
 *  10. Save main.js and re-deploy your website. Done!
 *
 *  ─────────────────────────────
 *  HOW TO RE-DEPLOY AFTER EDITS:
 *  ─────────────────────────────
 *  If you ever change this script, you MUST create a new deployment
 *  for the changes to take effect. Go to Deploy → Manage deployments
 *  → click the pencil icon → change version to "New version" → Deploy.
 *  The URL stays the same.
 *
 * ================================================================
 */

/* ---------------------------------------------------------------
   Configuration
--------------------------------------------------------------- */
var SHEET_ID   = '1AX3oePb47PTTJhsb0GTEOsPcU46dhdQ15fAnlWGeZmk';
var SHEET_NAME = 'wier';   // must match the tab name in your Google Sheet exactly

var HEADERS = [
  'Timestamp',
  'Form Type',
  'Name',
  'Email',
  'Phone',
  'City',
  'How They Want To Help',
  'Message',
  'Source Page',
];

/* ---------------------------------------------------------------
   doPost  – called whenever a form is submitted to the Web App URL
--------------------------------------------------------------- */
function doPost(e) {
  try {
    /* Parse the incoming JSON body */
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      // Fallback: URL-encoded form data
      data = e.parameter;
    }

    /* Get (or create) the sheet */
    var spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    var sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      /* Create the sheet if it doesn't exist yet */
      sheet = spreadsheet.insertSheet(SHEET_NAME);
    }

    /* Add header row if the sheet is empty */
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      styleHeaderRow_(sheet);
    }

    /* Append the submission */
    sheet.appendRow([
      data.timestamp  || new Date().toISOString(),
      data.formType   || '',
      data.name       || '',
      data.email      || '',
      data.phone      || '',
      data.city       || '',
      data.howHelp    || '',
      data.message    || '',
      data.sourcePage || '',
    ]);

    /* Auto-resize columns for readability */
    try { sheet.autoResizeColumns(1, HEADERS.length); } catch(ignore) {}

    return buildResponse_({ result: 'success' });

  } catch (err) {
    Logger.log('doPost error: ' + err.toString());
    return buildResponse_({ result: 'error', message: err.toString() });
  }
}

/* ---------------------------------------------------------------
   doGet  – used to verify the Web App is deployed correctly
--------------------------------------------------------------- */
function doGet(e) {
  return buildResponse_({
    result:  'ok',
    message: 'Wier Campaign Form Handler is running.',
    time:    new Date().toISOString(),
  });
}

/* ---------------------------------------------------------------
   Helpers
--------------------------------------------------------------- */
function buildResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function styleHeaderRow_(sheet) {
  try {
    var range = sheet.getRange(1, 1, 1, HEADERS.length);
    range.setFontWeight('bold');
    range.setFontColor('#FFFFFF');
    range.setBackground('#1A3A8C');   // campaign blue
    range.setFontFamily('Arial');
    range.setFontSize(10);
  } catch(ignore) {}
}

/*
 * ================================================================
 *  TESTING (optional – run inside Apps Script editor)
 * ================================================================
 *  You can test this script without deploying by running the
 *  function below from the Apps Script editor:
 *
 *  function testSubmit() {
 *    var fakeEvent = {
 *      postData: {
 *        contents: JSON.stringify({
 *          timestamp:  new Date().toISOString(),
 *          formType:   'Test',
 *          name:       'Test User',
 *          email:      'test@example.com',
 *          phone:      '918-555-0000',
 *          city:       'Tahlequah',
 *          howHelp:    'Canvassing / Door-knocking',
 *          message:    'This is a test submission.',
 *          sourcePage: 'https://example.com',
 *        })
 *      }
 *    };
 *    var result = doPost(fakeEvent);
 *    Logger.log(result.getContent());
 *  }
 *
 *  Run testSubmit(), then check your Google Sheet to confirm
 *  a row was added.
 * ================================================================
 */
