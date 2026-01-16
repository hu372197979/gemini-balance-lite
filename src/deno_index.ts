import { handleRequest } from "./handle_request.js";

async function denoHandleRequest(req: Request): Promise<Response> {
  console.log("Request URL:", req.url);

  // 默认 CORS 配置，可用环境变量覆盖
  const ALLOW_ORIGIN = Deno.env.get("ALLOW_ORIGIN") ?? "*";
  const ALLOW_METHODS = "GET,POST,PUT,DELETE,OPTIONS";
  const DEFAULT_ALLOW_HEADERS = "Content-Type, Authorization, x-goog-api-key, x-goog-api-client";
  const EXPOSE_HEADERS = "Content-Length, Content-Type, x-goog-api-key, x-goog-api-client";
  const MAX_AGE = "86400";

  // 预检请求（OPTIONS）处理：回显浏览器请求的 headers，包含自定义头如 x-goog-api-key / x-goog-api-client
  if (req.method === "OPTIONS") {
    // 浏览器会在预检请求里发送这个 header，列出真实请求想要使用的自定义头
    const requested = req.headers.get("access-control-request-headers");
    // 如果浏览器有请求特定 headers，就回显；否则使用默认包含 x-goog-* 的列表
    const allowHeaders = requested ? requested : DEFAULT_ALLOW_HEADERS;

    const headers = new Headers({
      "Access-Control-Allow-Origin": ALLOW_ORIGIN,
      "Access-Control-Allow-Methods": ALLOW_METHODS,
      "Access-Control-Allow-Headers": allowHeaders,
      "Access-Control-Max-Age": MAX_AGE,
      // 如果需要支持携带凭证（cookies / Authorization），取消注释下面行并确保 ALLOW_ORIGIN 不是 '*'
      // "Access-Control-Allow-Credentials": "true",
    });
    return new Response(null, { status: 204, headers });
  }

  // 业务处理
  const resp = await handleRequest(req);

  // 在返回的 response 上注入 CORS 头（保留原有 headers 和状态）
  const newHeaders = new Headers(resp.headers);
  if (!newHeaders.has("Access-Control-Allow-Origin")) {
    newHeaders.set("Access-Control-Allow-Origin", ALLOW_ORIGIN);
  }
  newHeaders.set("Access-Control-Allow-Methods", ALLOW_METHODS);
  // 在非预检响应中也列出允许的自定义头，包含 x-goog-api-key 与 x-goog-api-client
  newHeaders.set("Access-Control-Allow-Headers", DEFAULT_ALLOW_HEADERS);
  newHeaders.set("Access-Control-Expose-Headers", EXPOSE_HEADERS);
  // newHeaders.set("Access-Control-Allow-Credentials", "true"); // 如需携带凭证则启用并确保 ALLOW_ORIGIN 非 '*'

  return new Response(resp.body, { status: resp.status, headers: newHeaders });
};

Deno.serve({ port: 80 }, denoHandleRequest);