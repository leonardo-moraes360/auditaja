import "server-only";
import { connection } from "next/server";
import { getDb } from "@auditaja/db/client";
import { CASAS_LEGISLATIVO, CASAS_TITULAR } from "@auditaja/core/poderes";

export async function parlamentarExiste(id: number): Promise<boolean> {
  await connection();
  const row = await getDb()
    .selectFrom("parlamentar")
    .select("id")
    .where("id", "=", id)
    .where("casa", "in", [...CASAS_LEGISLATIVO])
    .executeTakeFirst();
  return !!row;
}

export async function titularExiste(id: number): Promise<boolean> {
  await connection();
  const row = await getDb()
    .selectFrom("parlamentar")
    .select("id")
    .where("id", "=", id)
    .where("casa", "in", [...CASAS_TITULAR])
    .executeTakeFirst();
  return !!row;
}
