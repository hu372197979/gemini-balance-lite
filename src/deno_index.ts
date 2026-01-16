import { handleRequest } from "./handle_request.js";

async function denoHandleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  console.log('Request URL:', req.url);

  // CORS 配置（可用环境变量覆盖）
  const ALLOW_ORIGIN = Deno.env.get("ALLOW_ORIGIN") ?? "*";
  const ALLOW_METHODS = "GET,POST,PUT,DELETE,OPTIONS";
  const ALLOW_HEADERS = "Content-Type, Authorization";
  const EXPOSE_HEADERS = "Content-Length, Content-Type";
  const MAX_AGE = "86400";

  // 预检请求（浏览器会发送 OPTIONS）
  if (req.method === "OPTIONS") {
    const headers = new Headers({
      "Access-Control-Allow-Origin": ALLOW_ORIGIN,
      "Access-Control-Allow-Methods": ALLOW_METHODS,
      "Access-Control-Allow-Headers": ALLOW_HEADERS,
      "Access-Control-Max-Age": MAX_AGE,
    });
    return new Response(null, { status: 204, headers });
  }

  // 调用现有处理逻辑
  const resp = await handleRequest(req);

  // 在返回的 response 上注入 CORS 头（保留原有 headers 和状态）
  const newHeaders = new Headers(resp.headers);
  if (!newHeaders.has("Access-Control-Allow-Origin")) {
    newHeaders.set("Access-Control-Allow-Origin", ALLOW_ORIGIN);
  }
  newHeaders.set("Access-Control-Allow-Methods", ALLOW_METHODS);
  newHeaders.set("Access-Control-Allow-Headers", ALLOW_HEADERS);
  newHeaders.set("Access-Control-Expose-Headers", EXPOSE_HEADERS);

  // 如果需要支持带凭证的请求（cookies / Authorization），启用下面一行并确保 ALLOW_ORIGIN 不是 '*'
  // newHeaders.set("Access-Control-Allow-Credentials", "true");

  return new Response(resp.body, { status: resp.status, headers: newHeaders });
};

Deno.serve({ port: 80 }, denoHandleRequest);