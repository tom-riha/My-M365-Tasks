// Replace with your own Azure App Registration client ID — see README.md
export const AZURE_CLIENT_ID = '299c5d7a-4ed5-4363-9a4b-a9f98b65c075';
export const REDIRECT_URI    = location.origin + location.pathname;

// Microsoft Graph covers sign-in + Planner + To Do; Power Automate approvals
// live on a separate resource/audience and need their own token.
export const GRAPH_SCOPES = ['https://graph.microsoft.com/.default'];
export const FLOW_SCOPES  = ['https://service.flow.microsoft.com/.default'];

export const MSAL_CONFIG = {
  auth: {
    clientId:    AZURE_CLIENT_ID,
    redirectUri: REDIRECT_URI,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};
