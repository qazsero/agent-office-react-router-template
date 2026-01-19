import { log } from "~/lib-server/logger.server";

export function logRequest(request: Request): void {
  const url = new URL(request.url);

  // Skip SSE endpoints entirely - they're too noisy.
  if (url.pathname.includes("/events")) return;

  // Skip static assets and health checks.
  if (
    url.pathname.includes("_remix") ||
    url.pathname.includes("/health") ||
    url.pathname.includes("/heartbeat")
  ) {
    return;
  }

  log.info("HTTP Request", {
    method: request.method,
    pathname: url.pathname,
    userAgent: request.headers.get("user-agent"),
  });
}
