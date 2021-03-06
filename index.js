const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
var csvWriter = require('csv-write-stream')
var writer = csvWriter()


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';



// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize(JSON.parse(content), listNames);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}


/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
async function listNames(auth) {
  writer.pipe(fs.createWriteStream('ZoomBreakout.csv'));
  csvWriter({ headers: ["Pre-assign Room Name", "Email Address"] });
  // writer.write({ :"Pre-assign Room Name", "Email Address":"Email Address" });
  console.log("----------------------------------------------------------------" +
    "------------------------------------------------------------\n");
  console.log("Team | Num Members | Drop Chance | Pass No Pass | Time Management| JavaScript " +
    "| New Skills | Communication | Data Structures\n");
  var index = 1;
  for (index = 1; index <= 11; index++) {
    await getScoreForTeam(index, auth);
  }
  //writer.end();

  //getScoreForTeam(index, auth)

}


/*
* row[7] - DropChance
* row[8] - Pass No Pass Chance
* row[14] - time mangement skills
* row[30] - JS proficiency
* row[29] - New Skills Learning proficiency
* row[31] - Communication Skills
* row[30] - Data Structures Proficiency
* This is the order of cols from the google form ^ 
*/
function getScoreForTeam(index, auth) {

  var numMembers = 0
  var dropChance = 0;
  var pnpChance = 0;
  var timeManageSkill = 0;
  var jsSkill = 0;
  var newSkill = 0;
  var commSkill = 0;
  var dsSkill = 0;


  const sheets = google.sheets({ version: 'v4', auth });
  sheets.spreadsheets.values.get({
    spreadsheetId: '1gPw4Kx1QG8ZaEwG-09mH0Kh8nEnh_WU9lYXbN6GzT5s',
    range: "'Main'",
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    if (rows.length) {
      rows.map((row) => {
        if (row[2] == index) {
          // console.log(row[1])
          addToCSV(index, row[1]);
          numMembers = numMembers + 1;
          dropChance = dropChance + parseInt(row[7]);
          pnpChance = pnpChance + parseInt(row[8]);
          timeManageSkill = timeManageSkill + parseInt(row[15]);
          jsSkill = jsSkill + parseInt(row[30]);
          newSkill = newSkill + parseInt(row[31]);
          dsSkill = dsSkill + parseInt(row[32]);
          commSkill = commSkill + parseInt(row[33]);
        }
      });
      if (index >= 10) { specialSpace = " " }
      else { specialSpace = "  " }

      console.log(specialSpace + index + "  |     " + numMembers +
        "     |    " + (dropChance / numMembers).toPrecision(4) +
        "     |    " + (pnpChance / numMembers).toPrecision(4) +
        "     |     " + (timeManageSkill / numMembers).toPrecision(4) +
        "      |   " + (jsSkill / numMembers).toPrecision(4) +
        "    |    " + (newSkill / numMembers).toPrecision(4) +
        "   |     " + (commSkill / numMembers).toPrecision(4) +
        "     |      " + (dsSkill / numMembers).toPrecision(4)

      );
      // writer.end();
    } else {
      console.log('No data found.');
    }
  });

  function addToCSV(number, email) {
    writer.write({ "Pre-assign Room Name": "room" + number, "Email Address": email });
  }  

}






