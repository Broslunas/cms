"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, Clock, ChevronLeft, ChevronRight, X } from "lucide-react";

interface DateTimePickerProps {
  value: string; // ISO string
  onChange: (isoString: string) => void;
  label?: string;
}

const DAYS_OF_WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function DateTimePicker({ value, onChange, label }: DateTimePickerProps) {
  const dateObj = new Date(value);
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(dateObj.getFullYear());
  const [viewMonth, setViewMonth] = useState(dateObj.getMonth());
  const containerRef = useRef<HTMLDivElement>(null);

  // Selected date/time state derived from value
  const selectedYear = dateObj.getFullYear();
  const selectedMonth = dateObj.getMonth();
  const selectedDay = dateObj.getDate();
  const selectedHour = dateObj.getHours();
  const selectedMinute = dateObj.getMinutes();
  const selectedSecond = dateObj.getSeconds();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Build the calendar grid
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  // getDay() returns 0=Sun, we want Mon=0
  let startDow = firstDayOfMonth.getDay() - 1;
  if (startDow < 0) startDow = 6;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarCells: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = [];
  // Fill leading days from previous month
  for (let i = startDow - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    calendarCells.push({ day: d, month: m, year: y, isCurrentMonth: false });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({ day: d, month: viewMonth, year: viewYear, isCurrentMonth: true });
  }
  // Fill trailing days
  const remainingCells = 42 - calendarCells.length; // 6 rows * 7
  for (let d = 1; d <= remainingCells; d++) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    calendarCells.push({ day: d, month: m, year: y, isCurrentMonth: false });
  }

  const rows: typeof calendarCells[] = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    rows.push(calendarCells.slice(i, i + 7));
  }

  // Today
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  function handleDayClick(cell: typeof calendarCells[0]) {
    const newDate = new Date(cell.year, cell.month, cell.day, selectedHour, selectedMinute, selectedSecond);
    onChange(newDate.toISOString());
    setViewMonth(cell.month);
    setViewYear(cell.year);
  }

  function handleTimeChange(type: "hour" | "minute" | "second", val: number) {
    const d = new Date(value);
    if (type === "hour") d.setHours(val);
    if (type === "minute") d.setMinutes(val);
    if (type === "second") d.setSeconds(val);
    onChange(d.toISOString());
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  function setNow() {
    onChange(new Date().toISOString());
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  }

  // Formatted display
  const displayDate = dateObj.toLocaleDateString("en-US", {
    weekday: "short", year: "numeric", month: "short", day: "numeric"
  });
  const displayTime = dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  });

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-background border border-input rounded-md text-foreground hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring text-sm transition-all group"
      >
        <Calendar className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="flex-1 text-left">{displayDate}</span>
        <span className="text-muted-foreground font-mono text-xs">{displayTime}</span>
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 w-[280px] bg-card border border-border rounded-lg shadow-xl shadow-black/15 animate-in fade-in-0 slide-in-from-top-2 duration-200 overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border">
            <button
              onClick={prevMonth}
              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              type="button"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-semibold text-foreground">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              type="button"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 px-2 pt-2 pb-0.5">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="text-center text-[9px] font-semibold text-muted-foreground uppercase tracking-wider py-0.5">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="px-2 pb-2">
            {rows.map((row, ri) => (
              <div key={ri} className="grid grid-cols-7 gap-0.5">
                {row.map((cell, ci) => {
                  const isSelected = cell.day === selectedDay && cell.month === selectedMonth && cell.year === selectedYear;
                  const isToday = cell.day === todayDay && cell.month === todayMonth && cell.year === todayYear;
                  return (
                    <button
                      key={ci}
                      type="button"
                      onClick={() => handleDayClick(cell)}
                      className={`
                        w-full h-7 flex items-center justify-center text-[11px] rounded transition-all duration-100
                        ${!cell.isCurrentMonth ? "text-muted-foreground/40" : "text-foreground"}
                        ${isSelected
                          ? "bg-primary text-primary-foreground font-bold shadow-sm shadow-primary/30"
                          : "hover:bg-muted/80"
                        }
                        ${isToday && !isSelected ? "font-bold ring-1 ring-primary/50" : ""}
                      `}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Time picker */}
          <div className="px-3 py-2 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <div className="flex items-center gap-0.5 flex-1">
              <TimeInput value={selectedHour} max={23} onChange={(v) => handleTimeChange("hour", v)} label="HH" />
              <span className="text-muted-foreground font-bold text-xs">:</span>
              <TimeInput value={selectedMinute} max={59} onChange={(v) => handleTimeChange("minute", v)} label="MM" />
              <span className="text-muted-foreground font-bold text-xs">:</span>
              <TimeInput value={selectedSecond} max={59} onChange={(v) => handleTimeChange("second", v)} label="SS" />
            </div>
            <button
              type="button"
              onClick={setNow}
              className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-primary/10 text-primary hover:bg-primary/20 rounded transition-colors"
            >
              Now
            </button>
          </div>

          {/* Raw ISO value */}
          <div className="px-3 py-1.5 bg-muted/20 border-t border-border">
            <p className="text-[9px] text-muted-foreground font-mono truncate">{value}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Time Input Spinner ---
function TimeInput({ value, max, onChange, label }: { value: number; max: number; onChange: (v: number) => void; label: string }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(String(value).padStart(2, "0"));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setText(String(value).padStart(2, "0"));
    }
  }, [value, editing]);

  function commit() {
    setEditing(false);
    let n = parseInt(text, 10);
    if (isNaN(n) || n < 0) n = 0;
    if (n > max) n = max;
    onChange(n);
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={editing ? text : String(value).padStart(2, "0")}
        onFocus={() => { setEditing(true); setText(String(value).padStart(2, "0")); inputRef.current?.select(); }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { commit(); inputRef.current?.blur(); }
          if (e.key === "ArrowUp") { e.preventDefault(); onChange(value >= max ? 0 : value + 1); }
          if (e.key === "ArrowDown") { e.preventDefault(); onChange(value <= 0 ? max : value - 1); }
        }}
        onChange={(e) => setText(e.target.value)}
        className="w-7 text-center text-xs font-mono bg-muted/50 border border-border rounded px-0.5 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
        maxLength={2}
      />
    </div>
  );
}
