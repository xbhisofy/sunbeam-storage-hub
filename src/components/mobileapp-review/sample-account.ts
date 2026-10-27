import type { ReviewFile } from './data';

// Presentation data only: never creates an auth session or writes to the backend.
export type ReviewAccount = {
  profile: { display_name: string | null; email: string | null; premium_tier: string | null; premium_until: string | null };
  files: ReviewFile[];
};

export const sampleAccount: ReviewAccount = {
  profile: { display_name: 'Alex Morgan', email: 'alex@example.com', premium_tier: null, premium_until: null },
  files: [
    { id: 'sample-photo', name: 'Mountain getaway.jpg', file_type: 'image', size: 4_194_304, created_at: '2026-10-26T10:00:00Z', slug: 'sample-photo', expires_at: null },
    { id: 'sample-video', name: 'Weekend highlights.mp4', file_type: 'video', size: 52_428_800, created_at: '2026-10-25T10:00:00Z', slug: 'sample-video', expires_at: null },
    { id: 'sample-document', name: 'Project notes.pdf', file_type: 'pdf', size: 1_048_576, created_at: '2026-10-24T10:00:00Z', slug: null, expires_at: null },
    { id: 'sample-audio', name: 'Voice memo.mp3', file_type: 'audio', size: 2_097_152, created_at: '2026-10-23T10:00:00Z', slug: null, expires_at: null },
  ],
};

export function displayedReviewAccount(uid: string | null, account: ReviewAccount | null | undefined) {
  return uid ? account : sampleAccount;
}