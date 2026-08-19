# My M365 Tasks

A lightweight, fully client-side web tool to view and action your Microsoft 365 tasks — Microsoft Planner tasks, Microsoft To Do tasks, and Power Automate approval tasks — across all of your environments in one place.

## Features

- ✅ View your open Microsoft Planner and Microsoft To Do tasks, and pending Power Automate approval tasks, aggregated in one list
- 📋 View all pending approval tasks where you are the approver, aggregated across every Power Automate environment you have access to
- 🌍 Show/hide Planner or To Do tasks independently with a toggle
- 🔍 Filter tasks by title
- ⏰ Tasks grouped by urgency — overdue, due today, this week, later
- 🏷️ Priority badges on approval tasks (High / Medium / Low)
- 📋 Task and approval detail panels — description, Planner checklist, requestor info, and a direct link to open the item
- ⚡ Complete a Planner or To Do task, or approve/reject an approval (with an optional comment), directly from the list or the detail panel
- 🔃 Manual refresh across all three sources
- 🔗 Deep link directly to a specific approval task via URL query parameters (`?environmentId=<env-id>&taskId=<task-id>`)
- 🧭 Sidebar quick links to Planner, To Do, and Power Automate, plus a link straight to each Power Automate environment's approvals list
- 📜 On-screen breakdown of exactly which Microsoft Graph and Power Automate permissions the app requests, and why
- 🔐 Fully client-side: all requests go directly to Microsoft — no backend, no proxy
- 🎭 "Try the demo" — see the app populated with example data, no sign-in and no Azure app registration required. Demo data lives only in your browser tab and is never sent anywhere.
- 🧩 Open source and self-hostable

## 🌐 Live Demo

A hosted version of the app is available at **[https://mytasks.workappholics.com](https://mytasks.workappholics.com)** — click **Try the demo** on the sign-in screen to explore it with example data before setting up your own Azure app registration.

---

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
     - URI: `http://localhost:3000` *(or wherever you'll host the tool)*
4. Click **Register**
5. After registration:
   - Go to **API permissions**
   - Click **Add a permission**
   - Add the following **delegated** permissions:
     - **Microsoft Graph**:
       - `openid`
       - `profile`
       - `Tasks.ReadWrite` *(reads and completes Planner + To Do tasks)*
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

### 4. Install & Run

This is a React + Vite app, so dependencies must be installed first:

```bash
npm install
npm run dev
```

Then visit: `http://localhost:3000`

### 5. Build for Deployment

```bash
npm run build
```

This produces a static `dist/` folder — deploy it to any static host (Azure Static Web Apps, Cloudflare Pages, GitHub Pages, etc.). You can preview the production build locally with `npm run preview`.

---

## 🔐 Privacy & Security

- This app uses Microsoft's official [MSAL](https://github.com/AzureAD/microsoft-authentication-library-for-js) libraries to authenticate.
- All data requests are made directly between your browser and Microsoft's Graph and Power Automate APIs.
- Authentication state is stored in `localStorage` so your session persists across page refreshes. You can sign out at any time using the sign-out button.
- The app does **not collect**, **store**, or **transmit** any personal data.
- 100% client-side and open source.

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).
Feel free to use, modify, and share.
