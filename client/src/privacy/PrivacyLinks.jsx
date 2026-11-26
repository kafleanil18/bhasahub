import { Link } from 'react-router-dom';
import './PrivacyPages.css';

export default function PrivacyLinks() {
  return <nav className="privacy-links" aria-label="Policies">
    <Link to="/privacy">Privacy Policy</Link>
    <Link to="/cookies">Cookies & browser storage</Link>
    <Link to="/terms">Terms of Service</Link>
  </nav>;
}
