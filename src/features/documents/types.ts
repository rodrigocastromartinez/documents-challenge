export type Contributor = {
  id: string;
  name: string;
};

export type Document = {
  id: string;
  title: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  attachments: string[];
  contributors: Contributor[];
  // "local" documents only ever exist client-side (see TECH-PLAN.md §1 — the reference server
  // has no create endpoint); "remote" ones came from getDocuments(). Lets the reducer/storage
  // layer tell them apart without a separate parallel list.
  origin: 'local' | 'remote';
};
