// Logo do LoteOn: o símbolo em "L" com os tons de verde da marca e o nome em texto,
// para que "Lote" acompanhe a cor do tema (a arte original tem "Lote" em branco).
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size * 0.8} height={size} viewBox="40 40 400 510" aria-hidden="true">
      <defs>
        <linearGradient id="lo-left" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0be38f" />
          <stop offset="1" stopColor="#03a865" />
        </linearGradient>
        <linearGradient id="lo-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#36f6ad" />
          <stop offset="1" stopColor="#022e1f" />
        </linearGradient>
        <linearGradient id="lo-floor" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#03b56f" />
          <stop offset="1" stopColor="#12f29d" />
        </linearGradient>
      </defs>
      <path d="M52 178 Q52 165 64 158 L148 108 V420 L62 470 Q52 465 52 455 Z" fill="url(#lo-left)" />
      <path d="M148 108 L255 45 V355 L148 420 Z" fill="url(#lo-back)" />
      <path d="M62 470 L315 322 L428 383 L190 543 Z" fill="url(#lo-floor)" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="logo">
      <LogoMark />
      <span className="logo-text">
        Lote<span className="logo-on">On</span>
      </span>
    </span>
  );
}
