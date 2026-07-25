import {
  EffectComposer,
  Bloom,
  Vignette,
  SMAA,
  BrightnessContrast,
} from '@react-three/postprocessing';

/**
 * Restrained, monochrome post pipeline. Bloom only lifts the brightest metal
 * highlights; contrast + vignette give the "expensive cinema" feel. No color
 * effects (palette stays black/white/grey).
 */
export default function Effects({ quality = 'high' }) {
  if (quality === 'low') {
    // Keep only cheap AA on constrained devices.
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <SMAA />
        <Vignette eskil={false} offset={0.28} darkness={0.62} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom
        intensity={0.32}
        luminanceThreshold={0.72}
        luminanceSmoothing={0.16}
        mipmapBlur
        radius={0.7}
      />
      <BrightnessContrast brightness={0.0} contrast={0.06} />
      <Vignette eskil={false} offset={0.26} darkness={0.7} />
      <SMAA />
    </EffectComposer>
  );
}
