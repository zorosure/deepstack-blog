import { getD1 } from "./runtime";

let initialized = false;

export async function ensureAuthSchema() {
  if (initialized) return;
  const db = getD1();
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS app_config (key TEXT PRIMARY KEY NOT NULL, encrypted_value TEXT NOT NULL, updated_at INTEGER NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS oauth_states (state TEXT PRIMARY KEY NOT NULL, code_verifier TEXT NOT NULL, expires_at INTEGER NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS admin_sessions (id TEXT PRIMARY KEY NOT NULL, github_login TEXT NOT NULL, encrypted_token TEXT NOT NULL, encrypted_refresh_token TEXT, access_token_expires_at INTEGER NOT NULL, refresh_token_expires_at INTEGER, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at)"),
  ]);
  initialized = true;
}

export async function getEncryptedConfig(key: string) {
  await ensureAuthSchema();
  const row = await getD1().prepare("SELECT encrypted_value FROM app_config WHERE key = ?").bind(key).first<{ encrypted_value: string }>();
  return row?.encrypted_value;
}

export async function setEncryptedConfig(key: string, encryptedValue: string) {
  await ensureAuthSchema();
  await getD1().prepare("INSERT INTO app_config (key, encrypted_value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET encrypted_value = excluded.encrypted_value, updated_at = excluded.updated_at").bind(key, encryptedValue, Date.now()).run();
}

export async function saveOAuthState(state: string, codeVerifier: string, expiresAt: number) {
  await ensureAuthSchema();
  const db = getD1();
  await db.batch([
    db.prepare("DELETE FROM oauth_states WHERE expires_at < ?").bind(Date.now()),
    db.prepare("INSERT INTO oauth_states (state, code_verifier, expires_at) VALUES (?, ?, ?)").bind(state, codeVerifier, expiresAt),
  ]);
}

export async function consumeOAuthState(state: string) {
  await ensureAuthSchema();
  const db = getD1();
  const row = await db.prepare("SELECT code_verifier, expires_at FROM oauth_states WHERE state = ?").bind(state).first<{ code_verifier: string; expires_at: number }>();
  await db.prepare("DELETE FROM oauth_states WHERE state = ?").bind(state).run();
  return row && row.expires_at > Date.now() ? row.code_verifier : undefined;
}

export async function createSession(input: { id: string; githubLogin: string; encryptedToken: string; encryptedRefreshToken?: string; accessTokenExpiresAt: number; refreshTokenExpiresAt?: number; expiresAt: number }) {
  await ensureAuthSchema();
  const db = getD1();
  await db.batch([
    db.prepare("DELETE FROM admin_sessions WHERE expires_at < ?").bind(Date.now()),
    db.prepare("INSERT INTO admin_sessions (id, github_login, encrypted_token, encrypted_refresh_token, access_token_expires_at, refresh_token_expires_at, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(input.id, input.githubLogin, input.encryptedToken, input.encryptedRefreshToken ?? null, input.accessTokenExpiresAt, input.refreshTokenExpiresAt ?? null, input.expiresAt, Date.now()),
  ]);
}

export async function getSession(id: string) {
  await ensureAuthSchema();
  const row = await getD1().prepare("SELECT github_login, encrypted_token, encrypted_refresh_token, access_token_expires_at, refresh_token_expires_at, expires_at FROM admin_sessions WHERE id = ?").bind(id).first<{ github_login: string; encrypted_token: string; encrypted_refresh_token: string | null; access_token_expires_at: number; refresh_token_expires_at: number | null; expires_at: number }>();
  if (!row || row.expires_at <= Date.now()) {
    if (row) await deleteSession(id);
    return undefined;
  }
  return row;
}

export async function updateSessionTokens(id: string, input: { encryptedToken: string; encryptedRefreshToken?: string; accessTokenExpiresAt: number; refreshTokenExpiresAt?: number }) {
  await ensureAuthSchema();
  await getD1().prepare("UPDATE admin_sessions SET encrypted_token = ?, encrypted_refresh_token = ?, access_token_expires_at = ?, refresh_token_expires_at = ? WHERE id = ?")
    .bind(input.encryptedToken, input.encryptedRefreshToken ?? null, input.accessTokenExpiresAt, input.refreshTokenExpiresAt ?? null, id).run();
}

export async function deleteSession(id: string) {
  await ensureAuthSchema();
  await getD1().prepare("DELETE FROM admin_sessions WHERE id = ?").bind(id).run();
}
