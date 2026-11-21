import type { SVGProps } from "react";

/**
 * Brand glyphs for the footer.
 *
 * Every glyph is drawn as a **stroke-only outline** — no filled shapes — so
 * the mark reads as a line drawing inside its circular button. Because they
 * use `stroke="currentColor"`, the footer can render them white and flip the
 * stroke to black simply by changing the text colour on hover.
 */

type IconProps = SVGProps<SVGSVGElement>;

/** Shared defaults so every glyph stays visually consistent. */
const base: IconProps = {
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function InstagramGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4.15" stroke="currentColor" strokeWidth="1.7" />
      {/* lens dot stays an outline too */}
      <circle cx="17.15" cy="6.85" r="1.05" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function XGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path
        d="M4.4 3.6h4.1l4 5.3 4.5-5.3h2.6l-5.8 6.8L20.2 20.4h-4.1l-4.2-5.6-4.8 5.6H4.5l6.1-7.1L4.4 3.6Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function ThreadsGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      {/* outer curve of the "a" */}
      <path
        d="M12.6 20.9c-2.3 0-4.05-.78-5.3-2.33C6.1 17.05 5.5 14.98 5.5 12.4c0-2.6.62-4.68 1.87-6.2C8.6 4.6 10.35 3.85 12.6 3.85c2.2 0 3.9.7 5.08 2.1.86 1.02 1.42 2.3 1.68 3.83"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      {/* inner bowl */}
      <path
        d="M9.4 12.4c0 2.4 1.4 3.9 3.5 3.9 1.9 0 3.3-1.15 3.85-3.05.3-1.05.4-2.2.36-3.45-.86-.5-1.94-.78-3.2-.78-2.6 0-4.5 1.28-4.5 3.38Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      {/* hook descending from the bowl */}
      <path d="M16.6 13.7c.35 1.9.05 4.15-1.9 5.6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function FacebookGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path
        d="M14.8 20.6v-6.9h2.4l.4-2.85h-2.8V9.05c0-.82.24-1.38 1.42-1.38h1.5V5.15c-.26-.03-1.15-.1-2.18-.1-2.16 0-3.64 1.32-3.64 3.74v2.06H9.5v2.85h2.44v6.9h2.86Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function YoutubeGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="2.7" y="5.5" width="18.6" height="13" rx="4.3" stroke="currentColor" strokeWidth="1.7" />
      {/* play triangle as an outline */}
      <path d="M10.4 9.5l4.6 2.5-4.6 2.5v-5Z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
