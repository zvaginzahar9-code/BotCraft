import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { clamp } from '../lib/math.js';
import ScreenGlass from '../screens/ScreenGlass.jsx';

/* -------------------------------------------------------------------------
 * laptop-new.glb (Sketchfab MacBook, already open).
 * Normalised on load (recentre + scale to a known width), so screen placement
 * is expressed as fractions of the normalised bounding box.
 *
 * Two screen modes:
 *  - 'texture' (first demo): the live site is bound to the display mesh's OWN
 *    UVs (mesh `eVdSUYIqmtLvNwc`) as a tall texture, scrolled via UV offset —
 *    a truly integrated display that takes the scene's perspective/light/glass.
 *  - 'html' (finale): an interactive <Html transform> panel (clickable links).
 * ------------------------------------------------------------------------- */
const NORM_WIDTH = 30;
const DISPLAY_MESH = 'eVdSUYIqmtLvNwc';

const SCREEN = {
  pxWidth: 1280,
  pxHeight: 800,
};

// drei <Html transform> px→world factor (world units per px per unit scale).
// Calibrated so the finale Html exactly fills the derived panel width.
const DREI_K = 0.0219;

// Panel aspect (pxWidth/pxHeight) used to size the UV window on the tall texture.
const PANEL_ASPECT = SCREEN.pxWidth / SCREEN.pxHeight;

export default function Macbook({
  screen,
  getOpen,
  getScroll,
  screenMode = 'texture',
  active = true,
  interactive = false,
}) {
  const { scene } = useGLTF('/models/laptop-new.glb');
  const { gl } = useThree();
  const screenRef = useRef(null);
  const dispMatRef = useRef(null);
  const repeatYRef = useRef(0.086);

  const model = useMemo(() => scene.clone(true), [scene]);

  // Pick a texture that fits the GPU's max texture size (tall page ≈ 9305px).
  const texUrl =
    gl.capabilities.maxTextureSize >= 9305
      ? '/models/laptop-screen-hi.jpg'
      : '/models/laptop-screen-lo.jpg';
  const siteTex = useTexture(texUrl);

  // Normalise: recentre + uniform scale to NORM_WIDTH. Also derive the finale
  // Html screen placement DIRECTLY from the display mesh bbox so it lands exactly
  // inside the model's screen frame (no hand-tuned guessing).
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

    // display mesh (the tilted lid panel) → screen centre / tilt / size in
    // normalised space (a point P maps to s*(P - center))
    let screenCenter = [0, 0.24 * (size.y * s) * 0.5, -0.55 * (size.z * s) * 0.5];
    let panelTilt = -0.39;
    let panelW = size.x * s * 0.9;
    let panelH = panelW / 1.6;
    const disp = model.getObjectByName(DISPLAY_MESH);
    if (disp) {
      const dbox = new THREE.Box3().setFromObject(disp);
      const dc = new THREE.Vector3();
      const dsz = new THREE.Vector3();
      dbox.getCenter(dc);
      dbox.getSize(dsz);
      screenCenter = [s * (dc.x - center.x), s * (dc.y - center.y), s * (dc.z - center.z)];
      panelTilt = -Math.atan2(dsz.z, dsz.y); // lean back to match the lid
      panelW = dsz.x * s;
      panelH = Math.hypot(dsz.y, dsz.z) * s;
    }

    return {
      s,
      pos: [-s * center.x, -s * center.y, -s * center.z],
      half: [(size.x * s) / 2, (size.y * s) / 2, (size.z * s) / 2],
      screenCenter,
      panelTilt,
      panelW,
      panelH,
    };
  }, [model]);

  // Configure the display mesh per mode.
  useEffect(() => {
    const disp = model.getObjectByName(DISPLAY_MESH);
    if (!disp?.material) return;
    disp.material = disp.material.clone();
    const m = disp.material;

    if (screenMode === 'texture') {
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
    } else {
      // html mode — blacken the panel so the inset Html sits on a real screen
      m.map = null;
      m.emissiveMap = null;
      m.color = new THREE.Color('#05060a');
      if (m.emissive) m.emissive = new THREE.Color('#000000');
      m.emissiveIntensity = 1;
      m.metalness = 0.2;
      m.roughness = 0.28;
      dispMatRef.current = null;
    }
    m.needsUpdate = true;
  }, [model, screenMode, siteTex, gl]);

  useFrame(() => {
    const open = clamp(getOpen ? getOpen() : 1, 0, 1);

    if (screenMode === 'texture') {
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
    } else {
      const el = screenRef.current;
      if (el) el.style.opacity = String(Math.min(1, open * 1.4));
    }
  });

  // Html group scale so the pixel canvas fills the panel width (drei transform
  // maps px→world with a ~DREI_K factor). Position/tilt come from the mesh.
  const htmlScale = (norm.panelW / SCREEN.pxWidth) / DREI_K;
  const pxHeight = Math.round(SCREEN.pxWidth * (norm.panelH / norm.panelW));

  return (
    <group>
      <group scale={norm.s} position={norm.pos}>
        <primitive object={model} />
      </group>

      {active && screenMode === 'html' && (
        <group position={norm.screenCenter} rotation={[norm.panelTilt, 0, 0]} scale={htmlScale}>
          <Html
            transform
            position={[0, 0, 0]}
            style={{ pointerEvents: interactive ? 'auto' : 'none' }}
            wrapperClass="screen-wrapper"
            zIndexRange={[10, 0]}
          >
            <div
              ref={screenRef}
              className="device-screen device-screen--laptop"
              style={{ width: SCREEN.pxWidth, height: pxHeight }}
            >
              <div className="device-screen__content">{screen}</div>
              <ScreenGlass />
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

useGLTF.preload('/models/laptop-new.glb');
