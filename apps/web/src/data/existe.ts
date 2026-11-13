import "server-only";
import { connection } from "next/server";
import { getDb } from "@auditaja/db/client";

export async function parlamentarExiste(id: number): Promise<boolean> {
  await connection();
  const row = await getDb().selectFrom("parlamentar").select("id").where("id", "=", id).executeTakeFirst();
  return !!row;
}
