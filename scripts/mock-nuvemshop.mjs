// Servidor que imita a Nuvemshop para testar o fluxo completo sem uma loja real.
// Uso: node scripts/mock-nuvemshop.mjs   (porta 4010)
// No .env: NUVEMSHOP_AUTH_BASE=http://localhost:4010  NUVEMSHOP_API_BASE=http://localhost:4010
//          NUVEMSHOP_CLIENT_ID=123  NUVEMSHOP_CLIENT_SECRET=segredo
// Comportamentos simulados:
//   - a cada 7ª criação devolve 429 (limite de requisições)
//   - SKU que contém "FALHA" recebe 422 (erro definitivo, ex.: imagem inválida)
//   - SKU que contém "TIMEOUT" é criado, mas a resposta "se perde" (testa a reconciliação)
import http from "node:http";

const PORT = Number(process.env.MOCK_PORT ?? 4010);
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const STORE_ID = 777;
const products = new Map(); // id -> produto
let nextId = 1000;
let creates = 0;
const timedOut = new Set();

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { "Content-Type": "application/json", ...headers });
  res.end(body === undefined ? "" : JSON.stringify(body));
};

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    const p = url.pathname;

    if (req.method === "GET" && /^\/apps\/[^/]+\/authorize$/.test(p)) {
      const state = url.searchParams.get("state");
      res.writeHead(302, { Location: `${APP_URL}/api/nuvemshop/retorno?code=codigo-teste&state=${state}` });
      return res.end();
    }
    if (req.method === "POST" && p === "/apps/authorize/token") {
      if (body.code !== "codigo-teste") return send(res, 400, { error: "invalid_grant" });
      return send(res, 200, { access_token: "token-teste", token_type: "bearer", scope: "write_products", user_id: STORE_ID });
    }
    if (!req.headers["user-agent"]) return send(res, 400, { error: "User-Agent obrigatório" });
    if (req.headers.authorization !== "Bearer token-teste") return send(res, 401, { error: "não autorizado" });

    const base = `/2025-03/${STORE_ID}`;
    if (req.method === "GET" && p === `${base}/store`) {
      return send(res, 200, { id: STORE_ID, name: { pt: "Loja Demo da Ana" }, main_language: "pt" });
    }
    if (req.method === "GET" && p.startsWith(`${base}/products/sku/`)) {
      const sku = decodeURIComponent(p.split("/").pop());
      const found = [...products.values()].find((x) => x.variants.some((v) => v.sku === sku));
      return found ? send(res, 200, found) : send(res, 404, { code: 404, message: "Not Found" });
    }
    if (req.method === "GET" && p === `${base}/products`) {
      return send(res, 200, [...products.values()]);
    }
    if (req.method === "POST" && p === `${base}/products`) {
      creates++;
      if (creates % 7 === 0) return send(res, 429, { code: 429 }, { "x-rate-limit-reset": "300" });
      const sku = body.variants?.[0]?.sku ?? "";
      if (sku.includes("FALHA")) return send(res, 422, { images: ["Image could not be downloaded"] });
      const product = { id: nextId++, ...body };
      products.set(product.id, product);
      if (sku.includes("TIMEOUT") && !timedOut.has(sku)) {
        timedOut.add(sku);
        req.socket.destroy(); // produto criado, resposta perdida
        return;
      }
      return send(res, 201, product);
    }
    send(res, 404, { error: "rota não simulada", path: p });
  })
  .listen(PORT, () => console.log(`Nuvemshop simulada em http://localhost:${PORT}`));
