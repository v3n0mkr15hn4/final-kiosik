// Shared mock-latency helpers — every "blocking wait" in the kiosk uses these
// instead of duplicating setTimeout boilerplate per call site. When a real
// backend is wired in later, wrap the real call with mockDelayRange via
// Promise.all so the wait never exceeds max(real, mock) — i.e. it stops
// being artificial the moment real latency exceeds it.
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockDelayRange = (min = 2200, max = 2800) =>
  sleep(min + Math.floor(Math.random() * (max - min)));
