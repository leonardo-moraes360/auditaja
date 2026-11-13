import { dataDoBuild, securityTxt } from "@/lib/seguranca";
import { siteUrl } from "@/lib/site";

/** Contato de segurança para máquinas (RFC 9116). Gerado no build; a política fica no SECURITY.md. */
export function GET() {
  return new Response(securityTxt(siteUrl(), dataDoBuild()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
