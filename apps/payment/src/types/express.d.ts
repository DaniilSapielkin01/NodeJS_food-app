import { JwtPayload } from "jsonwebtoken";

import { ERole } from "@generated/prisma/enums";

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; roles: ERole[] };
    }
  }
}
