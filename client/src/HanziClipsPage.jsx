import { useState, useEffect } from 'react';

const API = window.API_BASE_URL + '/api';
const SERVER = window.API_BASE_URL;

const CATEGORIES = ['All', 'Basic Strokes', 'HSK 1', 'HSK 2', 'Radicals', 'Common Hanzi'];

function HanziClipsPage({ user, onBack, token }) {
  const isSuperAdmin = user && user.role === 'superadmin';

  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal / Form state for Super Admin
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClip, setEditingClip] = useState(null);
  const [formCharacter, setFormCharacter] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formPinyin, setFormPinyin] = useState('');
  const [formMeaning, setFormMeaning] = useState('');
  const [formStrokeCount, setFormStrokeCount] = useState(4);
  const [formCategory, setFormCategory] = useState('Basic Strokes');
  const [formTips, setFormTips] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activePlaybackSpeeds, setActivePlaybackSpeeds] = useState({});

  useEffect(() => {
    fetchClips();
  }, []);

  const fetchClips = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/hanzi-clips`);
      if (res.ok) {
        const data = await res.json();
        setClips(data);
      }
    } catch (err) {
      console.error('Failed to load Hanzi clips:', err);
    } finally {
      setLoading(false);
    }
  };

  const resolveVideoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return url.startsWith('/') ? `${SERVER}${url}` : `${SERVER}/${url}`;
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?enablejsapi=1&rel=0`;
    }
    return null;
  };

  const handleOpenCreateModal = () => {
    setEditingClip(null);
    setFormCharacter('');
    setFormTitle('');
    setFormPinyin('');
    setFormMeaning('');
    setFormStrokeCount(4);
    setFormCategory('Basic Strokes');
    setFormTips('');
    setFormVideoUrl('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (clip) => {
    setEditingClip(clip);
    setFormCharacter(clip.character || '');
    setFormTitle(clip.title || '');
    setFormPinyin(clip.pinyin || '');
    setFormMeaning(clip.meaning || '');
    setFormStrokeCount(clip.strokeCount || 1);
    setFormCategory(clip.category || 'Basic Strokes');
    setFormTips(clip.tips || '');
    setFormVideoUrl(clip.videoUrl || '');
    setModalOpen(true);
  };

  const handleVideoFileUpload = async (file) => {
    if (!file) return;
    setUploadingVideo(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setFormVideoUrl(data.url);
      } else {
        alert('Video upload failed. Please make sure the video file is under 200MB.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Could not upload video.');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSaveClip = async (e) => {
    e.preventDefault();
    if (!formCharacter.trim() || !formTitle.trim() || !formVideoUrl.trim()) {
      alert('Please fill out character, title, and upload or enter a video URL.');
      return;
    }

    setSubmitting(true);
    const payload = {
      character: formCharacter.trim(),
      title: formTitle.trim(),
      pinyin: formPinyin.trim(),
      meaning: formMeaning.trim(),
      strokeCount: Number(formStrokeCount) || 1,
      category: formCategory,
      tips: formTips.trim(),
      videoUrl: formVideoUrl.trim(),
    };

    try {
      const url = editingClip ? `${API}/hanzi-clips/${editingClip._id}` : `${API}/hanzi-clips`;
      const method = editingClip ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchClips();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save video clip');
      }
    } catch (err) {
      console.error('Save clip error:', err);
      alert('Could not save video clip');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClip = async (id, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`${API}/hanzi-clips/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchClips();
      } else {
        alert('Could not delete clip');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Could not delete clip');
    }
  };

  const handlePlaybackSpeedChange = (clipId, videoElement, speed) => {
    if (videoElement) {
      videoElement.playbackRate = speed;
    }
    setActivePlaybackSpeeds((prev) => ({ ...prev, [clipId]: speed }));
  };

  const filteredClips = clips.filter((clip) => {
    const matchesCategory = selectedCategory === 'All' || clip.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      clip.character.toLowerCase().includes(q) ||
      (clip.pinyin && clip.pinyin.toLowerCase().includes(q)) ||
      (clip.meaning && clip.meaning.toLowerCase().includes(q)) ||
      clip.title.toLowerCase().includes(q) ||
      (clip.tips && clip.tips.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="hanzi-clips-page container">
      {/* Top Bar Navigation */}
      <div className="hanzi-clips-nav-header">
        <button className="nav-btn" onClick={onBack}>
          ← Back to site
        </button>
        {isSuperAdmin && (
          <button className="btn-primary" onClick={handleOpenCreateModal}>
            ➕ Upload Hanzi Clip
          </button>
        )}
      </div>

      {/* Hero Header */}
      <div className="hanzi-clips-hero">
        <p className="eyebrow">✍️ CHINESE CALLIGRAPHY & STROKE ORDER</p>
        <h1 className="hanzi-hero-title">Hanzi Writing Demonstrations</h1>
        <p className="hanzi-hero-desc">
          Watch short, step-by-step video clips demonstrating proper stroke order, balance, and writing techniques for Chinese characters.
        </p>

        {/* Search & Category Filter Controls */}
        <div className="hanzi-controls-bar">
          <div className="hanzi-search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by character (水), pinyin (shuǐ), meaning (water), or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="hanzi-search-input"
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                ✕
              </button>
            )}
          </div>

          <div className="hanzi-categories-scroll">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Video Clips Grid */}
      {loading ? (
        <div className="hanzi-loading-state">
          <span className="spinner">⏳</span>
          <p>Loading Hanzi writing demonstrations...</p>
        </div>
      ) : filteredClips.length === 0 ? (
        <div className="hanzi-empty-state">
          <span className="empty-icon">📹</span>
          <h3>No character videos found</h3>
          <p>Try clearing your search query or selecting a different category filter.</p>
        </div>
      ) : (
        <div className="hanzi-clips-grid">
          {filteredClips.map((clip) => {
            const currentSpeed = activePlaybackSpeeds[clip._id] || 1;
            const ytEmbedUrl = getYouTubeEmbedUrl(clip.videoUrl);

            return (
              <div className="hanzi-clip-card" key={clip._id}>
                {/* Character Emblem Badge */}
                <div className="hanzi-card-header">
                  <div className="hanzi-char-badge zh">{clip.character}</div>
                  <div className="hanzi-header-meta">
                    <span className="hanzi-category-pill">{clip.category || 'General'}</span>
                    <h3 className="hanzi-card-title zh">{clip.title}</h3>
                    <div className="hanzi-sub-meta">
                      {clip.pinyin && <span className="hanzi-pinyin">{clip.pinyin}</span>}
                      {clip.meaning && <span className="hanzi-meaning">"{clip.meaning}"</span>}
                      <span className="hanzi-stroke-count">✏️ {clip.strokeCount || 1} Strokes</span>
                    </div>
                  </div>
                </div>

                {/* Video Player (Supports YouTube URLs and uploaded video files) */}
                <div className="hanzi-video-wrapper">
                  {ytEmbedUrl ? (
                    <iframe
                      title={clip.title}
                      src={ytEmbedUrl}
                      className="hanzi-video-element hanzi-youtube-iframe"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <>
                      <video
                        id={`video-${clip._id}`}
                        src={resolveVideoUrl(clip.videoUrl)}
                        controls
                        loop
                        playsInline
                        preload="metadata"
                        className="hanzi-video-element"
                      />
                      {/* Playback Speed Quick Controls */}
                      <div className="video-speed-bar">
                        <span className="speed-label">Speed:</span>
                        {[0.5, 0.75, 1, 1.25].map((speed) => (
                          <button
                            key={speed}
                            className={`speed-btn ${currentSpeed === speed ? 'active' : ''}`}
                            onClick={() => {
                              const el = document.getElementById(`video-${clip._id}`);
                              handlePlaybackSpeedChange(clip._id, el, speed);
                            }}
                          >
                            {speed === 0.5 ? '🐢 0.5x Slow' : `${speed}x`}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Stroke Tips & Rules */}
                {clip.tips && (
                  <div className="hanzi-tips-box">
                    <span className="tips-icon">💡</span>
                    <div>
                      <strong>Stroke Order & Writing Tips:</strong>
                      <p>{clip.tips}</p>
                    </div>
                  </div>
                )}

                {/* Super Admin Management Controls */}
                {isSuperAdmin && (
                  <div className="hanzi-admin-actions">
                    <button className="nav-btn" onClick={() => handleOpenEditModal(clip)}>
                      ✏️ Edit Clip
                    </button>
                    <button className="nav-btn bm-remove-img-btn" onClick={() => handleDeleteClip(clip._id, clip.title)}>
                      🗑️ Delete Clip
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Super Admin Upload / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="hanzi-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="hanzi-modal-header">
              <h2>{editingClip ? '✏️ Edit Hanzi Writing Clip' : '➕ Upload Hanzi Writing Clip'}</h2>
              <button className="hanzi-modal-close" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClip} className="hanzi-modal-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label className="bm-label">Target Character (e.g. 水, 永, 好)</label>
                  <input
                    type="text"
                    className="bm-input zh"
                    placeholder="水"
                    value={formCharacter}
                    onChange={(e) => {
                      setFormCharacter(e.target.value);
                      if (!formTitle) setFormTitle(`How to write ${e.target.value}`);
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="bm-label">Pinyin (e.g. shuǐ)</label>
                  <input
                    type="text"
                    className="bm-input"
                    placeholder="shuǐ"
                    value={formPinyin}
                    onChange={(e) => setFormPinyin(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="bm-label">Title</label>
                <input
                  type="text"
                  className="bm-input"
                  placeholder="How to write 水 (Shuǐ - Water)"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label className="bm-label">Meaning (English)</label>
                  <input
                    type="text"
                    className="bm-input"
                    placeholder="Water"
                    value={formMeaning}
                    onChange={(e) => setFormMeaning(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="bm-label">Stroke Count</label>
                  <input
                    type="number"
                    min="1"
                    className="bm-input"
                    value={formStrokeCount}
                    onChange={(e) => setFormStrokeCount(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="bm-label">Category</label>
                  <select
                    className="bm-input"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    <option value="Basic Strokes">Basic Strokes</option>
                    <option value="HSK 1">HSK 1</option>
                    <option value="HSK 2">HSK 2</option>
                    <option value="Radicals">Radicals</option>
                    <option value="Common Hanzi">Common Hanzi</option>
                  </select>
                </div>
              </div>

              {/* Video Asset Upload / URL Input */}
              <div className="form-group">
                <label className="bm-label">Demonstration Video Clip (.mp4, .webm, .mov)</label>
                <div className="bm-image-dropzone">
                  <p style={{ fontSize: '0.85rem', color: 'var(--mist)', fontWeight: 600, margin: '0.25rem 0' }}>
                    Upload video file (up to 200MB) or provide a video URL
                  </p>

                  <div className="bm-file-input-wrapper" style={{ margin: '8px 0' }}>
                    <button type="button" className="bm-btn-upload-file">
                      📹 Choose Video File
                    </button>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onClick={(e) => { e.target.value = ''; }}
                      onChange={(e) => handleVideoFileUpload(e.target.files[0])}
                    />
                  </div>

                  {uploadingVideo && (
                    <p className="bm-uploading-txt">
                      <span className="spinner">⏳</span> Uploading video file...
                    </p>
                  )}

                  <div style={{ marginTop: '12px', textAlign: 'left' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--ink-light)', fontWeight: 600 }}>Or Direct Video URL:</label>
                    <input
                      type="text"
                      className="bm-input"
                      placeholder="https://... or /uploads/video.mp4"
                      value={formVideoUrl}
                      onChange={(e) => setFormVideoUrl(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="bm-label">Writing Tips & Stroke Rules</label>
                <textarea
                  className="bm-input"
                  rows="3"
                  placeholder="Explain stroke order rules (e.g. Center vertical line first, then left sweep...)"
                  value={formTips}
                  onChange={(e) => setFormTips(e.target.value)}
                />
              </div>

              <div className="bm-actions" style={{ marginTop: '20px' }}>
                <button type="submit" className="btn-primary" disabled={submitting || uploadingVideo}>
                  {submitting ? 'Saving...' : editingClip ? 'Save Changes' : 'Publish Video Clip'}
                </button>
                <button type="button" className="nav-btn" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HanziClipsPage;
