import { cnpjValido } from "../../src/trilha";

/** CNPJ fictício com dígitos verificadores corretos a partir dos 12 primeiros dígitos. */
export function comDv(base12: string): string {
  for (let dv = 0; dv < 100; dv++) {
    const c = base12 + String(dv).padStart(2, "0");
    if (cnpjValido(c)) return c;
  }
  throw new Error(`sem DV para ${base12}`);
}
