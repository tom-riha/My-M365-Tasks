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
      cacheLocation: 'sessionStorage',
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

// ─── Post-login UI ────────────────────────────────────────────────────────────

function updateUIAfterSignIn(account) {
  const signInButton = document.getElementById('signInButton');
  if (signInButton) signInButton.style.display = 'none';

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
