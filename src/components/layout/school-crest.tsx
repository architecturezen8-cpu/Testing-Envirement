import type { SVGProps } from "react";

/**
 * St. Thomas' College, Matale — school crest.
 * Drawn as an inline vector so it stays crisp at any size and never
 * depends on an external asset. Rendered inside the white circle badge
 * in the header.
 */
export function SchoolCrest(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="St. Thomas' College Matale crest"
      {...props}
    >
      {/* Outer ring */}
      <circle cx="32" cy="32" r="29" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="32" cy="32" r="25.5" stroke="currentColor" strokeWidth="0.7" opacity="0.5" />

      {/* Shield */}
      <path
        d="M20 17h24v16.5c0 8.2-5.1 14-12 17.5-6.9-3.5-12-9.3-12-17.5V17Z"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeWidth="1.4"
      />

      {/* St. Thomas cross */}
      <path d="M32 20.5v22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M25.5 27h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />

      {/* Open book beneath the cross */}
      <path
        d="M23.5 36.5c2.8-1.3 5.7-1.3 8.5 0 2.8-1.3 5.7-1.3 8.5 0v6.2c-2.8-1.3-5.7-1.3-8.5 0-2.8-1.3-5.7-1.3-8.5 0v-6.2Z"
        fill="currentColor"
        fillOpacity="0.85"
      />
      <path d="M32 36.5v6.2" stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.9" />

      {/* Flame of faith above */}
      <path
        d="M32 12.5c1.6 2 1.6 3.4 0 4.6-1.6-1.2-1.6-2.6 0-4.6Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
    </svg>
  );
}
