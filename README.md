<div align="center">
  <img src="public/favicon.ico" alt="CousinMap Logo" width="120" />
  <h1>CousinMap 🌍</h1>
  <p><strong>A Modern Family Location Manager & Directory</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Status-Active-success.svg" alt="Status">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License">
    <img src="https://img.shields.io/badge/Made%20With-Vanilla%20JS-F7DF1E.svg" alt="JS">
    <img src="https://img.shields.io/badge/Database-Firebase-FFCA28.svg" alt="Firebase">
  </p>
</div>

<br />

CousinMap is a sleek, mobile-first web application designed to help large families keep track of their members across the globe. Built with a focus on premium UI design and lightning-fast performance, CousinMap provides a unified dashboard to visualize where your family is, manage contact details, and seamlessly generate communication links like WhatsApp direct messaging.

## ✨ Key Features

*   🗺️ **Interactive Global Map**: View all family members pinned on an interactive Leaflet map.
*   🌓 **Dynamic Dark Mode**: Fully responsive, system-aware dark theme that can be manually overridden.
*   📱 **Mobile-First Design**: Built with TailwindCSS to provide a fluid, app-like experience on smartphones and desktops alike.
*   📡 **Live Cloud Sync**: Powered by Firebase Firestore, ensuring data is instantly synchronized across all devices in real-time.
*   📍 **Location Services**: Automatically fetch highly-accurate GPS coordinates or manually search and drop pins for family members.
*   💬 **Smart Contact Integrations**: Auto-generates WhatsApp chat links, email redirects, and phone dialer prompts right from the profile screen.
*   🔐 **Secure Data Controls**: PIN-protected data clearing functions to ensure family data isn't accidentally erased (`981106`).

## 🛠️ Technology Stack

*   **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
*   **Styling**: TailwindCSS (using advanced CSS variables for theming)
*   **Mapping**: Leaflet.js with OpenStreetMap tiles
*   **Geocoding**: Nominatim OpenStreetMap API
*   **Backend & Database**: Firebase Firestore (Cloud Database) & Firebase Storage
*   **Build Tool**: Vite

## 🚀 Quick Start

To run CousinMap locally on your machine:

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/jeffknowsit/CousinMap.git
cd CousinMap
\`\`\`

### 2. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Setup Firebase
Rename the `.env.example` file to `.env` (or create one) and provide your Firebase configuration keys:
\`\`\`env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
\`\`\`

### 4. Start the development server
\`\`\`bash
npm run dev
\`\`\`
The application will be running at `http://localhost:3000`.

## 👨‍💻 Author

Developed by **Jeff Joseph**
*   GitHub: [@jeffknowsit](https://github.com/jeffknowsit)

## 🤝 Support

Encountered an issue or have a feature request?
Contact Support via WhatsApp: [Click here to Chat](https://wa.me/7012293909)

---
<div align="center">
  <sub>Built with ❤️ for families everywhere.</sub>
</div>
