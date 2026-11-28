import { useEffect, useMemo, useState } from 'react';
import { ABOUT_PAGES, aboutFields, aboutText, fetchAboutPage } from '../about/aboutContent';
import { AboutXiaoAoView } from '../about/AboutXiaoAo';
import { useTeam } from '../about/useTeam';
import { AboutHskView } from '../hsk/AboutHsk';
import { useInitialLoad } from '../navigation/pageLoad';
import './AboutPagesManager.css';
import { apiFetch } from '../lib/apiClient';

// Admin > About pages (super admin): edit the text of About Xiao Ao and About HSK with a live
// preview, and choose whether visitors can see About Xiao Ao. The server stores only the fields that
// differ from the defaults in about/aboutContent.js.
const slugs = Object.keys(ABOUT_PAGES);

async function savePage(slug, body) {
  const response = await apiFetch(`${window.API_BASE_URL}/api/about-pages/${slug}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Could not save. Please try again.');
  return data;
}

export default function AboutPagesManager() {
  const [slug, setSlug] = useState('xiao-ao');
  const [pages, setPages] = useState({});
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState('');
  const team = useTeam();
  const loading = slugs.some(key => !pages[key]) && !error;
  useInitialLoad(loading, 'Loading the About pages…');

  useEffect(() => {
    let active = true;
    Promise.all(slugs.map(fetchAboutPage))
      .then(results => {
        if (!active) return;
        const loaded = Object.fromEntries(results.map((page, index) => [slugs[index], { visible: page.visible !== false, content: page.content || {} }]));
        setPages(loaded);
        setDrafts(Object.fromEntries(slugs.map(key => [key, aboutText(key, loaded[key].content)])));
      })
      .catch(() => { if (active) setError('Could not load the About pages. Check your connection and refresh.'); });
    return () => { active = false; };
  }, []);

  const page = ABOUT_PAGES[slug];
  const saved = pages[slug];
  const draft = drafts[slug];
  const savedText = useMemo(() => saved ? aboutText(slug, saved.content) : null, [slug, saved]);
  const changed = key => draft && savedText && draft[key] !== savedText[key];
  const dirty = !!draft && aboutFields(slug).some(([key]) => changed(key));
  const dirtySlugs = slugs.filter(key => drafts[key] && pages[key] && aboutFields(key).some(([field]) => drafts[key][field] !== aboutText(key, pages[key].content)[field]));

  useEffect(() => {
    if (!dirtySlugs.length) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirtySlugs.length]);

  const setField = (key, value) => { setStatus(''); setDrafts(previous => ({ ...previous, [slug]: { ...previous[slug], [key]: value } })); };

  const save = async event => {
    event.preventDefault();
    if (!dirty || busy) return;
    const defaults = aboutText(slug);
    const content = Object.fromEntries(aboutFields(slug).map(([key]) => [key, draft[key].trim()]).filter(([key, value]) => value && value !== defaults[key]));
    setBusy('save'); setError(''); setStatus('');
    try {
      const result = await savePage(slug, { content });
      setPages(previous => ({ ...previous, [slug]: { ...previous[slug], content: result.content || {} } }));
      setDrafts(previous => ({ ...previous, [slug]: aboutText(slug, result.content || {}) }));
      setStatus(`${page.label} saved. Visitors see the new text now.`);
    } catch (err) { setError(err.message); }
    finally { setBusy(''); }
  };

  const discard = () => { setStatus(''); setDrafts(previous => ({ ...previous, [slug]: aboutText(slug, saved.content) })); };
  const resetToDefaults = () => {
    if (!window.confirm(`Put every field on ${page.label} back to its default text? Nothing changes for visitors until you save.`)) return;
    setStatus('');
    setDrafts(previous => ({ ...previous, [slug]: aboutText(slug) }));
  };

  const toggleVisible = async () => {
    if (busy) return;
    const visible = !saved.visible;
    setBusy('visible'); setError(''); setStatus('');
    try {
      const result = await savePage(slug, { visible });
      setPages(previous => ({ ...previous, [slug]: { ...previous[slug], visible: result.visible } }));
      window.dispatchEvent(new Event('about-pages-changed'));
      setStatus(result.visible ? `${page.label} is now visible to everyone, with links in the footer and mobile menu.` : `${page.label} is hidden. Visitors see “Page not found” and the links are gone.`);
    } catch (err) { setError(err.message); }
    finally { setBusy(''); }
  };

  const chooseTab = next => {
    if (next === slug) return;
    setStatus('');
    setSlug(next);
  };

  return <section className="about-admin" aria-labelledby="about-admin-title">
    <header className="about-admin-header">
      <p className="about-admin-eyebrow">Website</p>
      <h1 id="about-admin-title">About pages</h1>
      <p>Edit the text on About Xiao Ao and About HSK, and check it in the preview before you save. Team members come from Teachers, and the level table, exam details and questions stay as they are.</p>
    </header>

    <div className="about-admin-tabs" role="tablist" aria-label="Page">
      {slugs.map(key => <button key={key} type="button" role="tab" id={`about-tab-${key}`} aria-selected={key === slug} aria-controls="about-admin-panel" onClick={() => chooseTab(key)}>
        {ABOUT_PAGES[key].label}{dirtySlugs.includes(key) && <span className="about-admin-unsaved" title="Unsaved changes"> (unsaved)</span>}
      </button>)}
    </div>

    {error && <p className="about-admin-message is-error" role="alert">{error}</p>}
    {status && <p className="about-admin-message is-success" role="status">{status}</p>}

    {saved && draft && <div id="about-admin-panel" role="tabpanel" aria-labelledby={`about-tab-${slug}`} className="about-admin-panel">
      <div className="about-admin-bar">
        {page.hideable ? <div className="about-admin-visibility">
          <label>
            <input type="checkbox" role="switch" checked={saved.visible} onChange={toggleVisible} disabled={!!busy} />
            <span>Show {page.label} to visitors</span>
          </label>
          <p>{saved.visible ? 'Visible to everyone. It’s linked in the footer and the mobile menu.' : 'Hidden. Visitors get “Page not found”, there are no links to it, and only super admins can open it.'}</p>
        </div> : <p className="about-admin-always">{page.label} is always visible to everyone.</p>}
        <a className="about-admin-open" href={page.path} target="_blank" rel="noopener noreferrer">Open the page in a new tab</a>
      </div>

      <div className="about-admin-workspace">
        <form className="about-admin-form" onSubmit={save} aria-label={`${page.label} text`}>
          {page.groups.map(([title, fields]) => <fieldset key={title}>
            <legend>{title}</legend>
            {fields.map(([key, label, fallback, multiline]) => {
              const id = `about-field-${slug}-${key}`;
              const isDefault = draft[key].trim() === fallback;
              return <div key={key} className={`about-admin-field${changed(key) ? ' is-changed' : ''}`}>
                <div className="about-admin-label">
                  <label htmlFor={id}>{label}</label>
                  {changed(key) ? <span className="about-admin-tag">Changed</span> : !isDefault && <span className="about-admin-tag is-custom">Custom</span>}
                  {!isDefault && <button type="button" className="about-admin-default" onClick={() => setField(key, fallback)}>Use default</button>}
                </div>
                {multiline
                  ? <textarea id={id} rows={3} value={draft[key]} maxLength={3000} onChange={event => setField(key, event.target.value)} />
                  : <input id={id} type="text" value={draft[key]} maxLength={300} onChange={event => setField(key, event.target.value)} />}
              </div>;
            })}
          </fieldset>)}
          <div className="about-admin-actions">
            <button type="submit" className="about-admin-save" disabled={!dirty || !!busy}>{busy === 'save' ? 'Saving…' : 'Save changes'}</button>
            <button type="button" onClick={discard} disabled={!dirty || !!busy}>Discard changes</button>
            <button type="button" className="about-admin-reset" onClick={resetToDefaults} disabled={!!busy}>Use all default text</button>
            {dirty && <span className="about-admin-hint">Unsaved changes</span>}
          </div>
        </form>

        <div className="about-admin-preview">
          <p className="about-admin-preview-label" id="about-preview-label">Preview{dirty ? ', with your unsaved changes' : ''}</p>
          {/* inert: the preview looks like the page but can't be clicked or tabbed into. */}
          <div className="about-admin-preview-frame" inert aria-labelledby="about-preview-label">
            {slug === 'xiao-ao' ? <AboutXiaoAoView text={draft} team={team} /> : <AboutHskView text={draft} />}
          </div>
        </div>
      </div>
    </div>}
  </section>;
}
