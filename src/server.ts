import "dotenv/config";

import { prisma } from "@database";

import { app } from "./app";

const PORT = process.env.PORT || 5002;

const startAp = async () => {
  const startApp = async () => {
    try {
      await prisma.$connect();
      console.log("✅ Database connected");
    } catch (error) {
      console.error("❌ Failed to connect to database:", error);
      process.exit(1);
    }

    try {
      app.listen(PORT, () => console.log("Server started on PORT:", PORT));
    } catch (error) {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
    }
  };

  startApp();
};

startAp();
