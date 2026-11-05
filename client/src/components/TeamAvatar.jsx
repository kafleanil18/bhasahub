export default function renderTeamAvatar (member, isModal = false) {
  // If custom photo is uploaded and is not placeholder, render it
  if (member.photo && member.photo !== '/image.jpg' && member.photo !== 'image.jpg') {
    const frameSize = isModal ? '130px' : '120px';
    return (
      <div
        className={isModal ? 'team-modal-photo-svg-wrapper' : 'team-photo-svg-wrapper'}
        style={{ borderRadius: '12px', width: frameSize, height: frameSize, overflow: 'hidden', background: 'var(--paper, #faf6ec)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <img
          src={member.photo}
          alt={member.name}
          className={isModal ? 'team-modal-photo' : 'team-photo'}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '12px',
            objectFit: 'contain',
            transform: `translate(${(member.offsetX !== undefined ? member.offsetX : 50) - 50}%, ${(member.offsetY !== undefined ? member.offsetY : 50) - 50}%) scale(${member.scale !== undefined ? member.scale : 1})`,
            transformOrigin: 'center center'
          }}
        />
      </div>
    );
  }

  // Otherwise, render dynamic role-based SVG
  const isTeacher = member.role.toLowerCase().includes('teacher') || member.role.toLowerCase().includes('founder');
  const isDev = member.role.toLowerCase().includes('developer') || member.role.toLowerCase().includes('engineer');

  const gradientId = member.name.replace(/\s+/g, '-').toLowerCase() + (isModal ? '-modal' : '') + '-grad';
  let startColor = '#c99a3c';
  let endColor = '#a92316';
  let iconContent = null;

  if (isTeacher) {
    startColor = '#c99a3c'; // gold
    endColor = '#a92316';   // red stamp
    iconContent = (
      <>
        {/* Books & glasses */}
        <rect x="60" y="80" width="80" height="60" rx="4" fill="rgba(255,255,255,0.15)" stroke="#fff" strokeWidth="3"/>
        <line x1="75" y1="98" x2="125" y2="98" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="75" y1="112" x2="115" y2="112" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
        {/* Glasses */}
        <circle cx="85" cy="55" r="12" stroke="#fff" strokeWidth="3" fill="none"/>
        <circle cx="115" cy="55" r="12" stroke="#fff" strokeWidth="3" fill="none"/>
        <line x1="97" y1="55" x2="103" y2="55" stroke="#fff" strokeWidth="3"/>
        <line x1="73" y1="55" x2="65" y2="51" stroke="#fff" strokeWidth="3"/>
        <line x1="127" y1="55" x2="135" y2="51" stroke="#fff" strokeWidth="3"/>
      </>
    );
  } else if (isDev) {
    startColor = '#2e6b57'; // jade green
    endColor = '#1a4f3e';
    iconContent = (
      <>
        {/* Code braces </ > */}
        <rect x="50" y="70" width="100" height="60" rx="8" fill="rgba(255,255,255,0.15)" stroke="#fff" strokeWidth="3"/>
        <path d="M70 90l-10 10 10 10M130 90l10 10-10 10M105 85l-10 30" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </>
    );
  } else {
    // Project Manager / generic admin
    startColor = '#3a506b'; // deep steel blue
    endColor = '#1c2541';
    iconContent = (
      <>
        {/* Checklist and target star */}
        <rect x="55" y="70" width="90" height="65" rx="6" fill="rgba(255,255,255,0.15)" stroke="#fff" strokeWidth="3"/>
        <path d="M70 92l6 6 14-14" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="98" y1="88" x2="130" y2="88" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
        <line x1="70" y1="112" x2="130" y2="112" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
      </>
    );
  }

  return (
    <div className={isModal ? 'team-modal-photo-svg-wrapper' : 'team-photo-svg-wrapper'}>
      <svg width="100%" height="100%" viewBox="0 0 200 200" className={isModal ? 'team-modal-photo-svg' : 'team-photo-svg'}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="94" fill={`url(#${gradientId})`} stroke="var(--line)" strokeWidth="3"/>
        <circle cx="100" cy="100" r="82" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" strokeDasharray="8 12"/>
        {iconContent}
      </svg>
    </div>
  );
}
