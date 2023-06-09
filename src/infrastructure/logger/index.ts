import { Logger as PinoLogger, pino } from "pino";

import { pinoMixin as telemetryMixin } from "../telemetry/instrumentations/pino.js";

export type Logger = PinoLogger;
export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

export function createMockLogger(): Logger {
  return createLogger("mock-logger", {
    config: { logLevel: "error" },
  });
}

export function createLogger(
  serviceName: string,
  { config }: { config: { logLevel: LogLevel } },
): Logger {
  const logger = pino({
    name: "app",
    level: config.logLevel,
    formatters: {
      // format level as string instead of number
      level(label) {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    hooks: {
      // reverse pino method so it goes logger.method(message, details) instead
      // of logger.method(details, message)
      logMethod(inputArguments: unknown[], method) {
        if (inputArguments.length >= 2) {
          const argument1 = inputArguments[0];
          const argument2 = inputArguments[1];
          Reflect.apply(method, this, [
            argument2,
            argument1,
            ...inputArguments.slice(2),
          ]);

          return;
        }

        method.apply(this, inputArguments as [string, ...unknown[]]);
      },
    },
    mixin: telemetryMixin,
  });

  return logger.child({
    serviceName,
  });
}
