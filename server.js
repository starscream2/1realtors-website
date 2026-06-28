const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { google } = require('googleapis');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Multer configuration for temporary file uploads
const upload = multer({ dest: 'uploads/' });

// Use paths from the gmail bridge
const GMAIL_BRIDGE_DIR = '/home/avi/gemini-gmail-bridge';
const TOKEN_PATH = path.join(GMAIL_BRIDGE_DIR, 'token.json');

// Config path for Sheets/Drive settings
const CONFIG_PATH = path.join(__dirname, 'config.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Helper to authenticate Google client
async function getGoogleAuth() {
  try {
    let tokenContent;
    if (process.env.GMAIL_TOKEN_JSON) {
      tokenContent = process.env.GMAIL_TOKEN_JSON.replace(/[\n\r]/g, '').trim();
    } else {
      tokenContent = await fs.readFile(TOKEN_PATH, 'utf8');
    }
    const tokenObj = JSON.parse(tokenContent);
    // Sanitize accidental whitespace introduced by copy-paste (except in scope)
    for (const key in tokenObj) {
      if (typeof tokenObj[key] === 'string' && key !== 'scope') {
        tokenObj[key] = tokenObj[key].replace(/\s+/g, '');
      }
    }
    return google.auth.fromJSON(tokenObj);
  } catch (error) {
    console.error("Google authentication error:", error);
    throw error;
  }
}

// Helper to read local config details
async function getDbConfig() {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading config.json. Ensure setup_google_db.js has run.", error);
    throw error;
  }
}

// GET endpoint to fetch listings from Google Sheets
app.get('/api/properties', async (req, res) => {
  try {
    const auth = await getGoogleAuth();
    const config = await getDbConfig();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: 'Sheet1!A2:K', // Skip headers, read through Column K (Currency)
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.json([]);
    }

    const properties = rows.map(row => {
      const currency = row[10] || 'TTD';
      const priceVal = parseInt(row[3]) || 0;
      return {
        id: parseInt(row[0]),
        title: row[1] || 'No Title',
        category: row[2] || 'house',
        price: priceVal,
        priceStr: `${currency} $${priceVal.toLocaleString()}`,
        location: row[4] || 'Unknown Location',
        beds: parseInt(row[5]) || 0,
        baths: parseFloat(row[6]) || 0,
        size: row[7] ? parseInt(row[7]) : null, // Optional Size
        image: row[8] || '',
        description: row[9] || 'No description available.'
      };
    });

    res.json(properties);
  } catch (error) {
    console.error("Failed to fetch listings:", error);
    res.status(500).json({ success: false, error: 'Failed to retrieve property listings' });
  }
});

// POST endpoint for contact form inquiry emails
app.post('/api/inquiry', async (req, res) => {
  const { name, email, phone, propertyTitle, message } = req.body;

  if (!name || !email || !propertyTitle || !message) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    const auth = await getGoogleAuth();
    const gmail = google.gmail({ version: 'v1', auth });

    const subject = `[Real Estate Lead] New Inquiry for ${propertyTitle}`;
    const body = `
      <h3>New Real Estate Inquiry</h3>
      <p><strong>Property:</strong> ${propertyTitle}</p>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
      <p><strong>Message:</strong></p>
      <blockquote style="background: #f4f4f4; padding: 10px; border-left: 3px solid #6750A4;">
        ${message.replace(/\n/g, '<br>')}
      </blockquote>
      <hr>
      <p style="font-size: 0.8em; color: #888;">This inquiry was sent automatically from your website contact form.</p>
    `;

    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `To: Avi.1realtors@gmail.com`,
      `Cc: eliseomaria67@gmail.com`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      body,
    ];
    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    });
    res.json({ success: true, message: 'Inquiry sent successfully!' });
  } catch (error) {
    console.error("Gmail integration error:", error);
    res.status(500).json({ success: false, error: 'Failed to send inquiry email. Please try again later.' });
  }
});

// POST endpoint to add a new property listing (Admin Dashboard upload)
app.post('/api/admin/add-property', upload.single('image'), async (req, res) => {
  const { title, category, price, location, beds, baths, size, description, passcode, currency } = req.body;
  const file = req.file;

  // Simple authentication check
  if (passcode !== 'realtors123') {
    if (file) fsSync.unlinkSync(file.path);
    return res.status(401).json({ success: false, error: 'Unauthorized: Incorrect passcode' });
  }

  if (!title || !category || !price || !location || !beds || !baths || !description || !file) {
    if (file) fsSync.unlinkSync(file.path);
    return res.status(400).json({ success: false, error: 'Missing required fields or image file' });
  }

  try {
    const auth = await getGoogleAuth();
    const config = await getDbConfig();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Upload photo to Google Drive
    console.log("Uploading file to Google Drive...");
    const fileMetadata = {
      name: `${title.replace(/\s+/g, '_')}_${Date.now()}${path.extname(file.originalname)}`,
      parents: [config.folderId],
    };
    const media = {
      mimeType: file.mimetype,
      body: fsSync.createReadStream(file.path),
    };
    const driveRes = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });
    const fileId = driveRes.data.id;
    console.log(`Uploaded photo. File ID: ${fileId}`);

    // 2. Make the file public so anyone can view/access the image url
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // 3. Create direct download link for Google Drive image
    const imageUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

    // 4. Retrieve current listings to determine next incremental ID
    const currentRowsRes = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: 'Sheet1!A2:A',
    });
    const currentRows = currentRowsRes.data.values || [];
    const nextId = currentRows.length + 1;

    // 5. Append new property row to Google Sheets
    // Columns: ID, Title, Category, Price, Location, Beds, Baths, Size, ImageURL, Description, Currency
    const newRow = [
      nextId,
      title,
      category,
      parseInt(price),
      location,
      parseInt(beds),
      parseFloat(baths),
      size ? parseInt(size) : '', // Optional Size
      imageUrl,
      description,
      currency || 'TTD' // Column K: Currency
    ];
    await sheets.spreadsheets.values.append({
      spreadsheetId: config.spreadsheetId,
      range: 'Sheet1!A2',
      valueInputOption: 'RAW',
      requestBody: {
        values: [newRow],
      },
    });

    // 6. Clean up temporary uploaded file from local server
    fsSync.unlinkSync(file.path);
    res.json({ success: true, message: 'Property listing and photo uploaded successfully to Google Sheets/Drive!' });
  } catch (error) {
    console.error("Admin listing creation failed:", error);
    if (file) fsSync.unlinkSync(file.path);
    res.status(500).json({ success: false, error: 'Database upload failed. Check server logs.' });
  }
});

// Serve spreadsheet URL for admin button
app.get('/api/admin/sheet-url', async (req, res) => {
  try {
    const config = await getDbConfig();
    res.json({ url: config.spreadsheetUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get spreadsheet URL' });
  }
});

// Serve admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Real Estate Website server running at http://localhost:${PORT}`);
});
