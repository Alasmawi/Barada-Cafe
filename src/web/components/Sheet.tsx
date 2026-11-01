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
    // showModal() focuses the close button. A form opens to be typed in, anything else to be read.
    (dialog.current?.querySelector<HTMLElement>('input, textarea') ?? dialog.current)?.focus();
  }, [open]);

  // iOS keeps fixed elements behind the keyboard, which would hide the sheet's send button.
  useEffect(() => {
    const viewport = window.visualViewport;
    const element = dialog.current;
    if (!open || !viewport || !element) return;

    const liftAboveKeyboard = () => {
      const covered = window.innerHeight - viewport.height - viewport.offsetTop;
      element.style.marginBlockEnd = `${Math.max(covered, 0)}px`;
    };
    liftAboveKeyboard();
    viewport.addEventListener('resize', liftAboveKeyboard);
    viewport.addEventListener('scroll', liftAboveKeyboard);
    return () => {
      viewport.removeEventListener('resize', liftAboveKeyboard);
      viewport.removeEventListener('scroll', liftAboveKeyboard);
      element.style.marginBlockEnd = '';
    };
  }, [open]);

  const closeOnBackdrop = (event: MouseEvent) => {
    if (event.target === dialog.current) onClose();
  };

  return (
    <dialog ref={dialog} className="sheet" tabIndex={-1} onClose={onClose} onClick={closeOnBackdrop}>
      {open && (
        <div className="sheet__panel">
          <span className="sheet__grabber" aria-hidden />
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
