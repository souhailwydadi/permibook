import { NextResponse } from "next/server";
import { getOwnerSchool, getSessionUser } from "@/lib/server-auth";
import { getSuspension } from "@/lib/school";

/**
 * Shared guard for every owner write API: the caller must be signed in,
 * own a school, and the school must not be suspended (OFF, trial expired
 * or unpaid). Returns `{ user, school }` or `{ error }` (a NextResponse
 * to return directly). Writes always go through the service-role client
 * with the school_id verified here — never trust a client-supplied id.
 */
export async function requireOwner() {
  const user = await getSessionUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }
  const school = await getOwnerSchool(user.id);
  if (!school) {
    return {
      error: NextResponse.json({ error: "no school" }, { status: 404 }),
    };
  }
  if (getSuspension(school).suspended) {
    return {
      error: NextResponse.json({ error: "school_suspended" }, { status: 403 }),
    };
  }
  return { user, school };
}
