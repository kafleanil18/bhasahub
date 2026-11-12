import { useEffect, useState } from 'react';
export default function StudioSaveStatus() {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const fail = () => setFailed(true);
    const saved = () => setFailed(false);
    window.addEventListener('studio-activity-save-error', fail);
    window.addEventListener('studio-activity-saved', saved);
    return () => {
      window.removeEventListener('studio-activity-save-error', fail);
      window.removeEventListener('studio-activity-saved', saved);
    };
  }, []);
  return failed ? <div className="container" role="status"><p>Your latest practice activity couldn’t be saved to My Progress. Check your connection; you can keep practicing.</p><button onClick={() => setFailed(false)}>Dismiss</button></div> : null;
}
