export interface SeedAuthorCredential {
  authorName: string;
  email: string;
  password: string;
}

/**
 * Development/test fixtures only. Catalog seeding is forbidden in production.
 * Administrator credentials remain environment-owned.
 */
const seedAuthorCredentials: readonly SeedAuthorCredential[] = [
  {
    authorName: 'Jesper Kyd',
    email: 'jesper.kyd@bnr.local',
    password: 'JesperKyd!2026',
  },
  {
    authorName: 'Brian Tyler',
    email: 'brian.tyler@bnr.local',
    password: 'BrianTyler!2026',
  },
  {
    authorName: 'Malcolm Kirby Jr.',
    email: 'malcolm.kirby@bnr.local',
    password: 'MalcolmK!2026',
  },
  {
    authorName: 'Lorne Bafle',
    email: 'lorne.bafle@bnr.local',
    password: 'LorneBafle!2026',
  },
];

export default seedAuthorCredentials;
