import { mediaUrl } from '../utils/mediaUrl';
import renderTeamAvatar from '../components/TeamAvatar';

export default function HomeTeam({ setActiveTeamMember, teamPhotos }) {
  return (
    <section className="team-section">
            <div className="container">
              <h2 className="section-title team-title">Meet Our Team</h2>
              <p className="team-intro">This platform is brought to you by a team of passion and expertise.</p>
              <div className="team-grid">
                {(Array.isArray(teamPhotos) ? teamPhotos : []).map((dbMemberObj) => {
                  const displayMember = {
                    key: dbMemberObj.key,
                    name: dbMemberObj.name || '',
                    role: dbMemberObj.role || '',
                    bio: dbMemberObj.bio || '',
                    photo: dbMemberObj.photo ? mediaUrl(dbMemberObj.photo) : '',
                    offsetX: dbMemberObj.offsetX !== undefined ? dbMemberObj.offsetX : 50,
                    offsetY: dbMemberObj.offsetY !== undefined ? dbMemberObj.offsetY : 50,
                    scale: dbMemberObj.scale !== undefined ? dbMemberObj.scale : 1
                  };
                  return (
                    <div className="team-card" key={displayMember.key} onClick={() => setActiveTeamMember(displayMember)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTeamMember(displayMember); } }} title="Click to view full bio">
                      {renderTeamAvatar(displayMember)}
                      <h3 className="team-name">{displayMember.name}</h3>
                      <p className="team-role">{displayMember.role}</p>
                      <span className="team-bio-hint">View Bio ➔</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
  );
}
