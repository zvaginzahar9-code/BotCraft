import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { setReady } from '../lib/sceneStore.js';
import './preloader.css';

/**
 * Pure black loading veil. Tracks the drei loading manager; once assets are in
 * it flags the scene ready (which lets useStory start the logo intro) and fades
 * away. Robust against StrictMode double-invoke and never hangs the site.
 */
export default function Preloader() {
  const { progress, active } = useProgress();
  const [armed, setArmed] = useState(false);
  const [gone, setGone] = useState(false);

  // Detect "loaded enough" (kept in state so it survives StrictMode remounts).
  useEffect(() => {
    if (progress >= 99 || (!active && progress > 5)) setArmed(true);
  }, [progress, active]);

  // Fade once armed. Re-schedules on StrictMode remount because `armed` persists.
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => {
      setReady(true);
      setGone(true);
    }, 350);
    return () => clearTimeout(t);
  }, [armed]);

  // Hard fallback — never let a stuck loader hang the whole experience.
  useEffect(() => {
    const t = setTimeout(() => {
      setReady(true);
      setGone(true);
    }, 7000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`preloader${gone ? ' preloader--gone' : ''}`} aria-hidden={gone}>
      <div className="preloader__bar">
        <span style={{ transform: `scaleX(${Math.min(progress, 100) / 100})` }} />
      </div>
    </div>
  );
}
