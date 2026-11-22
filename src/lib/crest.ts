import sharp from "sharp";

/**
 * Renders the college crest as a PNG for the email header.
 *
 * Cached per process so repeated checkouts don't re-render the same artwork.
 */

let cached: Buffer | null = null;

const SVG = `<svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="60" r="58" fill="#ffffff"/>
  <circle cx="60" cy="60" r="51" fill="none" stroke="#12294a" stroke-width="2.6"/>
  <circle cx="60" cy="60" r="44" fill="none" stroke="#12294a" stroke-width="0.7" opacity="0.5"/>
  <path d="M35 30h50v34c0 17-10.6 29-25 36.5C45.6 93 35 81 35 64V30Z"
        fill="#12294a" fill-opacity="0.14" stroke="#12294a" stroke-width="2.4"/>
  <path d="M60 37v45" stroke="#12294a" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M46.5 51h27" stroke="#12294a" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M42.5 68c5.6-2.6 11.4-2.6 17.5 0 6.1-2.6 11.9-2.6 17.5 0v12.6
           c-5.6-2.6-11.4-2.6-17.5 0-6.1-2.6-11.9-2.6-17.5 0V68Z"
        fill="#12294a" fill-opacity="0.85"/>
  <path d="M60 26.5c3.2 4 3.2 6.8 0 9.2-3.2-2.4-3.2-5.2 0-9.2Z"
        fill="#12294a" fill-opacity="0.9"/>
</svg>`;

export async function getCrestPng(): Promise<Buffer | undefined> {
  if (cached) return cached;
  try {
    cached = await sharp(Buffer.from(SVG)).png().toBuffer();
    return cached;
  } catch (e) {
    console.error("[crest] render failed:", (e as Error).message);
    return undefined;
  }
}
