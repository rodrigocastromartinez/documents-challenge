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
};
