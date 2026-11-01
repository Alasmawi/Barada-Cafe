import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/** A bottom sheet on the native dialog, which brings the focus trap and Escape for free. */
export function Sheet({ open, onClose, title, children }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!open) {
      dialog.current?.close();
      return;
    }
    dialog.current?.showModal();
    // showModal() focuses the close button, but a form sheet is opened to be typed in.
    dialog.current?.querySelector('input')?.focus();
  }, [open]);

  const closeOnBackdrop = (event: MouseEvent) => {
    if (event.target === dialog.current) onClose();
  };

  return (
    <dialog ref={dialog} className="sheet" onClose={onClose} onClick={closeOnBackdrop}>
      {open && (
        <div className="sheet__panel">
          <div className="sheet__header">
            <h2 className="sheet__title">{title}</h2>
            <button className="sheet__close" type="button" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
