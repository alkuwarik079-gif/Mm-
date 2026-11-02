export function Bolt({ className = "", filled = true }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M14.2 2 5.5 13.4h5.4L9.4 22l9.1-12h-5.6L14.2 2Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1}
        strokeLinejoin="round"
      />
    </svg>
  );
}
