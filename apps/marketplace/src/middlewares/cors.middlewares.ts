import * as cors from "cors";

export const corsMiddleware = cors.default({
  origin: "http://localhost:3000", // or [ "http://localhost:3000", "http://localhost:3002", ...]
  credentials: true, // cookies
});
