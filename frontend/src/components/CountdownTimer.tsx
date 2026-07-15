'use client';

import { useEffect, useState } from 'react';

interface Props { endTime: string; }

interface TimeLeft { hours: number; minutes: number; seconds: number; }

function calcTimeLeft(endTime: string): TimeLeft | null {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    hours:   Math.floor(diff / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  };
}

export default function CountdownTimer({ endTime }: Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(calcTimeLeft(endTime));

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(calcTimeLeft(endTime)), 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (!timeLeft) return <span className="text-red-500 font-semibold text-sm">Berakhir</span>;

  const pad = (n: number) => String(n).padStart(2, '0');
  const segments = [
    { value: pad(timeLeft.hours),   label: 'Jam' },
    { value: pad(timeLeft.minutes), label: 'Menit' },
    { value: pad(timeLeft.seconds), label: 'Detik' },
  ];

  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      {segments.map(({ value, label }, i) => (
        <span key={label} className="flex items-center gap-0.5 sm:gap-1.5">
          <span className="bg-gray-900 text-white text-xs sm:text-sm font-mono font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg min-w-[2rem] sm:min-w-[2.5rem] text-center">
            {value}
          </span>
          <span className="text-[10px] sm:text-xs text-gray-500 hidden sm:inline">{label}</span>
          {i < 2 && <span className="font-bold text-gray-400 text-xs sm:text-base">:</span>}
        </span>
      ))}
    </div>
  );
}
