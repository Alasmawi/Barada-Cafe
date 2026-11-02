/** Long forms can put a problem off-screen, which looks like the button did nothing. */
export function revealFirstError(): void {
  setTimeout(() => {
    document
      .querySelector('.form-error, [aria-invalid="true"]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 50);
}
