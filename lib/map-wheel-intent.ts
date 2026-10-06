/** Shared SVG/globe intent. Conservative page-scroll priority; no device sniffing. */
export function createMapWheelIntent() {
  let samples: Array<{ time: number; delta: number }> = [];
  let scrollUntil = 0;
  return (event: { deltaY: number; deltaX: number; deltaMode: number; timeStamp: number; ctrlKey: boolean }) => {
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 800 : 1;
    const delta = event.deltaY * unit;
    const time = event.timeStamp;
    samples = samples.filter((sample) => time - sample.time < 140);
    samples.push({ time, delta: Math.abs(delta) });
    if (event.ctrlKey) return { zoom: true, delta };
    const total = samples.reduce((sum, sample) => sum + sample.delta, 0);
    const duration = Math.max(40, time - samples[0].time);
    const burst = samples.length >= 3 && total / duration > 1.2;
    const fast = Math.abs(delta) >= 160 || burst || Math.abs(event.deltaX * unit) > Math.abs(delta);
    if (fast) scrollUntil = time + 220;
    return { zoom: !fast && time >= scrollUntil && delta !== 0, delta };
  };
}
