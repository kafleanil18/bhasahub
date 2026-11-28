import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiClient';
import { FREE_PAPER_ID } from './mockTests';

// Which HSK 1 mock test is free for every signed-in student. A super admin chooses it in Manage tests;
// H11226 shows until the server answers.
export function useFreePaper() {
  const [paper, setPaper] = useState({ id: FREE_PAPER_ID, code: FREE_PAPER_ID.toUpperCase() });
  useEffect(() => {
    let active = true;
    apiFetch('/api/hsk1/free', { auth: false })
      .then(response => (response.ok ? response.json() : null))
      .then(data => { if (active && data?.id) setPaper({ id: data.id, code: data.code || data.id.toUpperCase() }); })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  return { ...paper, path: `/tests/${paper.id}` };
}
