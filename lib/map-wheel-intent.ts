/** Accepted wheel input changes scale independently of scroll-intent detection. */
export function mapWheelZoomFactor(delta: number) {
  return Math.exp(Math.max(-0.16, Math.min(0.16, -delta * 0.0057475)));
}

/** Shared SVG/globe intent. Conservative page-scroll priority; no device sniffing. */
export function createMapWheelIntent() {
  let lastTime = -Infinity;
  let previousDelta = 0;
  let samples: Array<{ time: number; magnitude: number }> = [];
  let zoomUntil = 0;
  let observationStart = 0;
  let mode: "unknown" | "scroll" | "zoom" = "unknown";
  return (event: { deltaY: number; deltaX: number; deltaMode: number; timeStamp: number; ctrlKey: boolean; metaKey?: boolean }, outsideMap = false) => {
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 800 : 1;
    const delta = event.deltaY * unit;
    if (delta === 0 && event.deltaX === 0) return { zoom: false, delta, state: mode === "zoom" ? "ZOOM" : mode === "scroll" ? "PAGE_SCROLL" : "UNDECIDED", reason: "zero-motion", mode };
    const gap = event.timeStamp - lastTime;
    if (gap > 220) { mode = "unknown"; samples = []; observationStart = event.timeStamp; }
    lastTime = event.timeStamp;
    if (event.ctrlKey || event.metaKey) return { zoom: !outsideMap, delta, state: outsideMap ? "PAGE_SCROLL" : "ZOOM", reason: "explicit-pinch", mode };
    const magnitude = Math.abs(delta);
    const horizontal = Math.abs(event.deltaX * unit) >= magnitude;
    const sameDirection = Math.sign(delta) === Math.sign(previousDelta);
    if (!sameDirection) { samples = []; observationStart = event.timeStamp; }
    samples = samples.filter(sample => event.timeStamp - sample.time <= 120);
    samples.push({ time: event.timeStamp, magnitude });
    const span = event.timeStamp - samples[0].time;
    const velocity = samples.slice(1).reduce((sum, sample) => sum + sample.magnitude, 0) / Math.max(24, span);
    const notch = sameDirection && gap >= 80 && gap <= 180 && magnitude <= 120 && Math.abs(magnitude - Math.abs(previousDelta)) <= 4;
    // Strong input escapes immediately, even during the zoom hold. A fading page
    // gesture stays scroll until quiet; its tiny tail must never arm zoom.
    const escapeReason = outsideMap ? "outside-map" : horizontal ? "horizontal-dominant" : magnitude >= 140 ? "strong-delta" : gap < 40 && magnitude > 40 ? "dense-large-deltas" : mode === "zoom" && magnitude > 40 && !notch ? "zoom-acceleration" : samples.length >= 3 && velocity > 1.5 ? "rolling-velocity" : null;
    if (escapeReason) mode = "scroll";
    if (mode === "scroll") return { zoom: false, delta, state: "PAGE_SCROLL", reason: escapeReason ?? "scroll-momentum-lock", mode };
    // Measure the sequence, not each inter-event gap: 8–16ms trackpad events can
    // establish low-speed intent after 24ms. Spaced consistent notches also arm.
    const gentle = magnitude <= 40 && samples.length >= 2 && span >= 24 && velocity <= 1.2;
    if (gentle || notch) { mode = "zoom"; zoomUntil = event.timeStamp + 180; }
    else if (mode === "zoom" && (!sameDirection || event.timeStamp > zoomUntil)) mode = "unknown";
    if (mode === "unknown" && event.timeStamp - observationStart >= 120) mode = "scroll";
    previousDelta = delta;
    return { zoom: mode === "zoom" && magnitude > 0, delta,
      state: mode === "zoom" ? "ZOOM" : mode === "scroll" ? "PAGE_SCROLL" : "UNDECIDED",
      reason: gentle ? "gentle-sequence" : notch ? "consistent-notch" : mode === "zoom" ? "zoom-hysteresis" : mode === "scroll" ? "observation-timeout" : "gathering-evidence", mode };
  };
}

