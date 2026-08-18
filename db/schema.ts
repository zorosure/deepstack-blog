import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const appConfig = sqliteTable("app_config", {
  key: text("key").primaryKey(),
  encryptedValue: text("encrypted_value").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const oauthStates = sqliteTable("oauth_states", {
  state: text("state").primaryKey(),
  codeVerifier: text("code_verifier").notNull(),
  expiresAt: integer("expires_at").notNull(),
});

export const adminSessions = sqliteTable("admin_sessions", {
  id: text("id").primaryKey(),
  githubLogin: text("github_login").notNull(),
  encryptedToken: text("encrypted_token").notNull(),
  encryptedRefreshToken: text("encrypted_refresh_token"),
  accessTokenExpiresAt: integer("access_token_expires_at").notNull(),
  refreshTokenExpiresAt: integer("refresh_token_expires_at"),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});
