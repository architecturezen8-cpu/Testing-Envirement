"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Detects the white "QR placeholder" square inside a ticket image and returns
 * where the real QR should be painted, as percentages of the image size.
 *
 * The admin's uploaded ticket artwork is expected to include an empty white
 * rectangle where the QR belongs. This scans the drawn image for the largest
 * flat near-white region and takes its centre, which is robust to tickets of
 * any size/aspect and does not need any external CV library.
 */
export function useWhiteSquareDetector(imageUrl: string) {
  const [box, setBox] = useState<{ left: number; top: number; width: number } | null>(null);

  const urlRef = useRef(imageUrl);

  useEffect(() => {
    urlRef.current = imageUrl;
    let cancelled = false;

    async function detect() {
      if (!imageUrl || imageUrl.startsWith("data:")) {
        setBox(null);
        return;
      }

      try {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        await img.decode().catch(() => {
          throw new Error("decode failed");
        });

        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) throw new Error("no size");

        const canvas = document.createElement("canvas");
        // Downscale for speed — we only need approximate geometry.
        const S = 200;
        canvas.width = S;
        canvas.height = Math.max(1, Math.round((h / w) * S));
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no ctx");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const cw = canvas.width;
        const ch = canvas.height;

        const isWhiteish = (r: number, g: number, b: number) =>
          r > 225 && g > 225 && b > 225 && Math.abs(r - g) < 12 && Math.abs(g - b) < 12;

        // Largest rectangle of white rows (simple scanline union approach).
        // For each row record runs of white; then find the tallest+widest
        // region by counting white pixels in a coarse grid.
        const cols = cw;
        const rows = ch;
        const whiteCount = new Uint32Array(cols);
        const whiteRows = new Uint32Array(rows);
        for (let y = 0; y < rows; y++) {
          let run = 0;
          for (let x = 0; x < cols; x++) {
            const i = (y * cols + x) * 4;
            if (isWhiteish(data[i], data[i + 1], data[i + 2])) {
              whiteCount[x] += 1;
              run += 1;
            } else {
              run = 0;
            }
          }
          whiteRows[y] = run;
        }

        // Find the bounding box of the densest white block.
        let bestArea = 0;
        let best = { x0: 0, y0: 0, x1: 0, y1: 0 };
        for (let y0 = 0; y0 < rows; y0++) {
          for (let y1 = rows - 1; y1 > y0; y1--) {
            const rowSpan = y1 - y0;
            if (rowSpan < 2) break;
            // count columns that are fully white across this band
            let x0 = -1;
            for (let x = 0; x < cols; x++) {
              const full = (() => {
                for (let y = y0; y <= y1; y++) {
                  const i = (y * cols + x) * 4;
                  if (!isWhiteish(data[i], data[i + 1], data[i + 2])) return false;
                }
                return true;
              })();
              if (full && x0 === -1) x0 = x;
              if (!full && x0 !== -1) {
                const area = rowSpan * (x - x0);
                if (area > bestArea && x - x0 > 2) {
                  bestArea = area;
                  best = { x0, y0, x1: x, y1 };
                }
                x0 = -1;
              }
            }
            if (x0 !== -1) {
              const area = rowSpan * (cols - x0);
              if (area > bestArea && cols - x0 > 2) {
                bestArea = area;
                best = { x0, y0, x1: cols, y1 };
              }
            }
          }
        }

        if (bestArea <= 0) {
          if (!cancelled) setBox(null);
          return;
        }

        const bw = best.x1 - best.x0;
        const bh = best.y1 - best.y0;

        if (!cancelled) {
          setBox({
            left: ((best.x0 + bw / 2) / cw) * 100,
            top: ((best.y0 + bh / 2) / ch) * 100,
            // The QR is square; scale from the dominant dimension.
            width: Math.max(bw, bh) / cw * 100,
          });
        }
      } catch {
        // tainted canvas, missing image, CORS — fall back to a sane default
        if (!cancelled) setBox(null);
      }
    }

    detect();
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return box;
}
