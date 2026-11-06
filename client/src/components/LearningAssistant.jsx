import { useEffect, useRef, useState } from 'react';
import './LearningAssistant.css';

const suggestions = ['How do I start HSK 1?', 'Explain 你好 and 您好', 'Where can I practice listening?'];

export default function LearningAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, sending]);
  useEffect(() => {
    const onKeyDown = event => { if (event.key === 'Escape') setOpen(false); };
    if (open) window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const sendMessage = async (rawText = input) => {
    const content = rawText.trim();
    if (!content || sending) return;
    const nextMessages = [...messages, { role: 'user', content }];
    setMessages(nextMessages); setInput(''); setError(''); setSending(true);
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        body: JSON.stringify({ messages: nextMessages.slice(-8) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not send your question.');
      setMessages(current => [...current, { role: 'assistant', content: data.answer }]);
    } catch (requestError) {
      setError(requestError.message || 'The assistant is unavailable. Please try again.');
    } finally { setSending(false); }
  };

  return <div className="learning-assistant">
    {open && <section className="learning-assistant-panel" role="dialog" aria-label="BhashaHub learning assistant" aria-modal="false">
      <header className="learning-assistant-header"><div className="learning-assistant-avatar" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M4 5.75A2.75 2.75 0 0 1 6.75 3h10.5A2.75 2.75 0 0 1 20 5.75v7.5A2.75 2.75 0 0 1 17.25 16H10l-5 4v-4.4A2.74 2.74 0 0 1 4 13.25z"/><path d="M8 8h8M8 11.5h5"/></svg></div><div><strong>Learning assistant</strong><span>Ask about lessons and practice</span></div><button type="button" onClick={() => setOpen(false)} aria-label="Close learning assistant">×</button></header>
      <div className="learning-assistant-messages" ref={listRef} aria-live="polite" aria-relevant="additions text">
        <div className="learning-assistant-message assistant-message"><span className="assistant-message-label">BHASAHUB ASSISTANT</span><p>Hi! I can help you find your way around the lessons or explain beginner Mandarin. What are you working on?</p></div>
        {messages.map((message, index) => <div className={`learning-assistant-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`} key={`${index}-${message.role}`}><p>{message.content}</p></div>)}
        {sending && <div className="learning-assistant-message assistant-message" role="status"><span className="assistant-typing"><i/> <i/> <i/></span><span className="visually-hidden">Assistant is replying</span></div>}
      </div>
      {messages.length === 0 && <div className="learning-assistant-suggestions" aria-label="Suggested questions">{suggestions.map(question => <button type="button" key={question} onClick={() => sendMessage(question)} disabled={sending}>{question}</button>)}</div>}
      {error && <p className="learning-assistant-error" role="alert">{error}</p>}
      <form className="learning-assistant-form" onSubmit={event => { event.preventDefault(); sendMessage(); }}><label className="visually-hidden" htmlFor="learning-assistant-input">Your question</label><input id="learning-assistant-input" ref={inputRef} value={input} onChange={event => setInput(event.target.value)} placeholder="Ask a question…" maxLength={1000} disabled={sending}/><button type="submit" disabled={!input.trim() || sending} aria-label="Send question">↑</button></form>
      <p className="learning-assistant-disclaimer">Answers may be imperfect. Check important course details with your teacher.</p>
    </section>}
    <button className={`learning-assistant-launcher${open ? ' is-open' : ''}`} type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label={open ? 'Close learning assistant' : 'Open learning assistant'}><span aria-hidden="true">{open ? '×' : <svg viewBox="0 0 24 24" fill="none"><path d="M4 5.75A2.75 2.75 0 0 1 6.75 3h10.5A2.75 2.75 0 0 1 20 5.75v7.5A2.75 2.75 0 0 1 17.25 16H10l-5 4v-4.4A2.74 2.74 0 0 1 4 13.25z"/><path d="M8 8h8M8 11.5h5"/></svg>}</span>{!open && <span>Ask for help</span>}</button>
  </div>;
}
