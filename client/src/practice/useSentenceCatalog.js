import { useCallback, useEffect, useState } from 'react';

export function useSentenceCatalog() {
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    setCatalog(null);
    fetch(`${window.API_BASE_URL}/api/sentences`, { signal: controller.signal, headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load sentences.');
        if (!Array.isArray(data.sentences) || !Array.isArray(data.topics)) throw new Error('Could not load sentences.');
        return data;
      })
      .then(data => { if (!controller.signal.aborted) setCatalog(data); })
      .catch(err => { if (!controller.signal.aborted) setError(err.message || 'Could not load sentences.'); });
    return () => controller.abort();
  }, [attempt]);
  const reload = useCallback(() => setAttempt(value => value + 1), []);
  const updateAudio = useCallback((sentenceId, audioUrl) => setCatalog(previous => previous && ({
    ...previous, sentences: previous.sentences.map(sentence => sentence.id === sentenceId ? { ...sentence, audioUrl } : sentence),
  })), []);
  return { catalog, error, reload, updateAudio };
}
