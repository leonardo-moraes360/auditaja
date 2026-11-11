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
          className="h-10 rounded-md border border-input bg-white px-3"
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
          className="rounded-md border border-input bg-white p-3"
          aria-describedby="descricao-ajuda"
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
          className="h-10 rounded-md border border-input bg-white px-3"
          aria-describedby="contato-ajuda"
        />
        <p id="contato-ajuda" className="text-xs text-muted-foreground">
          Usado só para responder a este pedido. Não é publicado.
        </p>
      </div>
      {estado.erro && (
        <p role="alert" className="rounded-md bg-aviso-fundo p-3 text-sm text-aviso">
          {estado.erro}
        </p>
      )}
      <button
        type="submit"
        disabled={pendente}
        className="h-10 rounded-md bg-primary px-5 font-medium text-primary-foreground disabled:opacity-60"
      >
        {pendente ? "Enviando…" : "Enviar pedido"}
      </button>
    </form>
  );
}
