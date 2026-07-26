import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { clamp } from '../lib/math.js';

/* -------------------------------------------------------------------------
 * laptop-new.glb (Sketchfab MacBook, already open).
 * Normalised on load (recentre + scale to a known width). The live site is
 * bound to the display mesh's OWN UVs (mesh `eVdSUYIqmtLvNwc`) as a tall
 * texture, scrolled via UV offset — a truly integrated display that takes the
 * scene's perspective / light / glass.
 * ------------------------------------------------------------------------- */
const NORM_WIDTH = 30;
const DISPLAY_MESH = 'eVdSUYIqmtLvNwc';

const SCREEN = {
  pxWidth: 1280,
  pxHeight: 800,
};

// Panel aspect (pxWidth/pxHeight) used to size the UV window on the tall texture.
const PANEL_ASPECT = SCREEN.pxWidth / SCREEN.pxHeight;

export default function Macbook({ getOpen, getScroll }) {
  const { scene } = useGLTF('/models/laptop-new.glb');
  const { gl } = useThree();
  const dispMatRef = useRef(null);
  const repeatYRef = useRef(0.086);

  const model = useMemo(() => scene.clone(true), [scene]);

  // Pick a texture that fits the GPU's max texture size (tall page ≈ 9305px).
  const texUrl =
    gl.capabilities.maxTextureSize >= 9305
      ? '/models/laptop-screen-hi.jpg'
      : '/models/laptop-screen-lo.jpg';
  const siteTex = useTexture(texUrl);

  // Normalise: recentre + uniform scale to NORM_WIDTH.
  const norm = useMemo(() => {
    model.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const s = NORM_WIDTH / (size.x || 1);
    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => {
          if (m) m.envMapIntensity = 1.35;
        });
      }
    });

    return {
      s,
      pos: [-s * center.x, -s * center.y, -s * center.z],
    };
  }, [model]);

  // Bind the live-site texture to the display mesh.
  useEffect(() => {
    const disp = model.getObjectByName(DISPLAY_MESH);
    if (!disp?.material) return;
    disp.material = disp.material.clone();
    const m = disp.material;

    const img = siteTex.image;
    const texW = img?.width || 1280;
    const texH = img?.height || 9305;
    const repeatY = texW / (PANEL_ASPECT * texH); // window that matches the panel aspect
    repeatYRef.current = repeatY;
    siteTex.colorSpace = THREE.SRGBColorSpace;
    siteTex.wrapS = siteTex.wrapT = THREE.ClampToEdgeWrapping;
    siteTex.flipY = true;
    siteTex.anisotropy = gl.capabilities.getMaxAnisotropy();
    siteTex.repeat.set(1, repeatY);
    siteTex.offset.set(0, 1 - repeatY);
    siteTex.needsUpdate = true;

    m.map = siteTex;
    m.emissiveMap = siteTex;
    m.emissive = new THREE.Color('#ffffff');
    m.emissiveIntensity = 0.62;
    m.color = new THREE.Color('#ffffff');
    m.metalness = 0.0;
    m.roughness = 0.34; // slight gloss → glass reflections from the environment
    dispMatRef.current = m;
    m.needsUpdate = true;
  }, [model, siteTex, gl]);

  useFrame(() => {
    const open = clamp(getOpen ? getOpen() : 1, 0, 1);
    const mat = dispMatRef.current;
    if (mat?.map) {
      const s = clamp(getScroll ? getScroll() : 0, 0, 1);
      const ry = repeatYRef.current;
      // top of page at s=0 → bottom at s=1 (flipY: V=1 is the page top)
      mat.map.offset.y = (1 - ry) * (1 - s);
      // "screen wakes" as the lid opens
      mat.emissiveIntensity = 0.62 * open;
      mat.color.setScalar(0.06 + 0.94 * open);
    }
  });

  return (
    <group scale={norm.s} position={norm.pos}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload('/models/laptop-new.glb');
