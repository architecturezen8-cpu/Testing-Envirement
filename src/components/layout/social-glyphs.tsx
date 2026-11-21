import type { SVGProps } from "react";

/**
 * Brand glyphs for the footer.
 *
 * lucide-react no longer ships social/brand icons, so these are hand-drawn
 * inline vectors. They inherit `currentColor`, which lets the footer swap
 * white → black on hover simply by changing the text colour.
 */

type IconProps = SVGProps<SVGSVGElement>;

export function InstagramGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5.2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.9" r="1.25" fill="currentColor" />
    </svg>
  );
}

export function XGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M17.53 3h3.02l-6.6 7.54L21.75 21h-5.47l-4.28-5.6L7.06 21H4.04l7.06-8.07L3.75 3h5.6l3.87 5.12L17.53 3Zm-1.06 16.2h1.67L7.62 4.72H5.83L16.47 19.2Z" />
    </svg>
  );
}

export function ThreadsGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12.2 21.5c-2.5 0-4.45-.83-5.8-2.46C5.1 17.48 4.4 15.28 4.4 12.6c0-2.72.7-4.9 2.03-6.5C7.8 4.45 9.76 3.6 12.2 3.6c2.36 0 4.2.75 5.5 2.23.98 1.12 1.6 2.55 1.86 4.25l-1.86.44c-.42-2.62-1.9-4.06-5.5-4.06-1.9 0-3.36.6-4.34 1.79-.95 1.15-1.44 2.83-1.44 4.99 0 2.13.49 3.79 1.45 4.94.98 1.17 2.44 1.77 4.33 1.77 1.75 0 3.05-.5 3.87-1.48.6-.72.86-1.6.86-2.4 0-.5-.1-.96-.28-1.34.3-.07.6-.17.9-.3.44-.19.83-.44 1.17-.75.6.85.94 1.92.94 3.1 0 1.42-.5 2.72-1.44 3.66-1.2 1.2-2.96 1.86-5.12 1.86Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M15.1 12.9c-2.13 0-3.6.72-3.6 1.98 0 1.1 1.05 1.79 2.72 1.79 1.5 0 2.72-.72 3.3-1.9.22-.45.35-.94.38-1.45-.87-.28-1.8-.42-2.8-.42Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function FacebookGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M13.6 21v-7.9h2.66l.4-3.09H13.6V8.03c0-.89.25-1.5 1.53-1.5h1.63V3.78c-.28-.04-1.25-.12-2.38-.12-2.35 0-3.96 1.44-3.96 4.08v2.27H7.75v3.09h2.67V21h3.18Z" />
    </svg>
  );
}

export function YoutubeGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect
        x="2.6"
        y="5.4"
        width="18.8"
        height="13.2"
        rx="4.2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M10.2 9.3l5 2.7-5 2.7V9.3Z" fill="currentColor" />
    </svg>
  );
}
