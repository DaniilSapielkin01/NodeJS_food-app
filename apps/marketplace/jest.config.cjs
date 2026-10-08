require("dotenv").config({ path: ".env.test" });

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { useESM: true, tsconfig: "tsconfig.test.json" }],
  },
  moduleNameMapper: {
    // алиасы из tsconfig paths
    "^@(utils|modules|database|middlewares|config|errors|generated)(.*)$":
      "<rootDir>/src/$1$2",
    // сгенерированный Prisma-код импортирует с расширением .js
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testMatch: ["<rootDir>/__tests__/**/*.test.ts"],
};
