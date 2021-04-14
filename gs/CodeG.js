//  1. Enter sheet name where data is to be written below
        var SHEET_NAME = "Sheet1";

//  2. Run > setup
//
//  3. Publish > Deploy as web app
//    - enter Project Version name and click 'Save New Version'
//    - set security level and enable service (most likely execute as 'me' and access 'anyone, even anonymously)
//
//  4. Copy the 'Current web app URL' and post this in your form/script action
//
//  5. Insert column names on your destination sheet matching the parameter names of the data you are passing in (exactly matching case)

var SCRIPT_PROP = PropertiesService.getScriptProperties(); // new property service

// If you don't want to expose either GET or POST methods you can comment out the appropriate function
function doGet(e){
  return handleResponse(e);
}

function doPostOld(e){
  return handleResponse(e);
}

function handleResponse(e) {
  // shortly after my original solution Google announced the LockService[1]
  // this prevents concurrent access overwritting data
  // [1] http://googleappsdeveloper.blogspot.co.uk/2011/10/concurrency-and-google-apps-script.html
  // we want a public lock, one that locks for all invocations
  var lock = LockService.getPublicLock();
  lock.waitLock(30000);  // wait 30 seconds before conceding defeat.

  try {
    // next set where we write the data - you could write to multiple/alternate destinations
    var doc = SpreadsheetApp.openById(SCRIPT_PROP.getProperty("key"));
    var sheet = doc.getSheetByName(SHEET_NAME);

    // we'll assume header is in row 1 but you can override with header_row in GET/POST data
    var headRow = e.parameter.header_row || 1;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var nextRow = sheet.getLastRow()+1; // get next row
    var row = [];
    // loop through the header columns
    for (i in headers){
      if (headers[i] == "Timestamp"){ // special case if you include a 'Timestamp' column
        row.push(new Date());
      } else { // else use header name to get data
        row.push(e.parameter[headers[i]+'-field']);
      }
    }
    Logger.log(JSON.stringify(e.parameter));
    console.log(JSON.stringify(e.parameter));
    // more efficient to set values as [][] array than individually
    sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
    // send and email to me
    return doPostJordan(e);
    // return json success results
    return ContentService
          .createTextOutput(JSON.stringify({"result":"success", "row": nextRow}))
          .setMimeType(ContentService.MimeType.JSON);
  } catch(e){
    // if error return this
    return ContentService
          .createTextOutput(JSON.stringify({"result":"error", "error": e}))
          .setMimeType(ContentService.MimeType.JSON);
  } finally { //release lock
    lock.releaseLock();
  }
}

function sendEmail_old(row) {
  const emailTo = 'yong.lim@gmail.com';
  const subject = '[ADCPP] Contact Form';
  var emailTemp = HtmlService.createTemplateFromFile("Email");

  emailTemp.name     = row[1];
  emailTemp.phone    = row[2];
  emailTemp.email    = row[3];
  emailTemp.comments = row[4];
  var htmlMessage = emailTemp.evaluate().getContent();
  
  GmailApp.sendEmail(
    emailTo, subject,
    "Your email doesn't support HTML.",
    {name: '[ADCPP] Contact Form', from: 'yong@gateway2khmer.com', htmlBody: htmlMessage}
  );
}

function sendTestEmail() {
  const emailTo = 'yong.lim@gmail.com';
  const subject = '[ADCPP] Contact Form';
  var emailTemp = HtmlService.createTemplateFromFile("Email");

  emailTemp.name     = "Yong Lim";
  emailTemp.phone    = "099922222222222";
  emailTemp.email    = "yong@gateway2khmer.com";
  emailTemp.comments = "This is a test of the email.";
  var htmlMessage = emailTemp.evaluate().getContent();
  
  GmailApp.sendEmail(
    emailTo, subject,
    "Your email doesn't support HTML.",
    {name: '[ADCPP] Contact Form', from: 'yong@gateway2khmer.com', htmlBody: htmlMessage}
  );
}

function setup() {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    SCRIPT_PROP.setProperty("key", doc.getId());
}
