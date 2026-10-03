import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth } from './firebase';

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/drive.file',
];

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const googleProvider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => {
  googleProvider.addScope(scope);
});

export const signInWithGoogleWorkspace = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  if (isSigningIn) return null;
  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
      return { user: result.user, accessToken: credential.accessToken };
    }
    return { user: result.user, accessToken: '' };
  } catch (err) {
    console.error('Google Workspace Sign-in Error:', err);
    throw err;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = () => cachedAccessToken;

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

// -------------------------------------------------------------
// Google Workspace API Helpers (Client-side REST)
// -------------------------------------------------------------

// 1. Google Sheets API: Export data rows to a new spreadsheet
export const createGoogleSheet = async (
  accessToken: string,
  title: string,
  rows: string[][]
) => {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        {
          data: [
            {
              rowData: rows.map((row) => ({
                values: row.map((val) => ({
                  userEnteredValue: { stringValue: String(val) },
                })),
              })),
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to create Google Sheet');
  }

  return await response.json();
};

// 2. Google Calendar API: Add an event to primary calendar
export const createCalendarEvent = async (
  accessToken: string,
  event: {
    title: string;
    description: string;
    startIso: string;
    endIso: string;
  }
) => {
  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: event.title,
        description: event.description,
        start: { dateTime: event.startIso, timeZone: 'Asia/Colombo' },
        end: { dateTime: event.endIso, timeZone: 'Asia/Colombo' },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to create Calendar Event');
  }

  return await response.json();
};

// 3. Google Tasks API: Add a task to user's default task list
export const createGoogleTask = async (
  accessToken: string,
  title: string,
  notes: string,
  dueDateIso?: string
) => {
  const response = await fetch(
    'https://tasks.googleapis.com/tasks/v1/lists/@default/tasks',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        notes,
        due: dueDateIso,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to create Google Task');
  }

  return await response.json();
};

// 4. Gmail API: Send an email message
export const sendGmailMessage = async (
  accessToken: string,
  to: string,
  subject: string,
  bodyText: string
) => {
  const emailLines = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    bodyText,
  ];

  const emailRaw = emailLines.join('\r\n');
  const base64EncodedEmail = btoa(unescape(encodeURIComponent(emailRaw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: base64EncodedEmail }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to send Gmail message');
  }

  return await response.json();
};

// 5. Google Drive API: Upload a text/json file to Drive
export const uploadFileToDrive = async (
  accessToken: string,
  fileName: string,
  content: string,
  mimeType = 'text/plain'
) => {
  const metadata = {
    name: fileName,
    mimeType,
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', new Blob([content], { type: mimeType }));

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to upload file to Google Drive');
  }

  return await response.json();
};
