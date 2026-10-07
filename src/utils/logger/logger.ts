import { pino } from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.refreshToken",
    ],
    censor: "[REDACTED]",
  },
  ...(isDev && {
    transport: { target: "pino-pretty", options: { colorize: true } },
  }),
});
