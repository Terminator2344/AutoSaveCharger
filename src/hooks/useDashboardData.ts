"use client";

import { useCallback, useMemo, useState } from "react";
import { faker } from "@faker-js/faker";
import { addDays, endOfDay, startOfDay, subDays } from "date-fns";

export type DateRange = {
  from: Date | null;
  to: Date | null;
};

export type EventType =
  | "payment_failed"
  | "payment_succeeded"
  | "recovered_by_click";

export type Channel = "Email" | "Telegram" | "Discord" | "Other";

export type EventItem = {
  id: string;
  date: Date;
  user: string;
  type: EventType;
  channel: Channel;
  status: "failed" | "recovered" | "succeeded";
};

export type LineDatum = { date: Date; value: number };
export type DualBarDatum = { date: Date; failed: number; recovered: number };
export type RateDatum = { date: Date; rate: number; avg: number };
export type PieDatum = { name: Channel; value: number };

export type DashboardData = {
  revenueOverTime: LineDatum[];
  failuresVsRecoveries: DualBarDatum[];
  recoveryRateOverTime: RateDatum[];
  channelEfficiency: PieDatum[];
  events: EventItem[];
};

function generateSeries(days: number): DashboardData {
  const start = startOfDay(subDays(new Date(), days - 1));
  const revenueOverTime: LineDatum[] = [];
  const failuresVsRecoveries: DualBarDatum[] = [];
  const recoveryRateOverTime: RateDatum[] = [];
  const channelTotals: Record<Channel, number> = {
    Email: 0,
    Telegram: 0,
    Discord: 0,
    Other: 0,
  };
  const events: EventItem[] = [];

  let rollingAvg = 0;
  const alpha = 0.2; // smoothing

  for (let i = 0; i < days; i++) {
    const date = addDays(start, i);
    const baseRevenue = faker.number.int({ min: 1200, max: 4200 });
    const noise = faker.number.int({ min: -250, max: 250 });
    const revenue = Math.max(200, baseRevenue + noise);
    revenueOverTime.push({ date, value: revenue });

    const failed = faker.number.int({ min: 30, max: 140 });
    const recovered = faker.number.int({ min: Math.floor(failed * 0.3), max: Math.floor(failed * 0.9) });
    failuresVsRecoveries.push({ date, failed, recovered });

    const rate = Math.round((recovered / Math.max(1, failed)) * 100);
    rollingAvg = Math.round(alpha * rate + (1 - alpha) * rollingAvg);
    recoveryRateOverTime.push({ date, rate, avg: rollingAvg });

    // attribute recovered to channels
    const recoveredByChannel: Channel[] = ["Email", "Telegram", "Discord", "Other"];
    let remaining = recovered;
    for (let c = 0; c < recoveredByChannel.length; c++) {
      const portion = c === recoveredByChannel.length - 1 ? remaining : Math.max(0, Math.round(remaining * faker.number.float({ min: 0.1, max: 0.5 })));
      remaining -= portion;
      channelTotals[recoveredByChannel[c]] += portion;
    }

    // events for the day
    const eventCount = faker.number.int({ min: 6, max: 18 });
    for (let e = 0; e < eventCount; e++) {
      const type: EventType = faker.helpers.arrayElement([
        "payment_failed",
        "payment_succeeded",
        "recovered_by_click",
      ]);
      const channel: Channel = faker.helpers.arrayElement([
        "Email",
        "Telegram",
        "Discord",
        "Other",
      ]);
      events.push({
        id: faker.string.uuid(),
        date: addDays(date, 0),
        user: faker.internet.username(),
        type,
        channel,
        status:
          type === "payment_failed"
            ? "failed"
            : type === "payment_succeeded"
            ? "succeeded"
            : "recovered",
      });
    }
  }

  const channelEfficiency: PieDatum[] = (Object.keys(channelTotals) as Channel[]).map(
    (name) => ({ name, value: channelTotals[name] })
  );

  return {
    revenueOverTime,
    failuresVsRecoveries,
    recoveryRateOverTime,
    channelEfficiency,
    events,
  };
}

function filterByRange<T extends { date: Date }>(items: T[], range: DateRange): T[] {
  if (!range.from || !range.to) return items;
  const from = startOfDay(range.from).getTime();
  const to = endOfDay(range.to).getTime();
  return items.filter((i) => {
    const t = i.date.getTime();
    return t >= from && t <= to;
  });
}

export function useDashboardData() {
  const [range, setRange] = useState<DateRange>({ from: subDays(new Date(), 29), to: new Date() });
  const [seed] = useState<string>(() => faker.string.uuid());

  const baseData = useMemo(() => {
    faker.seed(seed.split("-").join("").length);
    return generateSeries(120);
  }, [seed]);

  const filtered = useMemo<DashboardData>(() => {
    return {
      revenueOverTime: filterByRange(baseData.revenueOverTime, range),
      failuresVsRecoveries: filterByRange(baseData.failuresVsRecoveries, range),
      recoveryRateOverTime: filterByRange(baseData.recoveryRateOverTime, range),
      channelEfficiency: baseData.channelEfficiency,
      events: filterByRange(baseData.events, range),
    };
  }, [baseData, range]);

  const metrics = useMemo(() => {
    const failed = filtered.failuresVsRecoveries.reduce((s, d) => s + d.failed, 0);
    const recovered = filtered.failuresVsRecoveries.reduce((s, d) => s + d.recovered, 0);
    const revenue = filtered.revenueOverTime.reduce((s, d) => s + d.value, 0);
    const recoveryRate = failed > 0 ? Math.round((recovered / failed) * 100) : 0;
    const topChannel = [...(baseData.channelEfficiency || [])].sort((a, b) => b.value - a.value)[0]?.name || "Email";
    const activeUsers = Math.max(12, Math.round(filtered.events.length * 0.3));
    return { failed, recovered, revenue, recoveryRate, topChannel, activeUsers };
  }, [filtered, baseData]);

  const filterDataByRange = useCallback((next: DateRange) => setRange(next), []);

  return { range, setRange, filterDataByRange, data: filtered, metrics };
}


















