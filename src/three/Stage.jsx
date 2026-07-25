import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import Macbook from './Macbook.jsx';
import { progress, pointer } from '../lib/sceneStore.js';
import { clamp, lerp, smoothstep } from '../lib/math.js';
import ContactOS from '../screens/ContactOS.jsx';

/* -------------------------------------------------------------------------
 * World layout — resting poses + entrance/exit deltas for the MacBook (used for
 * both the first demo and the finale). The phone act is rendered by the embedded
 * MONO build (sections/PhoneStage.jsx), not in this canvas.
 * ------------------------------------------------------------------------- */
const MAC = {
  rest: { pos: [0, -1, 0], rot: [0.04, 0, 0], scale: 0.68 },
  enterY: -34,
  enterScale: 0.86,
  exitY: 50,
};
const CONTACT = {
  rest: { pos: [0, -1, 1], rot: [0.03, 0, 0], scale: 0.7 },
  enterY: -34,
};

export default function Stage({ isMobile = false }) {
  const macRef = useRef();

  // Which content the (shared) MacBook shows. Switches only at act boundaries.
  const [macMode, setMacMode] = useState('laptop'); // 'laptop' | 'contact'
  const [macActive, setMacActive] = useState(false);

  // Portrait framing: shrink the wide MacBook.
  const macFit = isMobile ? 0.42 : 1;

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    /* ---------------- MacBook (laptop act + contact act) ---------------- */
    const contactPhase = progress.contactIn > 0.001;
    const nextMode = contactPhase ? 'contact' : 'laptop';
    if (nextMode !== macMode) setMacMode(nextMode);

    const mac = macRef.current;
    if (mac) {
      let px, py, pz, sc, visible;
      const floatY = Math.sin(t * 0.6) * 0.12;

      if (contactPhase) {
        const inn = smoothstep(progress.contactIn);
        px = CONTACT.rest.pos[0];
        py = lerp(CONTACT.rest.pos[1] + CONTACT.enterY, CONTACT.rest.pos[1], inn) + floatY;
        pz = CONTACT.rest.pos[2];
        sc = CONTACT.rest.scale * macFit * lerp(0.85, 1, inn);
        visible = progress.contactIn > 0.0001;
        mac.rotation.set(CONTACT.rest.rot[0], CONTACT.rest.rot[1], CONTACT.rest.rot[2]);
      } else {
        const inn = smoothstep(clamp(progress.macIn, 0, 1));
        const out = smoothstep(clamp(progress.macOut, 0, 1));
        px = MAC.rest.pos[0] + pointer.x * 0.4;
        py = lerp(MAC.rest.pos[1] + MAC.enterY, MAC.rest.pos[1], inn) + out * MAC.exitY + floatY;
        pz = MAC.rest.pos[2];
        sc = MAC.rest.scale * macFit * lerp(MAC.enterScale, 1, inn) * lerp(1, 0.9, out);
        visible = progress.macIn > 0.0001 && progress.macOut < 0.999;
        mac.rotation.set(
          MAC.rest.rot[0] + pointer.y * 0.05,
          MAC.rest.rot[1] + pointer.x * 0.06,
          MAC.rest.rot[2],
        );
      }

      mac.position.set(px, py, pz);
      mac.scale.setScalar(sc);
      mac.visible = visible;
      if (visible !== macActive) setMacActive(visible);
    }
  });

  const isContact = macMode === 'contact';
  const macGetOpen = () => (isContact ? progress.contactOpen : progress.macOpen);
  const macGetScroll = () => progress.macScroll;

  return (
    <group ref={macRef} visible={false}>
      <Macbook
        screen={isContact ? <ContactOS /> : null}
        screenMode={isContact ? 'html' : 'texture'}
        getOpen={macGetOpen}
        getScroll={macGetScroll}
        active={macActive}
        interactive={isContact}
      />
    </group>
  );
}
