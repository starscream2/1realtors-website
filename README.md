# 1 Realtors Website Project

This is the codebase for the **1 Realtors** premium single-page real estate landing page.

## 🚀 Deployment & URLs
*   **Live Production URL:** [https://onerealtors.onrender.com](https://onerealtors.onrender.com)
*   **Local Development URL:** `http://localhost:3000`

---

## 📬 Contact Form Routing
The contact form sends automated email notifications using the **Gmail API credentials** configured in your local environment.
*   **Target Recipient:** `Avi.1realtors@gmail.com`
*   **CC:** `eliseomaria67@gmail.com`
*   **Production Config:** On Render, credentials are read from the `GMAIL_TOKEN_JSON` environment variable.
*   **Local Config:** Reads directly from `/home/avi/gemini-gmail-bridge/token.json`.

---

## 🛠️ Next Steps / TODO List
When you are ready to update the site with real listings:
1.  **Replace Images:** Replace the mock images in `images/` with photographs of your actual listings:
    *   `images/luxury_villa.jpg` (Villa Listing)
    *   `images/modern_penthouse.jpg` (Penthouse Listing)
    *   `images/family_home.jpg` (Family Home Listing)
2.  **Update Listings Data:** Modify the `properties` array in [public/app.js](file:///home/avi/real-estate-website/public/app.js) with your real property titles, prices, descriptions, and sizes.
3.  **Push Changes:** Run:
    ```bash
    git add .
    git commit -m "Add real listings data"
    git push origin main
    ```
