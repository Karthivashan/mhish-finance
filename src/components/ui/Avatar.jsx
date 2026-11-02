export default function Avatar({ profile, size = 40 }) {
  const initials = (profile.name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
  const style = { width: size, height: size, fontSize: size * 0.38 };
  if (profile.avatarImage)
    return <img src={profile.avatarImage} alt="" style={style} className="shrink-0 rounded-xl object-cover ring-1 ring-line" />;
  return (
    <span style={{ ...style, background: profile.avatarColor || '#00A651' }}
      className="inline-flex shrink-0 items-center justify-center rounded-xl font-bold text-white ring-1 ring-white/10" aria-hidden="true">
      {initials}
    </span>
  );
}
