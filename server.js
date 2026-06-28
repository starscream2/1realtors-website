const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

// Use paths from the gmail bridge
const GMAIL_BRIDGE_DIR = '/home/avi/gemini-gmail-bridge';
const TOKEN_PATH = path.join(GMAIL_BRIDGE_DIR, 'token.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Helper to send email using existing credentials
async function sendInquiryEmail(inquiry) {
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
    
    const auth = google.auth.fromJSON(tokenObj);
    const gmail = google.gmail({ version: 'v1', auth });

    const subject = `[Real Estate Lead] New Inquiry for ${inquiry.propertyTitle}`;
    const body = `
      <h3>New Real Estate Inquiry</h3>
      <p><strong>Property:</strong> ${inquiry.propertyTitle}</p>
      <p><strong>Name:</strong> ${inquiry.name}</p>
      <p><strong>Email:</strong> ${inquiry.email}</p>
      <p><strong>Phone:</strong> ${inquiry.phone || 'Not provided'}</p>
      <p><strong>Message:</strong></p>
      <blockquote style="background: #f4f4f4; padding: 10px; border-left: 3px solid #6750A4;">
        ${inquiry.message.replace(/\n/g, '<br>')}
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

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    });
    return res.data;
  } catch (error) {
    console.error("Gmail integration error:", error);
    throw error;
  }
}

// POST endpoint for inquiries
app.post('/api/inquiry', async (req, res) => {
  const { name, email, phone, propertyTitle, message } = req.body;

  if (!name || !email || !propertyTitle || !message) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    await sendInquiryEmail({ name, email, phone, propertyTitle, message });
    res.json({ success: true, message: 'Inquiry sent successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to send inquiry email. Please try again later.' });
  }
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Real Estate Website server running at http://localhost:${PORT}`);
});
