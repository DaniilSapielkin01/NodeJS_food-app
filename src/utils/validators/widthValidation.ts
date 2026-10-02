import { NextFunction, Request, Response } from "express";
import { Location, matchedData, ValidationChain } from "express-validator";

import { handleValidationErrors } from "./handleValidationErrors";

const keepOnlyValidated =
  (locations: Location[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (locations.includes("body")) {
      req.body = matchedData(req, { locations: ["body"] });
    }

    if (locations.includes("query")) {
      Object.defineProperty(req, "query", {
        value: matchedData(req, { locations: ["query"] }),
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }

    next();
  };

export const withValidation = (rules: ValidationChain[]) => {
  const locations = [
    ...new Set(rules.flatMap((rule) => rule.builder.build().locations)),
  ];

  return [...rules, handleValidationErrors, keepOnlyValidated(locations)];
};
