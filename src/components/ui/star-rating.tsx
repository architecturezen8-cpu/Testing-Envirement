import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: number;
  className?: string;
}

export function StarRating({
  rating,
  max = 5,
  size = 16,
  className,
}: StarRatingProps) {
  return (
    <div className={cn("flex items-center", className)} aria-label={`Rated ${rating} out of ${max}`}>
      {Array.from({ length: max }).map((_, i) => {
        const fill = Math.min(Math.max(rating - i, 0), 1);
        return (
          <div key={i} className="relative" style={{ width: size, height: size }}>
            <Star
              size={size}
              className="absolute text-ink/15"
              fill="currentColor"
              strokeWidth={0}
            />
            <div
              className="absolute overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star
                size={size}
                className="text-bronze"
                fill="currentColor"
                strokeWidth={0}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
