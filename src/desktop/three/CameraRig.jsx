import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { progress, pointer } from '../lib/sceneStore.js';
import { clamp, damp, smoothstep } from '../lib/math.js';

/**
 * Cinematic, scroll-driven camera. Slow eased dolly-ins, a gentle orbit through
 * the device acts, plus subtle pointer parallax — all damped so nothing starts
 * or stops abruptly. The devices carry their screens in world space, so these
 * moves never detach a display.
 */
// Reusable scratch vector — avoids allocating one per render.
const target = new THREE.Vector3();

export default function CameraRig({ isMobile = false }) {
  useFrame((state, dt) => {
    const cam = state.camera;
    const baseZ = isMobile ? 50 : 46;

    let tx = pointer.x * 1.3;
    let ty = pointer.y * 0.9 + 0.4;
    let tz = baseZ;
    let lookY = 0;

    // --- MacBook act: gentle push-in on entry, slow drift while reading ---
    const macActive = progress.macIn > 0.001 && progress.macOut < 0.999;
    if (macActive) {
      const inn = smoothstep(clamp(progress.macIn, 0, 1));
      const s = clamp(progress.macScroll, 0, 1);
      tz -= 4 * inn; // dolly in as it opens
      tz -= 1.5 * Math.sin(Math.PI * s); // subtle breath mid-scroll
      tx += (1 - inn) * 2.2; // arrive from a slight angle
      tx += Math.sin(s * Math.PI) * 1.4; // slow lateral orbit
      lookY = -0.6;
    }

    // --- iPhone act: ease slightly toward the phone (right) ---
    const phoneActive = progress.phoneIn > 0.001 && progress.phoneOut < 0.999;
    if (phoneActive) {
      const inn = smoothstep(clamp(progress.phoneIn, 0, 1));
      tx += inn * 1.6;
      tz -= 2 * inn;
      lookY = 0;
    }

    cam.position.x = damp(cam.position.x, tx, 2.4, dt);
    cam.position.y = damp(cam.position.y, ty, 2.4, dt);
    cam.position.z = damp(cam.position.z, tz, 2.0, dt);

    target.set(0, damp(cam.userData._lookY ?? 0, lookY, 2.4, dt), 0);
    cam.userData._lookY = target.y;
    cam.lookAt(target);
  });

  return null;
}
