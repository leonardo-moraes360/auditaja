"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db/client";
import { SECOES } from "./secoes";

const Pedido = z.object({
  parlamentarId: z.coerce.number().int().positive(),
  secao: z.enum(Object.keys(SECOES) as [keyof typeof SECOES, ...(keyof typeof SECOES)[]]),
  descricao: z.string().trim().min(20, "Descreva o erro com pelo menos 20 caracteres.").max(4000),
  contato: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? v : null)),
});

export type EstadoPedido = { erro?: string };

/** R6: registra o pedido de correção. O contato é opcional e não é exibido. */
export async function enviarPedido(_: EstadoPedido, form: FormData): Promise<EstadoPedido> {
  const r = Pedido.safeParse({
    parlamentarId: form.get("parlamentarId"),
    secao: form.get("secao"),
    descricao: form.get("descricao"),
    contato: form.get("contato") ?? undefined,
  });
  if (!r.success) return { erro: r.error.issues[0]?.message ?? "Dados inválidos." };
  const db = getDb();
  const existe = await db
    .selectFrom("parlamentar")
    .select("id")
    .where("id", "=", r.data.parlamentarId)
    .executeTakeFirst();
  if (!existe) return { erro: "Parlamentar não encontrado." };
  await db
    .insertInto("pedido_correcao")
    .values({
      parlamentar_id: r.data.parlamentarId,
      secao: r.data.secao,
      descricao: r.data.descricao,
      contato: r.data.contato,
    })
    .execute();
  redirect(`/parlamentares/${r.data.parlamentarId}/contestar?enviado=1`);
}
