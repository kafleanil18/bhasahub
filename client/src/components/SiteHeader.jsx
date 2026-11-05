export default function SiteHeader({ adminSidebarOpen, darkMode, goHome, handleLogout, isAdmin, isSuperAdmin, mobileMenuOpen, myAccessDays, openLogin, pendingAccessRequestsCount, pendingTestimonialsCount, setAdminSidebarOpen, setDarkMode, setMobileMenuOpen, setShowAnalytics, setShowChangePassword, setShowDashboard, setShowFeedback, setShowSubscriptions, setShowTestManager, setShowUserMenu, showUserMenu, unreadFeedbackCount, user }) {
  return (
    <header className="site-header">
        <div className="container header-row">
          <div className="header-left">
            <button className="logo brand-logo" onClick={() => { setMobileMenuOpen(false); setShowUserMenu(false); goHome(); }}>
              <span className="brand-seal" aria-hidden="true">汉</span>
              <span className="brand-lockup"><span className="brand-title">
                Hanzi<span className="brand-accent">Go</span>
              </span><span className="brand-tagline">Chinese Made Simple</span></span>
            </button>
          </div>

          <nav id="site-navigation" aria-label="Main navigation" className={`main-nav ${mobileMenuOpen ? 'open' : ''}`}>
            <div className="nav-links">
              {isAdmin && !isSuperAdmin && <button className="nav-link" onClick={() => { setMobileMenuOpen(false); goHome(); setShowTestManager(true); }}>Manage tests</button>}
              {isSuperAdmin ? (
                <button className="nav-link" onClick={() => { setMobileMenuOpen(false); setShowUserMenu(false); goHome(); }}>
                  Dashboard
                </button>
              ) : user ? (
                <>
                  <button className="nav-link" onClick={() => { setMobileMenuOpen(false); goHome(); setShowDashboard(true); }}>
                    <svg className="nav-svg-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                      <polyline points="2 17 12 22 22 17"></polyline>
                      <polyline points="2 12 12 17 22 12"></polyline>
                    </svg>
                    <span>My Courses</span>
                  </button>

                  <button className="nav-link" onClick={() => { setMobileMenuOpen(false); goHome(); setShowAnalytics(true); }}>
                    <svg className="nav-svg-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    <span>My Progress</span>
                  </button>

                  <a className="nav-link" href="#courses" onClick={() => { setMobileMenuOpen(false); goHome(); }}>
                    <svg className="nav-svg-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H2z"></path>
                      <path d="M22 4h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H22z"></path>
                    </svg>
                    <span>All Courses</span>
                  </a>
                </>
              ) : (
                <a className="nav-link" href="#courses" onClick={() => { setMobileMenuOpen(false); goHome(); }}>
                  <svg className="nav-svg-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H2z"></path>
                    <path d="M22 4h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H22z"></path>
                  </svg>
                  <span>Courses</span>
                </a>
              )}

              <button className="nav-link" onClick={() => { setMobileMenuOpen(false); setShowFeedback(true); }}>
                <svg className="nav-svg-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                <span>Message us</span>
              </button>


            </div>

            {/* Mobile Drawer Actions (shown inside mobile drawer) */}
            <div className="mobile-drawer-actions">
              {user && user.role === 'student' && myAccessDays !== null && (
                <div className="mobile-drawer-badge">
                  <span className="access-badge" title="Time left on your course access">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {myAccessDays} {myAccessDays === 1 ? 'day' : 'days'} left
                  </span>
                </div>
              )}
              {isSuperAdmin && (
                <button
                  className="admin-nav-toggle mobile-admin-btn"
                  onClick={() => { setMobileMenuOpen(false); setShowUserMenu(false); setAdminSidebarOpen(true); }}
                >
                  <span aria-hidden="true">☰</span> Admin Dashboard
                  {(unreadFeedbackCount + pendingTestimonialsCount + pendingAccessRequestsCount) > 0 && (
                    <span className="admin-nav-badge">
                      {unreadFeedbackCount + pendingTestimonialsCount + pendingAccessRequestsCount}
                    </span>
                  )}
                </button>
              )}
              {isAdmin && !isSuperAdmin && (
                <button className="nav-link mobile-admin-btn" onClick={() => { setMobileMenuOpen(false); setShowUserMenu(false); goHome(); setShowSubscriptions(true); }}>
                  <svg className="nav-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="2" y1="10" x2="22" y2="10"></line>
                  </svg>
                  Subscriptions
                  {pendingAccessRequestsCount > 0 && (
                    <span className="sidebar-badge">{pendingAccessRequestsCount}</span>
                  )}
                </button>
              )}
              <div className="mobile-drawer-theme-row">
                <span>Dark Mode</span>
                <button
                  className="theme-toggle-compact"
                  onClick={() => setDarkMode(!darkMode)}
                  aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {darkMode ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="23" y2="12"></line>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </nav>

          <div className="header-right nav-actions">
            {user && user.role === 'student' && myAccessDays !== null && (
              <span className="access-badge nav-desktop-only" title="Time left on your course access">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>{myAccessDays} {myAccessDays === 1 ? 'day' : 'days'} left</span>
              </span>
            )}

            {isSuperAdmin && (
              <button
                className="admin-nav-toggle nav-desktop-only"
                onClick={() => { setMobileMenuOpen(false); setShowUserMenu(false); setAdminSidebarOpen(true); }}
                aria-expanded={adminSidebarOpen}
                aria-controls="super-admin-navigation"
                style={{ position: 'relative' }}
              >
                <span aria-hidden="true">☰</span> Admin
                {(unreadFeedbackCount + pendingTestimonialsCount + pendingAccessRequestsCount) > 0 && (
                  <span className="admin-nav-badge">
                    {unreadFeedbackCount + pendingTestimonialsCount + pendingAccessRequestsCount}
                  </span>
                )}
              </button>
            )}

            {isAdmin && !isSuperAdmin && (
              <button className="nav-link nav-desktop-only" onClick={() => { setMobileMenuOpen(false); setShowUserMenu(false); goHome(); setShowSubscriptions(true); }} style={{ position: 'relative' }}>
                <svg className="nav-svg-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
                <span>Subscriptions</span>
                {pendingAccessRequestsCount > 0 && (
                  <span className="sidebar-badge">{pendingAccessRequestsCount}</span>
                )}
              </button>
            )}

            <button
              className="theme-toggle-compact nav-desktop-only"
              onClick={() => setDarkMode(!darkMode)}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>

            {user ? (
              <div className="user-menu">
                <button className="user-menu-trigger" aria-label={`Account menu for ${user.name}`} onClick={() => setShowUserMenu(!showUserMenu)} aria-expanded={showUserMenu}>
                  <span className="user-menu-avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
                  <span className="user-menu-name">{user.name}</span>
                  {user.role === 'admin' && <span className="user-role-badge">admin</span>}
                  {user.role === 'superadmin' && <span className="user-role-badge super">super</span>}
                  <span className={`caret ${showUserMenu ? 'open' : ''}`}>▾</span>
                </button>
                {showUserMenu && (
                  <div className="user-menu-dropdown">
                    <div className="user-menu-header">
                      <span className="user-menu-header-name">{user.name}</span>
                      <span className="user-menu-header-role">{user.role}</span>
                    </div>
                    <div className="user-menu-divider"></div>
                    <button onClick={() => { setShowUserMenu(false); setMobileMenuOpen(false); setShowChangePassword(true); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      Change password
                    </button>
                    <button className="logout-item" onClick={() => { setShowUserMenu(false); setMobileMenuOpen(false); handleLogout(); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="nav-btn-primary" onClick={openLogin}>Sign in</button>
            )}

            <button
              className={`hamburger ${mobileMenuOpen ? 'is-open' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="site-navigation"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>
  );
}
