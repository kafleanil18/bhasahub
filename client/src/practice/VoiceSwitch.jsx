import './VoiceSwitch.css';
import Icon from '../components/Icon';

// Female / male voice picker shared by the practice tools. The choice is remembered across tools.
export default function VoiceSwitch({ speaker, className = '', label = 'Voice' }) {
  return <div className={`voice-switch ${className}`}>
    <div className="voice-switch-row"><span className="voice-switch-label" aria-hidden="true">{label}</span>
    <div className="voice-switch-buttons" role="group" aria-label={label}>
      {[['female', 'Female voice'], ['male', 'Male voice']].map(([value, text]) => <button key={value} type="button" aria-pressed={speaker.gender === value} onClick={() => speaker.setGender(value)}>
        <Icon name={value}/> {text}
      </button>)}
    </div></div>
    {speaker.maleUnavailable && <p className="voice-switch-note" role="status">A male Mandarin voice isn’t available yet, so you’ll hear the female voice.</p>}
  </div>;
}
