// Expande um .dc.html (sc-for + {{holes}}) em HTML estático para screenshot.
import fs from "node:fs";
const [src, out] = process.argv.slice(2);
let html = fs.readFileSync(src, "utf8");
const script = html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];
const vals = new Function(
  "class DCLogic{constructor(){this.props={}}};" + script + ";return new Component().renderVals();",
)();
const get = (scope, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), scope);
function expand(tpl, scope) {
  tpl = tpl.replace(/<sc-for list="\{\{([\w.]+)\}\}" as="(\w+)"[^>]*>([\s\S]*?)<\/sc-for>/g, (_, list, as, body) =>
    (get(scope, list) || []).map((item) => expand(body, { ...scope, [as]: item })).join(""),
  );
  return tpl.replace(/\{\{([\w.]+)\}\}/g, (_, p) => {
    const v = get(scope, p);
    return v == null ? "" : String(v);
  });
}
const body = html.match(/<x-dc>([\s\S]*?)<\/x-dc>/)[1];
const helmet = (body.match(/<helmet>([\s\S]*?)<\/helmet>/) || [, ""])[1];
const content = body.replace(/<helmet>[\s\S]*?<\/helmet>/, "");
fs.writeFileSync(
  out,
  `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${helmet}</head><body>${expand(content, vals)}</body></html>`,
);
