"use client";

import { useActionState } from "react";
import { enviarPedido, type EstadoPedido } from "./actions";

export function FormularioPedido({
  parlamentarId,
  secaoInicial,
  secoes,
}: {
  parlamentarId: number;
  secaoInicial: string;
  secoes: Record<string, string>;
}) {
  const [estado, acao, pendente] = useActionState<EstadoPedido, FormData>(enviarPedido, {});
  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="parlamentarId" value={parlamentarId} />
      <div className="flex flex-col gap-1">
        <label htmlFor="secao" className="text-sm font-medium">
          Qual parte do perfil?
        </label>
        <select
          id="secao"
          name="secao"
          defaultValue={secaoInicial}
          className="h-11 rounded-md border border-input bg-superficie px-3"
        >
          {Object.entries(secoes).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="descricao" className="text-sm font-medium">
          O que está errado e qual é a informação correta?
        </label>
        <textarea
          id="descricao"
          name="descricao"
          required
          minLength={20}
          maxLength={4000}
          rows={6}
          className="rounded-md border border-input bg-superficie p-3"
          aria-describedby={estado.erro ? "descricao-ajuda erro-pedido" : "descricao-ajuda"}
          aria-invalid={estado.erro ? true : undefined}
        />
        <p id="descricao-ajuda" className="text-xs text-muted-foreground">
          Se puder, inclua o link do documento oficial que comprova a correção.
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="contato" className="text-sm font-medium">
          E-mail para resposta (opcional)
        </label>
        <input
          id="contato"
          name="contato"
          type="email"
          maxLength={200}
          className="h-11 rounded-md border border-input bg-superficie px-3"
          aria-describedby="contato-ajuda"
        />
        <p id="contato-ajuda" className="text-xs text-muted-foreground">
          Usado só para responder a este pedido. Não é publicado.
        </p>
      </div>
      {estado.erro && (
        <p id="erro-pedido" role="alert" className="rounded-md bg-aviso-fundo p-3 text-sm text-aviso">
          {estado.erro}
        </p>
      )}
      <button
        type="submit"
        disabled={pendente}
        className="h-11 rounded-md bg-primary px-5 font-semibold text-primary-foreground hover:bg-primaria-hover disabled:border disabled:border-dashed disabled:border-input disabled:bg-muted disabled:text-muted-foreground"
      >
        {pendente ? "Enviando…" : "Enviar pedido"}
      </button>
    </form>
  );
}
