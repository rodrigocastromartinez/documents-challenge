import { HttpError, httpClient } from '@/shared/network/httpClient';
import type { Document } from '@/features/documents/types';

type RawContributor = {
  ID: string;
  Name: string;
};

type RawDocument = {
  ID: string;
  Title: string;
  Version: string;
  CreatedAt: string;
  UpdatedAt: string;
  Attachments?: string[];
  Contributors?: RawContributor[];
};

function mapDocument(raw: RawDocument): Document {
  return {
    id: raw.ID,
    title: raw.Title,
    version: raw.Version,
    createdAt: raw.CreatedAt,
    updatedAt: raw.UpdatedAt,
    attachments: raw.Attachments ?? [],
    contributors: (raw.Contributors ?? []).map((contributor) => ({
      id: contributor.ID,
      name: contributor.Name,
    })),
    origin: 'remote',
  };
}

export async function getDocuments(): Promise<Document[]> {
  const raw = await httpClient.get<RawDocument[]>('/documents');
  if (!Array.isArray(raw)) {
    throw new HttpError('Response from /documents was not an array');
  }
  return raw.map(mapDocument);
}
