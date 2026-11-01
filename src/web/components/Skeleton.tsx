/** Placeholder blocks in the shape of the content on the way. Sized by `className` in app.css. */
export function Skeleton({ className, count = 1 }: { className: string; count?: number }) {
  return (
    <div className="skeleton-group" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={`skeleton ${className}`} />
      ))}
    </div>
  );
}
