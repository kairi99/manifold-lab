import { traceRow, type TraceParams } from '../math/raytrace';

// Message in: {id, params}. Out per row: {id, row, data}; then {id, done: true}.
// A newer message supersedes (cancels) the running job; we yield to the event loop often so it can arrive.
const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<{ id: number; params: TraceParams }>) => void) | null;
  postMessage(m: unknown, t?: Transferable[]): void;
};
let current = -1;
const yieldNow = () => new Promise<void>((res) => { const c = new MessageChannel(); c.port1.onmessage = () => res(); c.port2.postMessage(0); });

ctx.onmessage = async (e) => {
  const { id, params } = e.data;
  current = id;
  let t = performance.now();
  for (let row = 0; row < params.height; row++) {
    if (current !== id) return;
    const data = new Uint8ClampedArray(params.width * 4);
    traceRow(params, row, data);
    ctx.postMessage({ id, row, data }, [data.buffer]);
    if (performance.now() - t > 20) { await yieldNow(); t = performance.now(); }
  }
  if (current === id) ctx.postMessage({ id, done: true });
};
