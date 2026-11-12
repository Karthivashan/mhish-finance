const BACKUP_NAME = 'mhish-finance-backup.json';
const BACKUP_VERSION = 1;

const request = async (url, token, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!response.ok) {
    let message = `Google Drive request failed (${response.status}).`;
    try {
      const body = await response.json();
      if (body.error?.message) message = body.error.message;
    } catch {
      // Keep the HTTP status message when Google returns a non-JSON error.
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
};

export async function getGoogleUser(token) {
  const response = await request('https://www.googleapis.com/oauth2/v3/userinfo', token);
  if (!response.email) throw new Error('Google did not provide an email address for this account.');
  return { email: response.email, name: response.name || response.email, picture: response.picture || '' };
}

async function findBackup(token) {
  const query = encodeURIComponent(`name = '${BACKUP_NAME}' and 'appDataFolder' in parents and trashed = false`);
  const result = await request(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&pageSize=10&fields=files(id,name)&q=${query}`,
    token,
  );
  return result.files?.[0] || null;
}

export function parseDriveBackup(value) {
  const data = value?.version === BACKUP_VERSION ? value.data : null;
  if (!data || !Array.isArray(data.transactions) || !Array.isArray(data.categories)
      || !Array.isArray(data.budgets) || !Array.isArray(data.notifications)
      || !data.profile || typeof data.profile !== 'object'
      || Array.isArray(data.profile)
  || !data.preferences || typeof data.preferences !== 'object' || Array.isArray(data.preferences)) {
    throw new Error('The Mhish backup in Google Drive is invalid or unsupported. Your browser data was left unchanged.');
  }
  return data;
}

export async function loadDriveBackup(token) {
  const file = await findBackup(token);
  if (!file) return { fileId: null, data: null };
  const data = await request(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`,
    token,
  );
  return { fileId: file.id, data: parseDriveBackup(data) };
}

export async function saveDriveBackup(token, fileId, data) {
  const body = JSON.stringify({ version: BACKUP_VERSION, data });
  if (fileId) {
    try {
      await request(
        `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`,
        token,
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body },
      );
      return fileId;
    } catch (error) {
      if (error.status !== 404 && error.status !== 410) throw error;
    }
  }

  const boundary = `mhish_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
  const metadata = JSON.stringify({
    name: BACKUP_NAME,
    mimeType: 'application/json',
    parents: ['appDataFolder'],
  });
  const multipartBody = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadata,
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    body,
    `--${boundary}--`,
    '',
  ].join('\r\n');
  const result = await request(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body: multipartBody,
    },
  );
  return result.id;
}
