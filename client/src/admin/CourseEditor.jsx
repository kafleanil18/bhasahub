import { mediaUrl } from '../utils/mediaUrl';
import ControlIcon from './ControlIcon';

export default function CourseEditor({ draft, setDraft, editingId, titleRef, saving, uploading, onUpload, onSave, onCancel, locked }) {
  const change = (field, value) => setDraft(current => ({ ...current, [field]: value }));
  return <form className="studio-editor" onSubmit={onSave} aria-labelledby="studio-editor-title">
    <div className="studio-section-title"><span className="studio-icon"><ControlIcon name="courses"/></span><div><p className="studio-eyebrow">{editingId ? 'Update your content' : 'Build something new'}</p><h2 id="studio-editor-title">{editingId ? 'Edit course' : 'Create a course'}</h2></div></div>
    <p className="studio-hint">Start with the basics. You can add lessons after saving.</p>
    <fieldset disabled={locked}>
      <div className="studio-field"><label htmlFor="studio-title">Course title <span>(required)</span></label><input ref={titleRef} id="studio-title" required value={draft.title} onChange={e => change('title', e.target.value)} placeholder="e.g. HSK 1: Chinese for beginners"/></div>
      <div className="studio-field-pair"><div className="studio-field"><label htmlFor="studio-language">Language</label><select id="studio-language" value={draft.language} onChange={e => change('language', e.target.value)}><option value="chinese">Chinese</option></select></div><div className="studio-field"><label htmlFor="studio-level">Level</label><input id="studio-level" value={draft.level} onChange={e => change('level', e.target.value)} placeholder="e.g. HSK 1"/></div></div>
      <div className="studio-field"><label htmlFor="studio-description">Description</label><textarea id="studio-description" rows="3" value={draft.description} onChange={e => change('description', e.target.value)} placeholder="What will students learn in this course?"/></div>
      <div className="studio-field"><label htmlFor="studio-glyph">Course symbol <span>(optional)</span></label><input id="studio-glyph" value={draft.glyph} onChange={e => change('glyph', e.target.value)} placeholder="e.g. 你好" aria-describedby="studio-glyph-help"/><small id="studio-glyph-help">One or two characters to represent your course.</small></div>
      <div className="studio-field"><label htmlFor="studio-cover">Cover image <span>(optional)</span></label><div className="studio-upload"><ControlIcon name="image"/><div><strong>{uploading ? 'Uploading cover…' : imageLabel(draft.image)}</strong><small>Choose an image for the course card.</small></div><input id="studio-cover" type="file" accept="image/*" disabled={locked || uploading} onChange={e => { onUpload(e.target.files[0]); e.target.value = ''; }}/></div></div>
      {draft.image && <div className="studio-cover-preview"><img src={mediaUrl(draft.image)} alt="Course cover preview"/><button type="button" className="studio-button" onClick={() => change('image', '')}>Remove image</button></div>}
      <label className="studio-publish-option"><input type="checkbox" checked={draft.published} onChange={e => change('published', e.target.checked)}/><span><strong>Publish this course</strong><small>{draft.published ? 'Visible in the student course catalog after saving.' : 'Keep as a draft while you prepare your lessons.'}</small></span></label>
    </fieldset>
    <div className="studio-editor-actions"><button className="studio-button studio-button-primary" type="submit" disabled={locked || uploading}>{saving ? 'Saving…' : editingId ? 'Save changes' : draft.published ? 'Create & publish course' : 'Create draft course'}</button><button className="studio-button" type="button" onClick={onCancel} disabled={locked || uploading}>{editingId ? 'Cancel edit' : 'Clear form'}</button></div>
  </form>;
}

function imageLabel(image) { return image ? 'Replace cover image' : 'Upload a cover image'; }
