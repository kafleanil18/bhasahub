import { usePracticeAccess } from '../access/practiceAccess';

// The red bar is the HSK 1 free mock test, for people who can't open every mock test: guests (who
// sign in first) and students without a free week, plan or course subscription. It goes straight to
// the free paper. Everyone with every mock test finds them on their HSK course pages instead.
export function useShowsFreeMockTest(user) {
  const { status } = usePracticeAccess(user);
  return status !== 'approved' && status !== 'loading';
}
