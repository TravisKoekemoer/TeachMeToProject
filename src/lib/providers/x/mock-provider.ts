import { mockSignals } from "../../../data/mock-signals";

import type { XIngestionProvider } from "./types";

export class MockXIngestionProvider implements XIngestionProvider {
  platform = "x" as const;
  mode = "mock" as const;
  name = "mock-x";

  async fetchSignals() {
    return Promise.resolve(mockSignals);
  }
}
