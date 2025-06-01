
"use client";

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingInputProps {
  count?: number;
  value: number;
  onChange: (rating: number) => void;
  size?: number;
  className?: string;
  disabled?: boolean;
}

export default function StarRatingInput({
  count = 5,
  value = 0,
  onChange,
  size = 24,
  className,
  disabled = false,
}: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = useState<number | undefined>(undefined);

  const stars = Array(count).fill(0);

  const handleClick = (newValue: number) => {
    if (disabled) return;
    onChange(newValue);
  };

  const handleMouseOver = (newHoverValue: number) => {
    if (disabled) return;
    setHoverValue(newHoverValue);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    setHoverValue(undefined);
  };

  return (
    <div className={cn("flex items-center space-x-1", className, disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer")}>
      {stars.map((_, index) => {
        const starValue = index + 1;
        return (
          <Star
            key={starValue}
            size={size}
            className={cn(
              "transition-colors",
              (hoverValue || value) >= starValue ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'
            )}
            onClick={() => handleClick(starValue)}
            onMouseOver={() => handleMouseOver(starValue)}
            onMouseLeave={handleMouseLeave}
          />
        );
      })}
    </div>
  );
}
