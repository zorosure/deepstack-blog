import { deleteSession } from "../../../../lib/server/auth-db";
import { sessionIdFromRequest } from "../../../../lib/server/github";

export async function POST(request: Request) {
  const id = sessionIdFromRequest(request);
  if (id) await deleteSession(id);
  return new Response(null, { status: 204, headers: { "set-cookie": "deepstack_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0" } });
}
