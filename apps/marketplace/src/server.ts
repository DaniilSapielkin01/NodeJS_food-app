import "dotenv/config";

import { prisma } from "@database";

import { app } from "./app";

const PORT = process.env.PORT || 5002;

import { logger } from "@utils/logger/logger";

const startApp = async () => {
  try {
    await prisma.$connect();
    logger.info("Database connected");
  } catch (err) {
    logger.fatal({ err }, "Failed to connect to database");
    process.exit(1);
  }

  try {
    app.listen(PORT, () => logger.info({ port: PORT }, "Server started"));
  } catch (err) {
    logger.fatal({ err }, "Failed to start server");
    process.exit(1);
  }
};

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "unhandledRejection");
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaughtException");
  process.exit(1);
});

startApp();
