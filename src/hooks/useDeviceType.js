import { useState } from 'react';
import { detectDevice } from '../utils/detectDevice.js';

/**
 * Returns the version to render — `'mobile'` or `'desktop'` — decided once at
 * mount. Device class does not change during a session (a phone stays a phone),
 * so the value is stable and never triggers a re-render or a version swap.
 */
export function useDeviceType() {
  const [device] = useState(detectDevice);
  return device;
}
