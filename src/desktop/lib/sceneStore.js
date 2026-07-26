import { useSyncExternalStore } from 'react';

/**
 * A tiny hand-rolled store bridging the DOM scroll layer and the R3F scene.
 *
 * Two kinds of data live here:
 *  - `progress`: continuous, per-phase scroll progress (0..1). Mutated directly
 *    by ScrollTrigger callbacks and read every frame inside `useFrame`. These do
 *    NOT trigger React renders (that would tank performance at 60fps).
 *  - Discrete flags (`ready`, `started`, `act`, `quality`): change rarely and are
 *    exposed to React via useSyncExternalStore.
 */

// ---- Continuous (frame-read, no re-render) --------------------------------
export const progress = {
  hero: 0, // logo intro completion (set by Hero timeline)
  dock: 0, // logo docking to nav (0 center → 1 nav)
  macIn: 0, // macbook entrance
  macOpen: 0, // macbook lid open
  macScroll: 0, // inner laptop site scroll
  macOut: 0, // macbook exit up
  phoneIn: 0,
  phoneScroll: 0,
  phoneOut: 0,
};

// A pointer used for subtle parallax of the devices.
export const pointer = { x: 0, y: 0 };

// ---- Discrete (React-subscribed) ------------------------------------------
let state = {
  ready: false, // both GLB models loaded
  started: false, // intro complete, scroll unlocked
  quality: 'high', // 'high' | 'low' — set from device/perf detection
};

const listeners = new Set();
function emit() {
  state = { ...state };
  listeners.forEach((l) => l());
}
function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function getSnapshot() {
  return state;
}

export function setReady(v) {
  if (state.ready !== v) {
    state.ready = v;
    emit();
  }
}
export function setStarted(v) {
  if (state.started !== v) {
    state.started = v;
    emit();
  }
}
export function setQuality(v) {
  if (state.quality !== v) {
    state.quality = v;
    emit();
  }
}

export function useScene() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
