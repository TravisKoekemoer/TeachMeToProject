import { mockSignals } from "../../../data/mock-signals";

import type { ProviderSignal, XSignalProvider } from "./types";

export class MockXSignalProvider implements XSignalProvider {
  name = "mock-x";

  async fetchSignals(): Promise<ProviderSignal[]> {
    return mockSignals.map((signal) => ({
      ...signal,
      authorDisplayName: signal.authorDisplayName
    }));
  }
}
