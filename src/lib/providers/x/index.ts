import { getAppRuntimeConfig } from "../../config";

import { MockXIngestionProvider } from "./mock-provider";
import type { XIngestionProvider } from "./types";

export function createXIngestionProvider(mode = getAppRuntimeConfig().xProviderMode): XIngestionProvider {
  switch (mode) {
    case "mock":
    default:
      return new MockXIngestionProvider();
  }
}

export type { XIngestionProvider, XIngestionSignal } from "./types";
