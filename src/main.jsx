import React from 'react';
import { createRoot } from 'react-dom/client';
import AppRoot from './AppRoot.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>,
);

// Retire the static boot screen (see index.html) once the app owns the pixels.
// It fades out over the black background both versions already start on, then
// leaves the DOM so it can never intercept input.
const boot = document.getElementById('boot');
if (boot) {
  requestAnimationFrame(() => {
    document.body.classList.add('app-ready');
    setTimeout(() => boot.remove(), 700);
  });
}
