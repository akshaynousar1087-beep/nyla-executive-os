"use client";

import type { ModuleName, Session } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";
const sessionKey = "nyla.supabase.session";
const refreshBufferSeconds = 60;

let refreshPromise: Promise<Session | null> | null = null;
let sessionRevision = 0;

export const isConfigured = () => Boolean(url && key);

const headers = (
  token?: string,
  extra: Record<string, string> = {},
) => ({
  apikey: key,
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  "Content-Type": "application/json",
  ...extra,
});

async function responseError(response: Response) {
  const body = await response.text();
  if (!body) return new Error(`Request failed (${response.status})`);
  try {
    const parsed = JSON.parse(body);
    return new Error(
      parsed?.msg ||
        parsed?.message ||
        parsed?.error_description ||
        (typeof parsed?.error === "string" ? parsed.error : body),
    );
  } catch {
    return new Error(body);
  }
}

async function parse(response: Response) {
  if (!response.ok) throw await responseError(response);
  const body = await response.text();
  return body ? JSON.parse(body) : null;
}

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<Session>;
  return Boolean(
    session.access_token &&
      session.refresh_token &&
      session.user?.id &&
      session.user?.email,
  );
}

function readSession() {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(window.localStorage.getItem(sessionKey) || "null");
    return isSession(value) ? value : null;
  } catch {
    return null;
  }
}

function saveSession(value: Session & { expires_in?: number }) {
  const session: Session = {
    ...value,
    expires_at:
      value.expires_at ||
      Math.floor(Date.now() / 1000) + Number(value.expires_in || 3600),
  };
  window.localStorage.setItem(sessionKey, JSON.stringify(session));
  return session;
}

function clearSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(sessionKey);
  }
}

async function requestRefresh() {
  const stored = readSession();
  if (!stored?.refresh_token) return null;
  const revision = sessionRevision;

  const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ refresh_token: stored.refresh_token }),
  });

  if (!response.ok) {
    if ([400, 401, 403].includes(response.status)) clearSession();
    throw await responseError(response);
  }

  const refreshed = await response.json();
  if (revision !== sessionRevision) return null;
  return saveSession(refreshed);
}

export const auth = {
  session: readSession,

  async restoreSession() {
    const stored = readSession();
    if (!stored) return null;

    const expiresSoon =
      !stored.expires_at ||
      stored.expires_at <=
        Math.floor(Date.now() / 1000) + refreshBufferSeconds;
    if (!expiresSoon) return stored;

    try {
      return await this.refresh();
    } catch {
      // Preserve a locally restored session through temporary network failures.
      // Invalid or revoked refresh tokens are cleared by requestRefresh().
      return readSession();
    }
  },

  async signIn(email: string, password: string) {
    if (!isConfigured())
      throw new Error("Supabase environment variables are not configured.");
    sessionRevision += 1;
    const data = await parse(
      await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ email, password }),
      }),
    );
    if (!isSession(data)) {
      throw new Error("Supabase did not return a valid login session.");
    }
    return saveSession(data);
  },

  async signUp(email: string, password: string, fullName: string) {
    if (!isConfigured())
      throw new Error("Supabase environment variables are not configured.");
    return parse(
      await fetch(`${url}/auth/v1/signup`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          email,
          password,
          data: { full_name: fullName },
        }),
      }),
    );
  },

  async refresh() {
    if (!refreshPromise) {
      refreshPromise = requestRefresh().finally(() => {
        refreshPromise = null;
      });
    }
    return refreshPromise;
  },

  signOut() {
    sessionRevision += 1;
    clearSession();
  },
};

async function token() {
  let session = await auth.restoreSession();
  if (!session) throw new Error("Not authenticated");

  if (
    session.expires_at &&
    session.expires_at <= Math.floor(Date.now() / 1000)
  ) {
    session = await auth.refresh();
  }
  if (!session) throw new Error("Not authenticated");
  return session.access_token;
}

export const db = {
  async list(table: ModuleName, query = "order=created_at.desc") {
    return parse(
      await fetch(`${url}/rest/v1/${table}?select=*&${query}`, {
        headers: headers(await token()),
      }),
    );
  },

  async create(table: ModuleName, value: Record<string, unknown>) {
    const session = await auth.restoreSession();
    if (!session) throw new Error("Not authenticated");
    return parse(
      await fetch(`${url}/rest/v1/${table}`, {
        method: "POST",
        headers: headers(await token(), { Prefer: "return=representation" }),
        body: JSON.stringify({ ...value, user_id: session.user.id }),
      }),
    );
  },

  async update(
    table: ModuleName,
    id: string,
    value: Record<string, unknown>,
  ) {
    return parse(
      await fetch(`${url}/rest/v1/${table}?id=eq.${id}`, {
        method: "PATCH",
        headers: headers(await token(), { Prefer: "return=representation" }),
        body: JSON.stringify(value),
      }),
    );
  },

  async remove(table: ModuleName, id: string) {
    return parse(
      await fetch(`${url}/rest/v1/${table}?id=eq.${id}`, {
        method: "DELETE",
        headers: headers(await token(), { Prefer: "return=minimal" }),
      }),
    );
  },
};

export async function chat(message: string, conversationId?: string) {
  const bearer = await token();
  return parse(
    await fetch(`${url}/functions/v1/nyla-chat`, {
      method: "POST",
      headers: headers(bearer),
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
      }),
    }),
  );
}
