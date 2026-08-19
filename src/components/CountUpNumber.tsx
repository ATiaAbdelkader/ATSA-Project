import React, { useEffect, useRef, useState } from 'react';

interface CountUpNumberProps {
  value: number;
  duration?: number; // duration in ms, default 1200
  decimals?: number; // number of decimal places, default 0
  className?: string;
  prefix?: string;
  suffix?: string;
  startFromZeroOnMount?: boolean;
}

export const CountUpNumber: React.FC<CountUpNumberProps> = ({
  value,
  duration = 1200,
  decimals = 0,
  className = '',
  prefix = '',
  suffix = '',
  startFromZeroOnMount = true,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(() => {
    return startFromZeroOnMount ? 0 : value;
  });

  const prevValueRef = useRef<number>(startFromZeroOnMount ? 0 : value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const targetValue = isNaN(value) ? 0 : value;
    const startTime = performance.now();

    if (startValue === targetValue) {
      setDisplayValue(targetValue);
      return;
    }

    const easeOutExpo = (t: number): number => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);

      const currentNumber = startValue + (targetValue - startValue) * easedProgress;
      setDisplayValue(currentNumber);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetValue);
        prevValueRef.current = targetValue;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration, decimals]);

  const formatted = Number(displayValue).toFixed(decimals);

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
