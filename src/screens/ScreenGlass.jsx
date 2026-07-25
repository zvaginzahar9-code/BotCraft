/**
 * Non-interactive glass overlays that make the live HTML read as a real device
 * display: a soft specular sheen, a top light band, and an edge vignette /
 * inner rim that recesses the panel into the bezel. Rendered on top of the
 * screen content, inside the same transformed plane, so it tracks the device
 * through the open animation and any camera move.
 */
export default function ScreenGlass() {
  return (
    <>
      <div className="screen-fx screen-fx--sheen" aria-hidden />
      <div className="screen-fx screen-fx--glare" aria-hidden />
      <div className="screen-fx screen-fx--vignette" aria-hidden />
    </>
  );
}
