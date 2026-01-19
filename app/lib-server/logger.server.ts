import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

// Configure Pino for Railway-compatible structured JSON logging.
const logger = pino({
  level: isProduction ? "info" : "debug",
  messageKey: "message",
  ...(isProduction
    ? {
        serializers: {
          err: pino.stdSerializers.err,
          error: (error: unknown) => {
            if (error instanceof Error) {
              return {
                name: error.name,
                message: error.message,
                stack: error.stack?.replace(/\n/g, "\\n") ?? "",
              };
            }
            return error;
          },
        },
        formatters: { level: (label: string) => ({ level: label.toLowerCase() }) },
        prettyPrint: false,
      }
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss Z", ignore: "pid,hostname" },
        },
      }),
  base: {},
  formatters: {
    ...(isProduction && { level: (label: string) => ({ level: label.toLowerCase() }) }),
  },
});

export const log = {
  debug: (message: string, meta?: Record<string, unknown>) => {
    logger.debug(meta ?? {}, message);
  },
  info: (message: string, meta?: Record<string, unknown>) => {
    logger.info(meta ?? {}, message);
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    logger.warn(meta ?? {}, message);
  },
  error: (
    message: string,
    error?: Error | Record<string, unknown>,
    meta?: Record<string, unknown>
  ) => {
    const errorData: Record<string, unknown> = meta ? { ...meta } : {};
    if (error instanceof Error) {
      errorData.error = {
        name: error.name,
        message: error.message,
        stack: error.stack?.replace(/\n/g, "\\n") ?? "",
      };
    } else if (error && typeof error === "object") {
      Object.assign(errorData, error);
    }
    logger.error(errorData, message);
  },
};

export function trackError(
  code: string,
  meta?: Record<string, unknown>,
  err?: unknown
): void {
  if (err instanceof Error) {
    log.error(code, err, { code, ...(meta ?? {}) });
  } else {
    log.error(code, undefined, { code, ...(meta ?? {}), error: err });
  }
}

export async function withTiming<T>(
  label: string,
  fn: () => Promise<T>,
  meta?: Record<string, unknown>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const durationMs = Math.round(performance.now() - start);
    log.info(`${label} completed`, { ...(meta ?? {}), durationMs });
    return result;
  } catch (error) {
    const durationMs = Math.round(performance.now() - start);
    log.error(
      `${label} failed`,
      error instanceof Error ? error : new Error(String(error)),
      { ...(meta ?? {}), durationMs }
    );
    throw error;
  }
}

export default logger;

let consolePatched = false;
export function patchConsoleToPino(): void {
  if (consolePatched) return;
  consolePatched = true;

  type PinoLevel = "debug" | "info" | "warn" | "error";
  const map: Record<"log" | "info" | "warn" | "error" | "debug", PinoLevel> = {
    log: "info",
    info: "info",
    warn: "warn",
    error: "error",
    debug: "debug",
  };
  /* eslint-disable no-control-regex */
  const ansiRegex = new RegExp(
    "[\\u001B\\u009B][[()\\]#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]",
    "g"
  );
  /* eslint-enable no-control-regex */
  const stripAnsi = (input: string): string => input.replace(ansiRegex, "");
  const sanitize = (value: unknown): string => {
    try {
      const str = typeof value === "string" ? value : String(value ?? "");
      const noAnsi = stripAnsi(str);
      const singleLine = noAnsi.replace(/\s+/g, " ").trim();
      return singleLine.length > 2000 ? `${singleLine.slice(0, 2000)}...` : singleLine;
    } catch {
      return "";
    }
  };

  (Object.keys(map) as Array<keyof typeof map>).forEach((method) => {
    const level = map[method];
    const original = (console as unknown as Record<string, unknown>)[method] as
      | ((...data: unknown[]) => void)
      | undefined;
    (console as unknown as Record<string, unknown>)[method] = ((...args: unknown[]) => {
      try {
        if (args.length === 0) {
          logger[level]({}, "");
          return;
        }
        const [first, ...rest] = args;
        if (typeof first === "string") {
          const msg = sanitize(first);
          if (!msg) return;
          logger[level]({ extra: rest }, msg);
          return;
        }
        if (first && typeof first === "object") {
          logger[level]({ console: first as Record<string, unknown>, extra: rest }, "[console]");
          return;
        }
        const msg = sanitize(first);
        if (!msg) return;
        logger[level]({ extra: rest }, msg);
      } catch {
        if (original) {
          try {
            original(...args);
          } catch {
            void 0;
          }
        }
      }
    }) as unknown;
  });
}
