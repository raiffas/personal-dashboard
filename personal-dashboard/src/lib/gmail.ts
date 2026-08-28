import { join } from "node:path";

const TOKENS_PATH = join(import.meta.dir, "..", "..", ".gmail-tokens.json");
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPE = "https://www.googleapis.com/auth/gmail.modify";
const EXPIRY_BUFFER_MS = 60_000;

export class GmailAuthError extends Error {}

type StoredTokens = {
  refresh_token: string;
  access_token?: string;
  expiry_date?: number;
};

type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} in personal-dashboard/.env`);
  }
  return value;
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const file = Bun.file(TOKENS_PATH);
  if (!(await file.exists())) return null;
  return (await file.json()) as StoredTokens;
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await Bun.write(TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

export function getAuthorizationUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("GOOGLE_CLIENT_ID"),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

async function requestToken(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token endpoint returned ${res.status}: ${text}`);
  }
  return (await res.json()) as TokenResponse;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<StoredTokens> {
  const data = await requestToken({
    code,
    client_id: requireEnv("GOOGLE_CLIENT_ID"),
    client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  if (!data.refresh_token) {
    throw new Error(
      "Google did not return a refresh token. Revoke prior access at https://myaccount.google.com/permissions and try again."
    );
  }
  return {
    refresh_token: data.refresh_token,
    access_token: data.access_token,
    expiry_date: Date.now() + data.expires_in * 1000,
  };
}

async function refreshAccessToken(refreshToken: string): Promise<StoredTokens> {
  const data = await requestToken({
    refresh_token: refreshToken,
    client_id: requireEnv("GOOGLE_CLIENT_ID"),
    client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
    grant_type: "refresh_token",
  });
  return {
    refresh_token: refreshToken,
    access_token: data.access_token,
    expiry_date: Date.now() + data.expires_in * 1000,
  };
}

export async function getValidAccessToken(): Promise<string> {
  const tokens = await loadTokens();
  if (!tokens?.refresh_token) {
    throw new GmailAuthError("No saved Gmail authorization. Run `bun run gmail:auth` first.");
  }
  if (tokens.access_token && tokens.expiry_date && tokens.expiry_date - EXPIRY_BUFFER_MS > Date.now()) {
    return tokens.access_token;
  }
  const refreshed = await refreshAccessToken(tokens.refresh_token);
  await saveTokens(refreshed);
  return refreshed.access_token!;
}

export async function getUnreadCount(): Promise<number> {
  const accessToken = await getValidAccessToken();
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/labels/INBOX", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail API returned ${res.status}: ${text}`);
  }
  const data = (await res.json()) as { messagesUnread: number };
  return data.messagesUnread;
}

export type UnreadMessage = {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  receivedAt: number;
  gmailUrl: string;
};

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function headerValue(headers: { name: string; value: string }[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function parseSender(fromHeader: string): string {
  const match = fromHeader.match(/^"?([^"<]+?)"?\s*<[^>]+>$/);
  return match ? match[1]!.trim() : fromHeader || "(unknown sender)";
}

async function gmailFetch(path: string, accessToken: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail API returned ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function gmailGet(path: string, accessToken: string): Promise<any> {
  return gmailFetch(path, accessToken);
}

async function gmailPost(path: string, accessToken: string, body?: unknown): Promise<any> {
  return gmailFetch(path, accessToken, { method: "POST", body: body ? JSON.stringify(body) : undefined });
}

export async function listUnreadMessages(maxResults = 50): Promise<UnreadMessage[]> {
  const accessToken = await getValidAccessToken();

  const listData = await gmailGet(`/messages?q=${encodeURIComponent("is:unread in:inbox")}&maxResults=${maxResults}`, accessToken);
  const ids: string[] = (listData.messages ?? []).map((m: { id: string }) => m.id);
  if (ids.length === 0) return [];

  const metadataParams = "format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date";
  const messages = await mapWithConcurrency(ids, 8, async (id) => {
    const data = await gmailGet(`/messages/${id}?${metadataParams}`, accessToken);
    const headers = (data.payload?.headers ?? []) as { name: string; value: string }[];
    return {
      id,
      sender: parseSender(headerValue(headers, "From")),
      subject: headerValue(headers, "Subject") || "(no subject)",
      snippet: data.snippet ?? "",
      receivedAt: Number(data.internalDate) || 0,
      gmailUrl: `https://mail.google.com/mail/u/0/#inbox/${id}`,
    } satisfies UnreadMessage;
  });

  return messages.sort((a, b) => b.receivedAt - a.receivedAt);
}

async function modifyMessage(id: string, changes: { add?: string[]; remove?: string[] }): Promise<void> {
  const accessToken = await getValidAccessToken();
  await gmailPost(`/messages/${id}/modify`, accessToken, {
    addLabelIds: changes.add ?? [],
    removeLabelIds: changes.remove ?? [],
  });
}

export async function archiveMessage(id: string): Promise<void> {
  await modifyMessage(id, { remove: ["INBOX", "UNREAD"] });
}

export async function trashMessage(id: string): Promise<void> {
  await modifyMessage(id, { remove: ["UNREAD"] });
  const accessToken = await getValidAccessToken();
  await gmailPost(`/messages/${id}/trash`, accessToken);
}

type GmailLabel = { id: string; name: string };

async function getOrCreateLabelId(labelName: string, accessToken: string): Promise<string> {
  const { labels } = (await gmailGet("/labels", accessToken)) as { labels: GmailLabel[] };
  const existing = labels.find((l) => l.name === labelName);
  if (existing) return existing.id;

  const created = (await gmailPost("/labels", accessToken, {
    name: labelName,
    labelListVisibility: "labelShow",
    messageListVisibility: "show",
  })) as GmailLabel;
  return created.id;
}

export async function moveMessageToLabel(id: string, labelName: string): Promise<void> {
  const accessToken = await getValidAccessToken();
  const labelId = await getOrCreateLabelId(labelName, accessToken);
  await modifyMessage(id, { add: [labelId], remove: ["INBOX"] });
}
