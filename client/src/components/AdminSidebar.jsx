export default function AdminSidebar({ activeView, setShowConversationManager, setShowSentenceAudioManager, adminSidebarOpen, goHome, isSuperAdmin, pendingAccessRequestsCount, pendingTestimonialsCount, setAdminSidebarOpen, setPinyinBackToAdmin, setShowAdmin, setShowAuditLog, setShowHanziTrace, setShowInbox, setShowPinyinPage, setShowSubscriptions, setShowTestManager, setShowTestimonialManager, setShowUserManager, setShowUserMenu, unreadFeedbackCount, user }) {
  return (
    <aside
            id="super-admin-navigation"
            className={`admin-sidebar ${adminSidebarOpen ? 'is-open' : ''}`}
            aria-label="Super admin navigation"
            aria-hidden={!adminSidebarOpen}
          >
            <div className="admin-sidebar-head">
              <div>
                <h2>Super Admin</h2>
              </div>
              <button className="admin-sidebar-close" onClick={() => setAdminSidebarOpen(false)} aria-label="Close admin navigation">×</button>
            </div>

            {/* Profile info block */}
            <div className="admin-sidebar-profile">
              <div className="admin-profile-avatar">
                SA
              </div>
              <div className="admin-profile-details">
                <span className="admin-profile-name">{user ? user.name : 'Administrator'}</span>
                <span className="admin-profile-status">
                  <span className="status-dot-blink"></span>
                  Active Session
                </span>
              </div>
            </div>

            <nav className="admin-sidebar-nav">
              <div className="admin-sidebar-group admin-sidebar-group--overview">
                <p className="admin-sidebar-group-title">Overview</p>
              <button className={activeView === 'dashboard' ? 'is-current' : undefined} aria-current={activeView === 'dashboard' ? 'page' : undefined} onClick={() => { goHome(); setShowUserMenu(false); setAdminSidebarOpen(false); }}>
                <svg className="nav-svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="9"></rect>
                  <rect x="14" y="3" width="7" height="5"></rect>
                  <rect x="14" y="12" width="7" height="9"></rect>
                  <rect x="3" y="16" width="7" height="5"></rect>
                </svg>
                Dashboard
              </button>
              <button className={activeView === 'audit' ? 'is-current' : undefined} aria-current={activeView === 'audit' ? 'page' : undefined} onClick={() => { goHome(); setShowAuditLog(true); setShowUserMenu(false); setAdminSidebarOpen(false); }}>
                <svg className="nav-svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Activity & sign-ins
              </button>
              </div>
              <div className="admin-sidebar-group admin-sidebar-group--learning">
                <p className="admin-sidebar-group-title">Learning content</p>
              <button className={activeView === 'courses' ? 'is-current' : undefined} aria-current={activeView === 'courses' ? 'page' : undefined} onClick={() => { goHome(); setShowAdmin(true); setShowUserMenu(false); setAdminSidebarOpen(false); }}>
                <svg className="nav-svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
                </svg>
                Manage courses
              </button>
              {isSuperAdmin && <button className={activeView === 'conversations' ? 'is-current' : undefined} aria-current={activeView === 'conversations' ? 'page' : undefined} onClick={() => { goHome(); setShowConversationManager(true); setShowUserMenu(false); setAdminSidebarOpen(false); }}>
                <span className="nav-svg-icon" aria-hidden="true">对</span>
                Conversation lessons
              </button>}
              <button className={activeView === 'tests' ? 'is-current' : undefined} aria-current={activeView === 'tests' ? 'page' : undefined} onClick={() => { goHome(); setShowTestManager(true); setShowUserMenu(false); setAdminSidebarOpen(false); }}>
                <svg className="nav-svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
                Manage tests
              </button>
              {isSuperAdmin && (
                <button className={activeView === 'trace' ? 'is-current' : undefined} aria-current={activeView === 'trace' ? 'page' : undefined} onClick={() => { goHome(); setShowHanziTrace(true); setShowUserMenu(false); setAdminSidebarOpen(false); }}>
                  <svg className="nav-svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                  </svg>
                  Trace characters
                </button>
              )}
              <button className={activeView === 'pinyin' ? 'is-current' : undefined} aria-current={activeView === 'pinyin' ? 'page' : undefined} onClick={() => { goHome(); setShowPinyinPage(true); setPinyinBackToAdmin(true); setShowUserMenu(false); setAdminSidebarOpen(false); }}>
                <svg className="nav-svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
                Pinyin voice studio
              </button>
              {isSuperAdmin && <button className={activeView === 'sentence-audio' ? 'is-current' : undefined} aria-current={activeView === 'sentence-audio' ? 'page' : undefined} onClick={() => { goHome(); setShowSentenceAudioManager(true); setShowUserMenu(false); setAdminSidebarOpen(false); }}>
                <span className="nav-svg-icon" aria-hidden="true">句</span>
                Sentence audio
              </button>}
              </div>
              <div className="admin-sidebar-group admin-sidebar-group--community">
                <p className="admin-sidebar-group-title">Community</p>
              <button className={activeView === 'testimonials' ? 'is-current' : undefined} aria-current={activeView === 'testimonials' ? 'page' : undefined} onClick={() => { goHome(); setShowTestimonialManager(true); setShowUserMenu(false); setAdminSidebarOpen(false); }}>
                <svg className="nav-svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Testimonials
                {pendingTestimonialsCount > 0 && (
                  <span className="sidebar-badge">{pendingTestimonialsCount}</span>
                )}
              </button>
              <button className={activeView === 'inbox' ? 'is-current' : undefined} aria-current={activeView === 'inbox' ? 'page' : undefined} onClick={() => { setShowInbox(true); setShowUserMenu(false); setAdminSidebarOpen(false); }}>
                <svg className="nav-svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
                  <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
                </svg>
                Feedback inbox
                {unreadFeedbackCount > 0 && (
                  <span className="sidebar-badge">{unreadFeedbackCount}</span>
                )}
              </button>
              </div>
              <div className="admin-sidebar-group admin-sidebar-group--access">
                <p className="admin-sidebar-group-title">People & access</p>
              <button className={activeView === 'admins' ? 'is-current' : undefined} aria-current={activeView === 'admins' ? 'page' : undefined} onClick={() => { goHome(); setShowUserManager(true); setShowUserMenu(false); setAdminSidebarOpen(false); }}>
                <svg className="nav-svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                Manage admins
              </button>
              <button className={activeView === 'subscriptions' ? 'is-current' : undefined} aria-current={activeView === 'subscriptions' ? 'page' : undefined} onClick={() => { goHome(); setShowSubscriptions(true); setShowUserMenu(false); setAdminSidebarOpen(false); }}>
                <svg className="nav-svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
                Subscriptions
                {pendingAccessRequestsCount > 0 && (
                  <span className="sidebar-badge">{pendingAccessRequestsCount}</span>
                )}
              </button>
              </div>
            </nav>


          </aside>
  );
}
