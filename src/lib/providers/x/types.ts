import type { XProviderMode } from "../../config";

export type XIngestionSignal = {
  platformSignalId: string;
  authorHandle: string;
  authorDisplayName: string | null;
  postText: string;
  postUrl: string;
  createdAt: string;
  rawJson: Record<string, unknown>;
};

export interface XIngestionProvider {
  platform: "x";
  mode: XProviderMode;
  name: string;
  fetchSignals(): Promise<XIngestionSignal[]>;
}
