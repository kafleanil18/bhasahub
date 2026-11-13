import { Link } from 'react-router-dom';
import './PrivacyPages.css';

export default function PrivacyLinks() {
  return <nav className="privacy-links" aria-label="Privacy information">
    <Link to="/privacy">Privacy Policy</Link>
    <Link to="/cookies">Cookies & browser storage</Link>
  </nav>;
}
