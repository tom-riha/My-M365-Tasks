# My M365 Tasks

A lightweight, fully client-side web tool to view and action Microsoft Power Automate approval tasks across all of your environments in one place.

## Features

- ✅ View all pending approval tasks where you are the approver, aggregated across every Power Automate environment you have access to  
- 🌍 Filter tasks by environment using toggleable checkboxes, with select-all / deselect-all shortcuts  
- 🔍 Search tasks in real time by title, environment, state, or result  
- 🔃 Sort tasks by title, environment, creation date, or priority  
- 🏷️ Priority badges (High / Medium / Low) displayed inline on every task row  
- 📋 Task detail modal showing full description (Markdown rendered), requestor name and email, item link, and a direct link to open the task in Power Automate  
- ⚡ Approve or reject tasks directly from the table or the detail modal, with an optional comment and a confirmation step  
- 🔄 Automatic per-environment task refresh after each approval response  
- 🔗 Deep link directly to a specific approval task via URL query parameters (`?environmentId=<env-id>&taskId=<task-id>`)  
- 🔐 Fully client-side: all requests go directly to Microsoft — no backend, no proxy  
- 🧩 Open source and self-hostable  

## 🚀 Getting Started

### 1. Clone or Download the Source

Clone the repository:

```bash
git clone https://github.com/tom-riha/My-M365-Tasks.git
```

Or download the ZIP from GitHub and extract it locally.

---

### 2. ⚙️ Register an Azure App

To authenticate with Microsoft, each user should register their own Azure AD app.

#### Steps:

1. Go to [Azure Portal](https://portal.azure.com) → **App registrations**
2. Click **New registration**
3. Fill out:
   - **Name:** `My M365 Tasks` (or any name)
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
       - `Approvals.Read.All`
       - `Approvals.Manage.All`
   - Click **Grant admin consent** if required by your organisation's policy
6. In **Overview**, copy your `Application (client) ID`

---

### 3. 🛠️ Configure the Tool

Open `src/config.js` and update the client ID:

```js
export const AZURE_CLIENT_ID = 'YOUR-CLIENT-ID-HERE'; // Replace with your own
export const REDIRECT_URI = location.origin + location.pathname; // Defaults to current page
```

Replace `YOUR-CLIENT-ID-HERE` with your app's **Application (client) ID** from step 6.


---

### 4. Build (optional)

The project includes a simple build step that bundles the source modules into a single `bundle.js` file. If you want to run the bundled version:

```bash
npm run build
```

If you prefer to run the unbundled source directly, skip this step — the app also works by serving the source files with a module-aware static server.

---

### 5. Run the App

Serve it with a static file server:

```bash
npm run serve
```

Or manually:

```bash
npx http-server . -p 3000 -o
```

Then visit: `http://localhost:3000`

---

## 🔐 Privacy & Security

- This app uses Microsoft’s official [MSAL.js](https://github.com/AzureAD/microsoft-authentication-library-for-js) to authenticate.
- All data requests are made directly between your browser and Microsoft's Power Automate API.
- Authentication state is stored in `localStorage` so your session persists across page refreshes. You can sign out at any time using the sign-out button.
- The app does **not collect**, **store**, or **transmit** any personal data.
- 100% client-side and open source.

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).  
Feel free to use, modify, and share.
