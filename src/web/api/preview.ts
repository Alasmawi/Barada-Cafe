export const PREVIEW_MODES = ['normal', 'slow', 'error', 'empty'] as const;
export type PreviewMode = (typeof PREVIEW_MODES)[number];

const STORAGE_KEY = 'finjan.preview';

/** Lets reviewers trigger each screen state from the demo menu. Client only: the server stays clean. */
export function getPreviewMode(): PreviewMode {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY) as PreviewMode | null;
    return stored && PREVIEW_MODES.includes(stored) ? stored : 'normal';
  } catch {
    return 'normal';
  }
}

export function setPreviewMode(mode: PreviewMode): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Without storage the preview simply stays off.
  }
}
