import { AZURE_CLIENT_ID, REDIRECT_URI } from './config.js';
import { state } from './state.js';
import { showStatusMessage } from './utils.js';

// ─── MSAL init ────────────────────────────────────────────────────────────────

export function initializeMSAL() {
  state.msalInstance = new msal.PublicClientApplication({
    auth: {
      clientId: AZURE_CLIENT_ID,
      redirectUri: REDIRECT_URI,
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false,
    },
  });
}

// ─── Sign in ──────────────────────────────────────────────────────────────────

export async function signIn() {
  try {
    const loginResponse = await state.msalInstance.loginPopup({
      scopes: ['https://graph.microsoft.com/.default'],
    });
    state.msalInstance.setActiveAccount(loginResponse.account);
    updateUIAfterSignIn(loginResponse.account);
  } catch (error) {
    console.error('Error during sign-in:', error);
    showStatusMessage('Error during sign-in: ' + error.message, 'error');
  }
}

// ─── Sign out ─────────────────────────────────────────────────────────────────

export async function signOut() {
  const account = state.msalInstance.getActiveAccount();
  try {
    await state.msalInstance.logoutPopup({ account });
  } catch {
    // logoutPopup may be blocked; fall back to clearing the cache locally
    state.msalInstance.getAllAccounts().forEach(a => state.msalInstance.clearCache({ account: a }));
  }
  location.reload();
}

// ─── Post-login UI ────────────────────────────────────────────────────────────

export function updateUIAfterSignIn(account) {
  const signInPrompt = document.getElementById('signInPrompt');
  if (signInPrompt) signInPrompt.style.display = 'none';

  showUserProfile(account);

  const environmentSection = document.getElementById('environmentSection');
  if (environmentSection) environmentSection.classList.remove('hidden');
}

function showUserProfile(account) {
  const userProfile = document.getElementById('userProfile');
  const userInitials = document.getElementById('userInitials');
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');

  if (userProfile && account) {
    const name = account.name || account.username || 'User';
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    if (userInitials) userInitials.textContent = initials;
    if (userName) userName.textContent = name;
    if (userEmail) userEmail.textContent = account.username || account.homeAccountId;
    userProfile.classList.remove('hidden');
  }
}

