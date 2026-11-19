import { createHash } from "node:crypto";

export const canonicalize = (value: unknown): string => {
  if (value === null || value === undefined) return "null";
  if (typeof value === "bigint") return JSON.stringify(value.toString());
  if (value instanceof Date) return JSON.stringify(value.toISOString());

  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const entries = Object.keys(obj)
      .filter((key) => obj[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(obj[key])}`);
    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(value); // string, number, boolean
};

export const hashRequest = (payload: unknown): string =>
  createHash("sha256").update(canonicalize(payload)).digest("hex");
