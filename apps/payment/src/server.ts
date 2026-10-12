import "dotenv/config";

import { logger } from "@packages/logger";

import { prisma } from "@database";

import { app } from "./app";

const PORT = Number(process.env.PORT) || 5004;

const startApp = async () => {
  try {
    await prisma.$connect();
    logger.info("Payment: database connected");
  } catch (err) {
    logger.fatal({ err }, "Payment: failed to connect to database");
    process.exit(1);
  }

  const server = app.listen(PORT, () =>
    logger.info({ port: PORT }, "Payment: server started"),
  );

  server.on("error", (err) => {
    logger.fatal({ err }, "Payment: failed to start server");
    process.exit(1);
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, "Payment: shutting down");
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Payment: unhandledRejection");
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Payment: uncaughtException");
  process.exit(1);
});

startApp();
