import { createHash } from "crypto";

export function stableId(namespace: string, value: string) {
  return `${namespace}_${createHash("sha1").update(value).digest("hex").slice(0, 24)}`;
}
