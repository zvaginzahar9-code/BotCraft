import { Suspense, lazy } from 'react';
import { detectDevice } from './utils/detectDevice.js';

// Both versions are code-split. `React.lazy` only fires its dynamic import when
// the component is actually rendered, so exactly one bundle is ever downloaded:
//   - phones  -> mobile wrapper only (desktop + 3D assets never fetched)
//   - others  -> desktop app only (mobile bundle never fetched)
const DesktopApp = lazy(() => import('./desktop/DesktopApp.jsx'));
const MobileApp = lazy(() => import('./mobile/MobileApp.jsx'));

// Decided once, before anything renders.
const device = detectDevice();

export default function AppRoot() {
  const Version = device === 'mobile' ? MobileApp : DesktopApp;
  return (
    <Suspense fallback={null}>
      <Version />
    </Suspense>
  );
}
