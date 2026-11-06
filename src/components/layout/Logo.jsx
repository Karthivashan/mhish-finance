export default function Logo({ size = 36, showName = true }) {
  return (
    <span className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
        <rect width="32" height="32" rx="9" fill="#d90429" />
        <path d="M9 21c0-7 5-11 14-12-1 8-5 13-12 13" fill="#F7F4ED" />
        <path d="M9 24c2-5 6-8 11-10" stroke="#0B3D2E" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </svg>
      {showName && <span className="text-[19px] font-extrabold tracking-tight">Mhish</span>}
    </span>
  );
}
