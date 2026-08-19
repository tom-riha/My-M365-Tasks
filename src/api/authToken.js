import { InteractionRequiredAuthError, BrowserAuthError } from '@azure/msal-browser';

// MSAL only allows one interactive (popup/redirect) call at a time — a second
// concurrent acquireTokenPopup throws BrowserAuthError("interaction_in_progress").
// The app acquires tokens for three different scopes (Graph, SharePoint, Flow)
// in parallel on load, so if the cached session is stale, multiple callers can
// hit acquireTokenPopup at once. Serialize: a caller that finds a popup already
// in flight waits for it, then retries acquireTokenSilent (which usually
// succeeds once the session has been refreshed by the first popup).
let popupPromise = null;

export async function acquireToken(instance, scopes) {
  const account = instance.getActiveAccount();
  if (!account) throw new Error('No active account. Please sign in again.');

  try {
    const { accessToken } = await instance.acquireTokenSilent({ scopes, account });
    return accessToken;
  } catch (err) {
    if (!(err instanceof InteractionRequiredAuthError || err instanceof BrowserAuthError)) throw err;

    if (popupPromise) {
      await popupPromise.catch(() => {});
      return acquireToken(instance, scopes);
    }

    popupPromise = instance.acquireTokenPopup({ scopes, account });
    try {
      const { accessToken } = await popupPromise;
      return accessToken;
    } finally {
      popupPromise = null;
    }
  }
}
