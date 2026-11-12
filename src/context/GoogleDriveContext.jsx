import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { KEYS, hasKey, read, remove, write } from '../services/storageService';
import { getGoogleUser, loadDriveBackup, saveDriveBackup } from '../services/googleDriveService';

const GoogleDriveContext = createContext(null);
const LAST_ACCOUNT_KEY = 'expense_tracker_google_account';
const GOOGLE_SCRIPT_ID = 'google-identity-services';
const GOOGLE_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const GOOGLE_SCOPES = 'openid email profile https://www.googleapis.com/auth/drive.appdata';

let googleScriptPromise;

function loadGoogleIdentity() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const script = document.getElementById(GOOGLE_SCRIPT_ID) || document.createElement('script');
      script.id = GOOGLE_SCRIPT_ID;
      script.src = GOOGLE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        googleScriptPromise = null;
        reject(new Error('Google sign-in could not be loaded. Check your internet connection and try again.'));
      };
      if (!script.parentNode) document.head.appendChild(script);
    });
  }
  return googleScriptPromise;
}

function requestAccessToken(clientId, prompt = 'select_account') {
  const request = () => new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_SCOPES,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description || response.error || 'Google sign-in did not return an access token.'));
          return;
        }
        resolve(response.access_token);
      },
      error_callback: (error) => reject(new Error(error.message || 'Google sign-in was cancelled or blocked.')),
    });
    client.requestAccessToken({ prompt });
  });
  return window.google?.accounts?.oauth2 ? request() : loadGoogleIdentity().then(request);
}

function localSnapshot() {
  if (!Object.values(KEYS).some(hasKey)) return null;
  return {
    transactions: read(KEYS.transactions, []),
    categories: read(KEYS.categories, []),
    budgets: read(KEYS.budgets, []),
    profile: read(KEYS.profile, {}),
    preferences: read(KEYS.preferences, {}),
    notifications: read(KEYS.notifications, []),
  };
}

function restoreSnapshot(data) {
  Object.values(KEYS).forEach(remove);
  write(KEYS.transactions, data.transactions);
  write(KEYS.categories, data.categories);
  write(KEYS.budgets, data.budgets);
  write(KEYS.profile, data.profile);
  write(KEYS.preferences, data.preferences);
  write(KEYS.notifications, data.notifications);
}

function getPreviousAccount() {
  try {
    return window.localStorage.getItem(LAST_ACCOUNT_KEY) || '';
  } catch {
    return '';
  }
}

function rememberAccount(email) {
  try {
    window.localStorage.setItem(LAST_ACCOUNT_KEY, email);
  } catch {
    // Account switching can still proceed when browser storage is unavailable.
  }
}

export function GoogleDriveProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('disconnected');
  const [syncError, setSyncError] = useState('');
  const [identityReady, setIdentityReady] = useState(false);
  const [identityLoading, setIdentityLoading] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const tokenRef = useRef(null);
  const fileIdRef = useRef(null);
  const lastAccountRef = useRef('');
  const saveQueueRef = useRef(Promise.resolve());

  const prepareGoogleIdentity = useCallback(async () => {
    setIdentityLoading(true);
    try {
      await loadGoogleIdentity();
      setIdentityReady(true);
      setSyncError('');
      return true;
    } catch (error) {
      setSyncError(error.message);
      return false;
    } finally {
      setIdentityLoading(false);
    }
  }, []);

  useEffect(() => { prepareGoogleIdentity(); }, [prepareGoogleIdentity]);

  const authorize = useCallback(async (prompt) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) throw new Error('Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID and restart the app.');
    return requestAccessToken(clientId, prompt);
  }, []);

  const connect = useCallback(async () => {
    setStatus('connecting');
    setSyncError('');
    try {
      const token = await authorize('select_account');
      const account = await getGoogleUser(token);
      const backup = await loadDriveBackup(token);
      if (backup.data) {
        restoreSnapshot(backup.data);
      } else {
        const previousAccount = lastAccountRef.current || getPreviousAccount();
        const isDifferentAccount = previousAccount && previousAccount.toLowerCase() !== account.email.toLowerCase();
        if (isDifferentAccount) Object.values(KEYS).forEach(remove);
        const existingData = isDifferentAccount ? null : localSnapshot();
        if (existingData) fileIdRef.current = await saveDriveBackup(token, null, existingData);
      }

      rememberAccount(account.email);
      lastAccountRef.current = account.email;
      tokenRef.current = token;
      fileIdRef.current = backup.fileId || fileIdRef.current;
      setUser(account);
      setStatus('connected');
      setLastSyncedAt(new Date());
      return true;
    } catch (error) {
      tokenRef.current = null;
      fileIdRef.current = null;
      setStatus('disconnected');
      setSyncError(error.message || 'Could not connect to Google Drive.');
      return false;
    }
  }, [authorize]);

  const reconnect = useCallback(async () => {
    try {
      const token = await authorize('');
      tokenRef.current = token;
      setSyncError('');
      setStatus('connected');
      return true;
    } catch (error) {
      setSyncError(error.message || 'Could not reconnect to Google Drive.');
      return false;
    }
  }, [authorize]);

  const signOut = useCallback(() => {
    tokenRef.current = null;
    fileIdRef.current = null;
    setUser(null);
    setStatus('disconnected');
    setSyncError('');
    setLastSyncedAt(null);
  }, []);

  const saveSnapshot = useCallback((data) => {
    const operation = saveQueueRef.current.then(async () => {
      if (!tokenRef.current) return false;
      setStatus('syncing');
      setSyncError('');
      try {
        fileIdRef.current = await saveDriveBackup(tokenRef.current, fileIdRef.current, data);
        setLastSyncedAt(new Date());
        setStatus('connected');
        return true;
      } catch (error) {
        setSyncError(error.message || 'Could not save your data to Google Drive.');
        setStatus('error');
        return false;
      }
    });
    saveQueueRef.current = operation.then(() => undefined, () => undefined);
    return operation;
  }, []);

  const value = useMemo(() => ({
    user, status, syncError, identityReady, identityLoading, lastSyncedAt,
    connect, prepareGoogleIdentity, reconnect, signOut, saveSnapshot,
  }), [user, status, syncError, identityReady, identityLoading, lastSyncedAt, connect, prepareGoogleIdentity, reconnect, signOut, saveSnapshot]);
  return <GoogleDriveContext.Provider value={value}>{children}</GoogleDriveContext.Provider>;
}

export function useGoogleDrive() {
  const context = useContext(GoogleDriveContext);
  if (!context) throw new Error('useGoogleDrive must be used inside <GoogleDriveProvider>');
  return context;
}
