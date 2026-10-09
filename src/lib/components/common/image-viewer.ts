import { writable, type Writable } from 'svelte/store';

export type ViewerImage = {
  src: string;
  alt?: string;
};

export type ViewerState = {
  images: ViewerImage[];
  index: number;
};

// Keeps an index inside [0, length) and wraps around, so prev/next never escape the group.
export function normalizeViewerIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (!Number.isFinite(index)) return 0;
  return ((Math.trunc(index) % length) + length) % length;
}

const state: Writable<ViewerState | null> = writable(null);

// One shared viewer instance per page: any image anywhere can hand it a group + start index.
export const imageViewer = {
  subscribe: state.subscribe,
  open(images: ViewerImage[], index = 0) {
    const list = images.filter((image) => Boolean(image && image.src));
    if (!list.length) return;
    state.set({ images: list, index: normalizeViewerIndex(index, list.length) });
  },
  close() {
    state.set(null);
  },
  go(delta: number) {
    state.update((current) =>
      current ? { ...current, index: normalizeViewerIndex(current.index + delta, current.images.length) } : current
    );
  },
  show(index: number) {
    state.update((current) =>
      current ? { ...current, index: normalizeViewerIndex(index, current.images.length) } : current
    );
  }
};
