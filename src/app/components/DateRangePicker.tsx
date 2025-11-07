"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "@/hooks/useDashboardData";

type Props = {
  value: DateRange;
  onChange: (range: DateRange) => void;
};

export default function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const label = useMemo(() => {
    if (value.from && value.to) return `${format(value.from, "MMM d, yyyy")} – ${format(value.to, "MMM d, yyyy")}`;
    return "Select range";
  }, [value]);

  function setPreset(preset: "today" | "7" | "30") {
    const now = new Date();
    if (preset === "today") {
      onChange({ from: now, to: now });
    } else if (preset === "7") {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      onChange({ from, to: now });
    } else {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      onChange({ from, to: now });
    }
    setOpen(false);
  }

  function onCustomChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fromStr = String(fd.get("from") || "");
    const toStr = String(fd.get("to") || "");
    const from = fromStr ? new Date(fromStr) : null;
    const to = toStr ? new Date(toStr) : null;
    onChange({ from, to });
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-2 rounded-md bg-gradient-to-r from-[#ff7a00] to-[#ffb347] text-black font-semibold shadow-[0_0_10px_rgba(255,140,0,0.5)] hover:brightness-110 transition"
      >
        {label}
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-[320px] border border-orange-700/40 rounded-xl bg-[rgba(20,10,0,0.9)] backdrop-blur-md text-orange-100 shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-3 z-50">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button onClick={() => setPreset("today")} className="px-2 py-2 rounded-md bg-[rgba(255,140,0,0.12)] hover:bg-[rgba(255,140,0,0.2)] transition">Today</button>
            <button onClick={() => setPreset("7")} className="px-2 py-2 rounded-md bg-[rgba(255,140,0,0.12)] hover:bg-[rgba(255,140,0,0.2)] transition">Last 7 days</button>
            <button onClick={() => setPreset("30")} className="px-2 py-2 rounded-md bg-[rgba(255,140,0,0.12)] hover:bg-[rgba(255,140,0,0.2)] transition">Last 30 days</button>
          </div>
          <form onSubmit={onCustomChange} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-orange-300/80">From</label>
                <input name="from" type="date" className="px-2 py-2 rounded-md bg-black/30 border border-orange-700/40 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-orange-300/80">To</label>
                <input name="to" type="date" className="px-2 py-2 rounded-md bg-black/30 border border-orange-700/40 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md border border-orange-800/40 text-orange-200 hover:bg-orange-800/10">Cancel</button>
              <button type="submit" className="px-3 py-2 rounded-md bg-gradient-to-r from-[#ff7a00] to-[#ffb347] text-black font-semibold">Apply</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

















