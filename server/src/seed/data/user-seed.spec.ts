import seedAuthorCredentials from './user-seed';

describe('seed author credentials', () => {
  it('defines stable development logins for every catalog author', () => {
    expect(seedAuthorCredentials).toEqual([
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
    ]);
  });
});
