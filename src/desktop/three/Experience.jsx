import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  AdaptiveDpr,
  AdaptiveEvents,
  PerformanceMonitor,
  Preload,
  OrbitControls,
} from '@react-three/drei';
import * as THREE from 'three';
import Stage from './Stage.jsx';
import Lighting from './Lighting.jsx';
import Effects from './Effects.jsx';
import CameraRig from './CameraRig.jsx';
import { pointer, setQuality, useScene } from '../lib/sceneStore.js';
import { useIsMobile } from '../lib/useMediaQuery.js';

const DEBUG =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');

export default function Experience() {
  const isMobile = useIsMobile();
  const { quality } = useScene();
  const [degraded, setDegraded] = useState(false);

  // Start conservatively on mobile; PerformanceMonitor may downgrade further.
  useEffect(() => {
    setQuality(isMobile ? 'low' : 'high');
  }, [isMobile]);

  const effectiveQuality = quality === 'low' || degraded ? 'low' : 'high';

  return (
    <div
      className="canvas-layer"
      onPointerMove={(e) => {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      }}
    >
      <Canvas
        shadows={effectiveQuality === 'high'}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        camera={{
          position: isMobile ? [0, 0, 50] : [0, 0, 46],
          fov: isMobile ? 36 : 32,
          near: 0.1,
          far: 200,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#000000', 0);
        }}
      >
        <PerformanceMonitor
          onDecline={() => setDegraded(true)}
          onIncline={() => setDegraded(false)}
        />

        <Suspense fallback={null}>
          <Lighting quality={effectiveQuality} />
          <Stage isMobile={isMobile} />
          <Preload all />
        </Suspense>

        {!DEBUG && <CameraRig isMobile={isMobile} />}
        {!DEBUG && <Effects quality={effectiveQuality} />}

        <AdaptiveDpr pixelated />
        <AdaptiveEvents />

        {DEBUG && (
          <>
            <axesHelper args={[20]} />
            <gridHelper args={[100, 40, '#333', '#161616']} />
            <OrbitControls makeDefault />
          </>
        )}
      </Canvas>
    </div>
  );
}
