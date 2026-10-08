import { randomUUID } from "node:crypto";

import { pinoHttp } from "pino-http";

import { logger } from "@utils/logger/logger";

export const httpLoggerMiddleware = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const header = req.headers["x-request-id"];
    const id = typeof header === "string" ? header : randomUUID();
    res.setHeader("x-request-id", id);
    return id;
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
