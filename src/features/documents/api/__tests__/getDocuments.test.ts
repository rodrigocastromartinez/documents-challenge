import { getDocuments } from '@/features/documents/api/getDocuments';
import { httpClient } from '@/shared/network/httpClient';

jest.mock('@/shared/network/httpClient');

const mockedHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe('getDocuments', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('requests /documents and maps the raw response into typed documents', async () => {
    mockedHttpClient.get.mockResolvedValueOnce([
      {
        ID: 'doc-1',
        Title: 'Hop Rod Rye',
        Version: '2.6.16',
        CreatedAt: '2026-07-01T10:00:00.000Z',
        UpdatedAt: '2026-07-02T10:00:00.000Z',
        Attachments: ['Light Lager', 'Porter'],
        Contributors: [{ ID: 'user-1', Name: 'Carlie Abott' }],
      },
    ]);

    const documents = await getDocuments();

    expect(mockedHttpClient.get).toHaveBeenCalledWith('/documents');
    expect(documents).toEqual([
      {
        id: 'doc-1',
        title: 'Hop Rod Rye',
        version: '2.6.16',
        createdAt: '2026-07-01T10:00:00.000Z',
        updatedAt: '2026-07-02T10:00:00.000Z',
        attachments: ['Light Lager', 'Porter'],
        contributors: [{ id: 'user-1', name: 'Carlie Abott' }],
      },
    ]);
  });

  it('maps a document with no contributors to an empty array', async () => {
    mockedHttpClient.get.mockResolvedValueOnce([
      {
        ID: 'doc-2',
        Title: 'Stone IPA',
        Version: '3.8.11',
        CreatedAt: '2026-07-01T10:00:00.000Z',
        UpdatedAt: '2026-07-01T10:00:00.000Z',
        Attachments: [],
        Contributors: [],
      },
    ]);

    const [document] = await getDocuments();

    expect(document?.contributors).toEqual([]);
    expect(document?.attachments).toEqual([]);
  });

  it('returns an empty array when the server returns none', async () => {
    mockedHttpClient.get.mockResolvedValueOnce([]);

    await expect(getDocuments()).resolves.toEqual([]);
  });
});
