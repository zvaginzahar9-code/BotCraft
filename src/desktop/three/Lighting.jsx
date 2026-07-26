import { Environment, Lightformer, ContactShadows } from '@react-three/drei';

/**
 * Premium studio lighting for brushed-aluminium + glass on a black stage:
 *  - soft warm-neutral key from above,
 *  - a cool side fill (холодный боковой свет),
 *  - a rim/back light for edge separation,
 *  - sculpted <Lightformer> streaks that read as reflections across the metal.
 * Colours stay near-white (the cool light is only subtly cold) to respect the
 * monochrome concept.
 */
export default function Lighting({ quality = 'high', shadowY = -6 }) {
  const high = quality === 'high';
  return (
    <>
      <ambientLight intensity={0.28} />

      {/* warm-neutral key (soft top) */}
      <directionalLight
        position={[7, 13, 9]}
        intensity={1.5}
        color="#fff6ee"
        castShadow={high}
        shadow-mapSize={high ? [2048, 2048] : [1024, 1024]}
        shadow-bias={-0.0002}
      >
        <orthographicCamera attach="shadow-camera" args={[-40, 40, 40, -40, 0.1, 90]} />
      </directionalLight>

      {/* cool side fill */}
      <directionalLight position={[-13, 5, 3]} intensity={0.7} color="#d9e6f7" />

      {/* rim / back light — separates the device edges from the black */}
      <directionalLight position={[0, 7, -15]} intensity={1.1} color="#ffffff" />

      <Environment resolution={high ? 512 : 256} frames={1}>
        {/* big top softbox */}
        <Lightformer
          form="rect"
          intensity={2.4}
          position={[0, 7, 3]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[20, 20, 1]}
          color="#ffffff"
        />
        {/* thin bright streaks — elegant reflection lines across aluminium/glass */}
        <Lightformer
          form="rect"
          intensity={3}
          position={[-9, 3, 6]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[16, 0.5, 1]}
          color="#ffffff"
        />
        <Lightformer
          form="rect"
          intensity={2.4}
          position={[-6, -1, 6]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[12, 0.35, 1]}
          color="#eef3fb"
        />
        {/* cool large side box (left) */}
        <Lightformer
          form="rect"
          intensity={1.5}
          position={[-11, 2, 3]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[12, 6, 1]}
          color="#cfe0f4"
        />
        {/* warm-neutral side box (right) */}
        <Lightformer
          form="rect"
          intensity={1.3}
          position={[11, 2, 3]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[12, 6, 1]}
          color="#fff2e8"
        />
        {/* subtle front fill */}
        <Lightformer
          form="ring"
          intensity={0.6}
          position={[0, 1, 11]}
          scale={[7, 7, 1]}
          color="#cfcfcf"
        />
      </Environment>

      <ContactShadows
        position={[0, shadowY, 0]}
        opacity={high ? 0.6 : 0.42}
        scale={100}
        blur={2.8}
        far={34}
        resolution={high ? 1024 : 512}
        color="#000000"
      />
    </>
  );
}
