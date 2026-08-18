import { env } from "cloudflare:workers";

type RuntimeBindings = Record<string, unknown>;

export function optionalRuntimeValue(name: string) {
  const runtime = env as unknown as RuntimeBindings;
  const value = runtime[name] ?? process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function runtimeValue(name: string) {
  const value = optionalRuntimeValue(name);
  if (!value) throw new Error(`Missing runtime configuration: ${name}`);
  return value;
}

export function getD1() {
  const runtime = env as unknown as RuntimeBindings;
  const database = runtime.DB;
  if (!database) throw new Error("D1 binding DB is unavailable");
  return database as D1DatabaseLike;
}

export type D1StatementLike = {
  bind: (...values: unknown[]) => D1StatementLike;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  run: () => Promise<unknown>;
};

export type D1DatabaseLike = {
  prepare: (sql: string) => D1StatementLike;
  batch: (statements: D1StatementLike[]) => Promise<unknown[]>;
};
