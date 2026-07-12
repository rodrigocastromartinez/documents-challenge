import { Share } from 'react-native';

import { shareDocument } from '@/features/documents/shareDocument';
import type { Document } from '@/features/documents/types';

const document: Document = {
  id: 'doc-1',
  title: 'Hop Rod Rye',
  version: '2.6.16',
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-01T10:00:00.000Z',
  attachments: [],
  contributors: [],
  origin: 'remote',
};

describe('shareDocument', () => {
  let shareSpy: jest.SpyInstance;

  beforeEach(() => {
    shareSpy = jest.spyOn(Share, 'share');
  });

  afterEach(() => {
    shareSpy.mockRestore();
  });

  it('shares a message with the title and version', async () => {
    shareSpy.mockResolvedValueOnce({ action: 'sharedAction' });

    await shareDocument(document);

    expect(shareSpy).toHaveBeenCalledWith({
      message: 'Hop Rod Rye — Version 2.6.16',
    });
  });

  it('does not throw when the share sheet is dismissed or fails', async () => {
    shareSpy.mockRejectedValueOnce(new Error('dismissed'));

    await expect(shareDocument(document)).resolves.toBeUndefined();
  });
});
