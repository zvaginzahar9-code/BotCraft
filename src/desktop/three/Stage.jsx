import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import Macbook from './Macbook.jsx';
import { progress, pointer } from '../lib/sceneStore.js';
import { clamp, lerp, smoothstep } from '../lib/math.js';

/* -------------------------------------------------------------------------
 * World layout — resting pose + entrance/exit deltas for the MacBook demo act.
 * The phone act is rendered by the embedded MONO build (sections/PhoneStage.jsx),
 * not in this canvas.
 * ------------------------------------------------------------------------- */
const MAC = {
  rest: { pos: [0, -1, 0], rot: [0.04, 0, 0], scale: 0.68 },
  enterY: -34,
  enterScale: 0.86,
  exitY: 50,
};

export default function Stage({ isMobile = false }) {
  const macRef = useRef();

  // Portrait framing: shrink the wide MacBook.
  const macFit = isMobile ? 0.42 : 1;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const mac = macRef.current;
    if (!mac) return;

    const floatY = Math.sin(t * 0.6) * 0.12;
    const inn = smoothstep(clamp(progress.macIn, 0, 1));
    const out = smoothstep(clamp(progress.macOut, 0, 1));

    mac.position.set(
      MAC.rest.pos[0] + pointer.x * 0.4,
      lerp(MAC.rest.pos[1] + MAC.enterY, MAC.rest.pos[1], inn) + out * MAC.exitY + floatY,
      MAC.rest.pos[2],
    );
    mac.scale.setScalar(MAC.rest.scale * macFit * lerp(MAC.enterScale, 1, inn) * lerp(1, 0.9, out));
    mac.rotation.set(
      MAC.rest.rot[0] + pointer.y * 0.05,
      MAC.rest.rot[1] + pointer.x * 0.06,
      MAC.rest.rot[2],
    );
    mac.visible = progress.macIn > 0.0001 && progress.macOut < 0.999;
  });

  return (
    <group ref={macRef} visible={false}>
      <Macbook getOpen={() => progress.macOpen} getScroll={() => progress.macScroll} />
    </group>
  );
}
