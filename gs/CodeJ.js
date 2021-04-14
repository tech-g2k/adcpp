function doPost(e) {
    var json = JSON.parse(e.postData.contents);
    const data = {
      name: json.name,
      email: json.email,
      phone: json.phone,
      body: json.body,
    };

    setRow(data);
    let response = sendMail(data);
  
    return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(
      ContentService.MimeType.JSON,
    );
}
  
function sendMail(data) {
  console.log('in sendMail');
  try {
    var html = HtmlService.createTemplateFromFile('Email');
    html.name = data.name;
    html.email = data.email;
    html.phone = data.phone;
    html.comment = data.body;
    let subject = 'Appointment for ' + data.name + ' [ADC]';

    //This should probably be changed to the MailApp service now
    GmailApp.sendEmail('yong.lim@gmail.com', subject, '', {
      name: 'Contact Form',
      replyTo: data.email,
      htmlBody: html.evaluate().getContent(),
    });

    return {
      code: 'success',
      msg: "Thanks for contacting us. We'll get back to you asap.",
    };
  } catch (err) {
    return {
      code: 'danger',
      msg: 'Something went wrong! Technology is not always pretty!',
    };
  }
}

function setRow(data) {
  // shortly after my original solution Google announced the LockService[1]
  // this prevents concurrent access overwritting data
  // [1] http://googleappsdeveloper.blogspot.co.uk/2011/10/concurrency-and-google-apps-script.html
  // we want a public lock, one that locks for all invocations
  var lock = LockService.getPublicLock();
  lock.waitLock(30000);  // wait 30 seconds before conceding defeat.
  const SHEET_NAME = "Sheet1";

  try {
    // next set where we write the data - you could write to multiple/alternate destinations
    var doc = SpreadsheetApp.openById(SCRIPT_PROP.getProperty("key"));
    var sheet = doc.getSheetByName(SHEET_NAME);

    // we'll assume header is in row 1 but you can override with header_row in GET/POST data
    var nextRow = sheet.getLastRow()+1; // get next row
    var row = [];
    row.push(new Date());
    row.push(data.name);
    row.push(data.phone);
    row.push(data.email);
    row.push(data.body);
    
    sheet.insertRowAfter(nextRow); // Insert a after last row
    // destSheet.insertRowAfter(4); //Inserts a row before populating it
    sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
  } finally { //release lock
      lock.releaseLock();
  }
}
  