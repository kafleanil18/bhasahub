import { useEffect, useState } from 'react';

// The team shown on About Xiao Ao: the teachers managed in Admin > Teachers.
export function useTeam() {
  const [team, setTeam] = useState({ loading: true, members: [], failed: false });
  useEffect(() => {
    let active = true;
    fetch(`${window.API_BASE_URL}/api/teachers`)
      .then(response => response.ok ? response.json() : Promise.reject(new Error('unavailable')))
      .then(data => { if (active) setTeam({ loading: false, members: Array.isArray(data) ? data.filter(member => member.name?.trim()) : [], failed: false }); })
      .catch(() => { if (active) setTeam({ loading: false, members: [], failed: true }); });
    return () => { active = false; };
  }, []);
  return team;
}