/** Accumulate accepted input; perform geometry reads and camera work once per frame. */
export function bindMapWheel(element: Element, canZoom: (delta: number) => boolean, apply: (delta: number, x: number, y: number) => void, provisionalCapture = true) {
  const intent = createMapWheelIntent();
  let frame: number | null = null;
  let delta = 0;
  let x = 0;
  let y = 0;
  let lastInput = -Infinity;
  let provisionalUntil = 0;
  let provisionalTravel = 0;
  let provisionalDelta = 0;
  let hoverSince: number | null = null;
  const enter = (event: Event) => { hoverSince = event.timeStamp; };
  const cancel = () => {
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    delta = 0;
    provisionalDelta = 0;
  };
  const leave = () => { hoverSince = null; provisionalUntil = 0; cancel(); };
  const outside = (event: WheelEvent) => {
    if (!event.composedPath().includes(element)) { intent(event, true); lastInput = event.timeStamp; provisionalUntil = 0; cancel(); }
  };
  const handle = (raw: Event) => {
    const event = raw as WheelEvent;
    let decision = intent(event);
    const quiet = event.timeStamp - lastInput > 220;
    if (decision.reason === "zero-motion") return;
    lastInput = event.timeStamp;
    const explicit = event.ctrlKey || event.metaKey;
    const magnitude = Math.abs(decision.delta);
    if (quiet || explicit) { provisionalUntil = 0; provisionalDelta = 0; }
    // Dwell is supporting evidence only: never capture a larger scroll start.
    const tinyStart = hoverSince !== null && event.timeStamp - hoverSince >= 200 ? 6 : 4;
    if (provisionalCapture && !explicit && quiet && decision.state === "UNDECIDED" && event.deltaMode === 0 && magnitude > 0 && magnitude <= tinyStart && Math.abs(event.deltaX) <= magnitude * 0.25 && event.cancelable && canZoom(decision.delta)) {
      provisionalUntil = event.timeStamp + 48;
      provisionalTravel = 0;
    }
    if (provisionalUntil && !explicit) {
      provisionalTravel += magnitude;
      if (decision.state === "PAGE_SCROLL" || magnitude > 24 || provisionalTravel > 60 || Math.abs(event.deltaX) > magnitude * 0.25 || (!decision.zoom && event.timeStamp > provisionalUntil)) {
        decision = { ...intent(event, true), reason: "provisional-release" };
        provisionalUntil = 0;
      } else if (!decision.zoom && event.cancelable) {
        event.preventDefault();
        provisionalDelta += decision.delta;
        return;
      } else if (decision.zoom) provisionalUntil = 0;
    }
    if (!decision.zoom) { cancel(); return; }
    if (!canZoom(decision.delta)) {
      cancel();
      if ((event.ctrlKey || event.metaKey) && event.cancelable) event.preventDefault();
      return;
    }
    if (!event.cancelable) { cancel(); return; }
    event.preventDefault();
    // Replay held signed input once, only after cancellable zoom is confirmed.
    delta += decision.delta + provisionalDelta;
    provisionalDelta = 0;
    x = event.clientX;
    y = event.clientY;
    if (frame !== null) return;
    frame = window.requestAnimationFrame(() => {
      frame = null;
      const accumulated = delta;
      delta = 0;
      apply(accumulated, x, y);
    });
  };
  window.addEventListener("wheel", outside, { passive: true, capture: true });
  element.addEventListener("wheel", handle, { passive: false });
  element.addEventListener("pointerenter", enter);
  element.addEventListener("pointerleave", leave);
  return () => {
    cancel();
    window.removeEventListener("wheel", outside, true);
    element.removeEventListener("wheel", handle);
    element.removeEventListener("pointerenter", enter);
    element.removeEventListener("pointerleave", leave);
  };
}
