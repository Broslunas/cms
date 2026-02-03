"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownProps {
  targetDate: Date;
  className?: string;
}

export function Countdown({ targetDate, className }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +targetDate - +new Date();
      
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8", className)}>
      <TimeUnit value={timeLeft.days} label="Días" />
      <TimeUnit value={timeLeft.hours} label="Horas" />
      <TimeUnit value={timeLeft.minutes} label="Minutos" />
      <TimeUnit value={timeLeft.seconds} label="Segundos" />
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="relative group">
      {/* Glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
      
      {/* Glass card */}
      <div className="relative glass-strong rounded-2xl p-6 md:p-8 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 hover:scale-105 border-emerald-500/20">
        <div className="text-5xl md:text-7xl font-black bg-gradient-to-br from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent font-mono tabular-nums drop-shadow-lg">
          {value.toString().padStart(2, "0")}
        </div>
        <div className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-[0.2em] mt-3">
          {label}
        </div>
      </div>
    </div>
  );
}
