import { useQueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { CHANGE_EVENT, getPreviewMode, setPreviewMode } from '../api/preview';

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

/** Says so when a state is being faked, so nobody reports a preview as a real fault. */
export function PreviewBanner() {
  const queryClient = useQueryClient();
  const mode = useSyncExternalStore(subscribe, getPreviewMode);
  if (mode === 'normal') return null;

  const stop = () => {
    setPreviewMode('normal');
    void queryClient.resetQueries();
  };

  return (
    <div className="preview-banner" role="status">
      <span>Previewing the {mode} state</span>
      <button type="button" onClick={stop}>
        Turn off
      </button>
    </div>
  );
}
