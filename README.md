# My M365 Tasks

A simple web tool to view and manage Microsoft Power Automate Approval tasks.

## Features

- 🔍 View all flows in a selected environment  
- ⚙️ Start, stop, delete, or export flows  
- 📈 Load and inspect full run history  
- 🔐 Fully client-side: all requests go directly to Microsoft  
- 🧩 Open source and self-hostable  

## 🚀 Getting Started

### 1. Clone or Download the Source

Clone the repository:

```bash
git clone https://github.com/tachytelic/FlowAdmin.git
```

Or download the ZIP from GitHub and extract it locally.

---

### 2. ⚙️ Register an Azure App

To authenticate with Microsoft, each user should register their own Azure AD app.

#### Steps:

1. Go to [Azure Portal](https://portal.azure.com) → **App registrations**
2. Click **New registration**
3. Fill out:
   - **Name:** `FlowAdminTool` (or any name)
   - **Supported account types:** *Accounts in this organizational directory only*
   - **Redirect URI:**
     - Platform: *Single-page application (SPA)*
     - URI: `http://localhost` *(or wherever you'll host the tool)*
4. Click **Register**
5. After registration:
   - Go to **API permissions**
   - Click **Add a permission**
   - Add the following **delegated** permissions:
     - **Microsoft Graph**:
       - `openid`
       - `profile`
     - **Power Automate Service**:
       - `Flows.Read.All`
       - `Flows.Manage.All`
       - `Activity.Read.All`
   - Click **Grant admin consent** if required by your organization's policy
6. In **Overview**, copy your `Application (client) ID`

---

### 3. 🛠️ Configure the Tool

Open `script.js` and find this section:

```
const AZURE_CLIENT_ID = '38442c9b-62e6-44a9-a756-effd91ef7b82'; // Replace with your own
const REDIRECT_URI = location.origin + location.pathname;       // Defaults to current page
```

Replace the `clientId` with your app’s **Application (client) ID** from step 6.


---

### 4. Run the App

You can:

- Upload to a host of your choice (recommended)  
- Serve it with a static file server:

```bash
npx http-server .
```

Then visit: `http://localhost:8080`

---

## 🔐 Privacy & Security

- This app uses Microsoft’s official [MSAL.js](https://github.com/AzureAD/microsoft-authentication-library-for-js) to authenticate.
- All data requests are made directly between your browser and Microsoft’s Power Automate API.
- The app does **not collect**, **store**, or **transmit** any personal data.
- 100% client-side and open source.

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).  
Feel free to use, modify, and share.
