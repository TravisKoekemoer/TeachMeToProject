export type ProviderSignal = {
  platformSignalId: string;
  authorHandle: string;
  authorDisplayName: string | null;
  postText: string;
  postUrl: string;
  createdAt: string;
  rawJson: Record<string, unknown>;
};

export interface XSignalProvider {
  name: string;
  fetchSignals(): Promise<ProviderSignal[]>;
}

