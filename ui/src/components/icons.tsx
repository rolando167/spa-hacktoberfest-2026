// Iconos de trazo propios. Decorativos: aria-hidden siempre; el texto accesible va en el botón.
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 20): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
});

export const MicIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);
export const UserIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} strokeWidth={1.8} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </svg>
);
export const ArrowRightIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const ArrowLeftIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);
export const LocateIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </svg>
);
export const NavIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M3 11l18-8-8 18-2-8-8-2z" />
  </svg>
);
export const CheckIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} strokeWidth={2.5} {...p}>
    <path d="M5 12l5 5L20 7" />
  </svg>
);
export const SpeakerIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M11 5L6 9H3v6h3l5 4V5z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
);
export const RainIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M7 15a5 5 0 1 1 1-9.9A6 6 0 0 1 19 9a4 4 0 0 1-1 7H7z" />
    <path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2" />
  </svg>
);
export const HouseIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M3 11l9-7 9 7" />
    <path d="M5 10v10h14V10" />
  </svg>
);
export const ClockIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2 2M9 2h6" />
  </svg>
);
export const TagIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M3 12V4h8l10 10-8 8L3 12z" />
    <circle cx="7.5" cy="8.5" r="1.5" />
  </svg>
);

/** Elige icono para un chip de intención según su texto. */
export function iconForTag(tag: string) {
  const t = tag.toLowerCase();
  if (/(llu|lluv|rain)/.test(t)) return RainIcon;
  if (/(techo|interior|cubierto)/.test(t)) return HouseIcon;
  if (/(min|hora|corto)/.test(t)) return ClockIcon;
  return TagIcon;
}
