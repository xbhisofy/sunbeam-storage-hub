import { describe, expect, it } from 'vitest';
import { sharingAllowed, UNSUPPORTED_UPLOAD } from './content-safety';
describe('Upload safety rules', () => {
  it('does not share pending files', () => { expect(sharingAllowed({ moderation_status: 'pending', scan_status: 'clean' })).toBe(false); });
  it('does not share blocked files', () => { expect(sharingAllowed({ moderation_status: 'blocked', scan_status: 'clean' })).toBe(false); });
  it('requires a clean scan even after approval', () => { expect(sharingAllowed({ moderation_status: 'approved', scan_status: 'error' })).toBe(false); });
  it('allows only approved and clean files', () => { expect(sharingAllowed({ moderation_status: 'approved', scan_status: 'clean' })).toBe(true); });
  it('blocks executable uploads', () => { expect(UNSUPPORTED_UPLOAD.test('malware.EXE')).toBe(true); });
  it('blocks archives', () => { expect(UNSUPPORTED_UPLOAD.test('hidden.zip')).toBe(true); });
});