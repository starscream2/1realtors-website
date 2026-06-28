const fs = require('fs').promises;
const path = require('path');
const { google } = require('googleapis');

const TOKEN_PATH = '/home/avi/gemini-gmail-bridge/token.json';
const CONFIG_PATH = path.join(__dirname, 'config.json');

async function run() {
  try {
    const tokenContent = await fs.readFile(TOKEN_PATH, 'utf8');
    const auth = google.auth.fromJSON(JSON.parse(tokenContent));
    
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    console.log("1. Creating Google Drive folder for property photos...");
    const folderMetadata = {
      name: '1 Realtors Website Photos',
      mimeType: 'application/vnd.google-apps.folder',
    };
    const folderRes = await drive.files.create({
      resource: folderMetadata,
      fields: 'id, webViewLink',
    });
    const folderId = folderRes.data.id;
    console.log(`Folder created successfully! ID: ${folderId}`);

    console.log("2. Making the photos folder public (viewable by anyone with link)...");
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
    console.log("Folder sharing updated to public.");

    console.log("3. Creating Google Sheet for listings database...");
    const sheetRes = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: '1 Realtors Website Listings',
        },
      },
    });
    const spreadsheetId = sheetRes.data.spreadsheetId;
    const spreadsheetUrl = sheetRes.data.spreadsheetUrl;
    console.log(`Google Sheet created! ID: ${spreadsheetId}`);

    console.log("4. Setting up database headers...");
    const headers = [
      'ID', 'Title', 'Category', 'Price', 'Location', 'Beds', 'Baths', 'Size', 'ImageURL', 'Description'
    ];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1:J1',
      valueInputOption: 'RAW',
      resource: {
        values: [headers],
      },
    });

    console.log("5. Populating Google Sheet with your current mock properties...");
    const mockData = [
      [
        1, "The Horizon Villa", "villa", 4850000, "Malibu, California", 
        5, 6, 6200, 
        "https://onerealtors.onrender.com/images/luxury_villa.jpg", 
        "An architectural masterpiece perched on the cliffs of Malibu. Features panoramic ocean views, a state-of-the-art glass infinity pool, smart-home automation, expansive outdoor terraces, and premium imported stone finishes throughout."
      ],
      [
        2, "Apex Skyline Penthouse", "apartment", 2150000, "Manhattan, New York", 
        3, 3.5, 3100, 
        "https://onerealtors.onrender.com/images/modern_penthouse.jpg", 
        "Experience high-altitude luxury in this corner penthouse. Floor-to-ceiling windows offer wrapping views of the city skyline. Completed with custom Italian cabinetry, premium appliances, a private climate-controlled wine room, and round-the-clock concierge services."
      ],
      [
        3, "The Oakwood Craftsman", "house", 1450000, "Seattle, Washington", 
        4, 4.5, 4500, 
        "https://onerealtors.onrender.com/images/family_home.jpg", 
        "A beautifully appointed modern craftsman home blending classic styling with contemporary amenities. Located in a quiet wooded enclave, this home boasts vaulted ceilings, a chefs kitchen, a dedicated home office, and a stunning landscaped backyard patio."
      ]
    ];
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A2',
      valueInputOption: 'RAW',
      resource: {
        values: mockData,
      },
    });

    console.log("6. Saving configurations locally...");
    const config = {
      folderId,
      spreadsheetId,
      spreadsheetUrl
    };
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));

    console.log("\n==================================================");
    console.log("GOOGLE SHEET DATABASE SETUP COMPLETE!");
    console.log(`You can view and manage your sheet here:`);
    console.log(`${spreadsheetUrl}`);
    console.log("==================================================\n");

  } catch (error) {
    console.error("Database setup failed:", error);
  }
}

run();
