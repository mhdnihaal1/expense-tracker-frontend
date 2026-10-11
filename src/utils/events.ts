// Tiny pub/sub so screens refresh after a mutation made elsewhere (e.g. in a modal).
type Listener = () => void;
const listeners = new Set<Listener>();

export function onDataChanged(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitDataChanged() {
  listeners.forEach((l) => l());
}
