import { Link } from 'react-router-dom';

export default function NotFound() {
  return <section className="container"><h1>Page not found</h1><p>The address may have changed.</p><Link to="/">Back to home</Link></section>;
}
