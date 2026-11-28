import { useState } from 'react';
import AccessDialog from '../admin/subscriptions/AccessDialog';
import { localDate } from './recordingMedia';

export default function RecordingForm({ session, initialDate, students, busy, error, onSave, onClose }) {
  const [form, setForm] = useState(() => ({ title: session?.title || '', sessionDate: session?.sessionDate || initialDate || localDate(), videoUrl: session?.videoUrl || '', description: session?.description || '', allowedStudents: (session?.allowedStudents || []).filter(id => students.some(student => student._id === id)) }));
  const [query, setQuery] = useState('');
  const update = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  const visible = students.filter(student => `${student.name} ${student.email}`.toLowerCase().includes(query.trim().toLowerCase()));
  const toggle = id => update('allowedStudents', form.allowedStudents.includes(id) ? form.allowedStudents.filter(value => value !== id) : [...form.allowedStudents, id]);
  return <AccessDialog title={session ? 'Edit recorded session' : 'Add recorded session'} description="Choose the class date and the students who can watch." busy={busy} onClose={onClose}>
    <form className="recording-form" onSubmit={event => { event.preventDefault(); onSave(form); }}>
      <fieldset disabled={busy} className="recording-form-fields">
        <label>Session title<input required maxLength={160} value={form.title} onChange={event => update('title', event.target.value)} placeholder="e.g. Greetings & People" /></label>
        <label>Session date<input required type="date" value={form.sessionDate} onChange={event => update('sessionDate', event.target.value)} /></label>
        <label>Video link<input required type="url" maxLength={2048} value={form.videoUrl} onChange={event => update('videoUrl', event.target.value)} placeholder="https://…" aria-describedby="recording-link-help" /></label>
        <p id="recording-link-help" className="recording-help">YouTube, Vimeo, Google Drive, or a direct video link. These permissions control access in BhasaHub; also set the video provider’s sharing permissions if the video must stay private.</p>
        <label>Description <span className="recording-optional">(optional)</span><textarea rows={3} maxLength={3000} value={form.description} onChange={event => update('description', event.target.value)} /></label>
        <fieldset className="recording-students"><legend>Who can watch?</legend>
          <p className="recording-help">Only the selected students. Leave everyone unchecked to keep this recording private.</p>
          <label>Search students<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Name or email" /></label>
          <div className="recording-selection-actions"><button type="button" className="access-link" onClick={() => update('allowedStudents', students.map(student => student._id))}>Select all current students</button><button type="button" className="access-link" onClick={() => update('allowedStudents', [])}>Clear selection</button></div>
          <p role="status">{form.allowedStudents.length} students selected</p>
          <div className="recording-student-list">{visible.map(student => <label key={student._id}><input type="checkbox" checked={form.allowedStudents.includes(student._id)} onChange={() => toggle(student._id)} /><span><strong>{student.name}</strong><small>{student.email}</small></span></label>)}{!visible.length && <p>{students.length ? 'No students match your search.' : 'No student accounts yet. You can save this recording privately.'}</p>}</div>
        </fieldset>
      </fieldset>
      {error && <p className="access-feedback is-error" role="alert">{error}</p>}
      <div className="access-dialog-actions"><button type="button" className="access-button" disabled={busy} onClick={onClose}>Cancel</button><button className="access-button is-primary" disabled={busy}>{busy ? 'Saving…' : 'Save recording'}</button></div>
    </form>
  </AccessDialog>;
}
