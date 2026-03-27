import { MockXSignalProvider } from "./mock-provider";
import type { XSignalProvider } from "./types";

export function createXSignalProvider(mode: "mock" = "mock"): XSignalProvider {
  if (mode === "mock") {
    return new MockXSignalProvider();
  }

  return new MockXSignalProvider();
}

export type { ProviderSignal, XSignalProvider } from "./types";

