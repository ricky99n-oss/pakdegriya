import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function validateRequest() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("auth_session")?.value;

  if (!sessionId) {
    return { user: null, session: null };
  }

  // Cocokkan sesi di database Postgres
  const result = await db.select({ user: users, session: sessions })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId));

  if (result.length === 0) {
    return { user: null, session: null };
  }

  const { user, session } = result[0];

  // PROTEKSI 1 HARI: Jika waktu saat ini melebih batas expiresAt
  if (Date.now() >= session.expiresAt.getTime()) {
    // Hapus sesi dari database
    await db.delete(sessions).where(eq(sessions.id, session.id));
    return { user: null, session: null };
  }

  return { user, session };
}