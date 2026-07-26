import './styles/index.css';
import App from './App.jsx';

/**
 * Desktop version entry. Kept as a dedicated module (rather than folding into
 * the shell) so the global stylesheet and the entire Three.js / R3F app land in
 * this lazily-imported chunk — never fetched on phones.
 */
export default function DesktopApp() {
  return <App />;
}
