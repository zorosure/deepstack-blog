import { authenticatedSession, getGithubAppCredentials } from "../../../../lib/server/github";

export async function GET(request: Request) {
  const configured = Boolean(await getGithubAppCredentials());
  const session = configured ? await authenticatedSession(request) : undefined;
  return Response.json({ configured, authenticated: Boolean(session), login: session?.login ?? null }, { headers: { "cache-control": "no-store" } });
}
