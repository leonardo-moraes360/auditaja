import type { ColumnType, Generated, Insertable, Selectable } from "kysely";

/** Valores numeric do Postgres chegam como string pelo driver `pg`. */
type Numeric = ColumnType<string, string | number, string | number>;
type Timestamp = ColumnType<Date, Date | string, Date | string>;
type DateCol = ColumnType<string, string, string>;

/**
 * Classe do titular do dado (R3). Define como o documento é exibido.
 * Só `agente_publico` e `pessoa_juridica` aparecem sem máscara.
 */
export type ClasseTitular =
  "agente_publico" | "candidato" | "pessoa_juridica" | "terceiro_pf" | "menor" | "desconhecido";

/** R1: um registro por arquivo ou resposta coletada. */
export interface ColetaTable {
  id: Generated<number>;
  fonte: string;
  url: string;
  coletado_em: Timestamp;
  sha256: string;
  bytes: number;
  licenca: string;
  observacao: string | null;
}

export interface ParlamentarTable {
  id: number;
  casa: "camara";
  nome: string;
  nome_civil: string | null;
  sigla_partido: string | null;
  sigla_uf: string | null;
  url_foto: string | null;
  /** Uso interno: casamento com o TSE. Não é exibido (R2). */
  data_nascimento: DateCol | null;
  /** "F" ou "M", do deputados.csv da Câmara; null se não informado. */
  sexo: string | null;
  id_legislatura: number | null;
  em_exercicio: boolean;
  source_url: string;
  coleta_id: number;
  /** Coleta de /deputados/{id}/historico; null = histórico ainda não coletado. */
  historico_coleta_id: ColumnType<number | null, number | null | undefined, number | null>;
}

export interface OrgaoMembroTable {
  parlamentar_id: number;
  sigla_orgao: string;
  nome_orgao: string;
  cargo: string;
  data_inicio: DateCol | null;
  data_fim: DateCol | null;
  coleta_id: number;
}

export interface DespesaCeapTable {
  id: Generated<string>;
  parlamentar_id: number;
  ano: number;
  mes: number;
  tipo_despesa: string;
  fornecedor_nome: string;
  /** CNPJ formatado ou CPF mascarado (R3). Nunca o CPF completo. */
  fornecedor_doc: string | null;
  fornecedor_classe: ClasseTitular;
  data_emissao: DateCol | null;
  valor_documento: Numeric;
  valor_glosa: Numeric;
  valor_liquido: Numeric;
  valor_restituicao: Numeric;
  url_documento: string | null;
  ide_documento: string | null;
  coleta_id: number;
}

export interface VotacaoTable {
  id: string;
  data: DateCol;
  sigla_orgao: string;
  descricao: string;
  proposicao: string | null;
  /** Proposição principal votada, ex.: "PL 1234/2026" (votacoesObjetos). */
  proposicao_sigla: string | null;
  proposicao_ementa: string | null;
  aprovacao: number | null;
  votos_sim: number;
  votos_nao: number;
  votos_outros: number;
  source_url: string;
  coleta_id: number;
}

export interface VotoTable {
  votacao_id: string;
  parlamentar_id: number;
  voto: string;
  sigla_partido: string | null;
  coleta_id: number;
}

export interface OrientacaoTable {
  votacao_id: string;
  sigla_bancada: string;
  orientacao: string;
  coleta_id: number;
}

/** Dias inteiros fora do exercício do mandato (src/lib/exercicio.ts). */
export interface PeriodoForaExercicioTable {
  id: Generated<number>;
  parlamentar_id: number;
  inicio: DateCol;
  fim: DateCol | null;
  situacao: string;
  motivo: string;
  source_url: string;
  coleta_id: number;
}

export interface BlocoTable {
  id: number;
  nome: string;
  id_legislatura: number;
  federacao: boolean;
  coleta_id: number;
}

export interface BlocoPartidoTable {
  bloco_id: number;
  sigla_partido: string;
  origem: "api" | "nome";
  coleta_id: number;
}

export interface CandidaturaTable {
  ano_eleicao: number;
  sq_candidato: string;
  parlamentar_id: number;
  cargo: string;
  sigla_uf: string;
  sigla_partido: string | null;
  situacao: string | null;
  coleta_id: number;
}

export interface BemDeclaradoTable {
  id: Generated<string>;
  ano_eleicao: number;
  sq_candidato: string;
  parlamentar_id: number;
  ordem: number;
  /** Só o tipo: a descrição livre pode conter endereço (R2). */
  tipo: string;
  valor: Numeric;
  coleta_id: number;
}

export interface PedidoCorrecaoTable {
  id: Generated<number>;
  parlamentar_id: number;
  secao: string;
  descricao: string;
  contato: string | null;
  status: Generated<"recebido" | "em_analise" | "corrigido" | "mantido">;
  criado_em: Generated<Timestamp>;
}

export interface Database {
  coleta: ColetaTable;
  parlamentar: ParlamentarTable;
  orgao_membro: OrgaoMembroTable;
  despesa_ceap: DespesaCeapTable;
  votacao: VotacaoTable;
  voto: VotoTable;
  orientacao: OrientacaoTable;
  bloco: BlocoTable;
  bloco_partido: BlocoPartidoTable;
  candidatura: CandidaturaTable;
  bem_declarado: BemDeclaradoTable;
  pedido_correcao: PedidoCorrecaoTable;
  periodo_fora_exercicio: PeriodoForaExercicioTable;
}

export type Parlamentar = Selectable<ParlamentarTable>;
export type NovaDespesa = Insertable<DespesaCeapTable>;
