//components/progress/ProgressCharts.tsx
"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";

import type { SessionData, FeedbackHistoryItem } from "@/features/facial-analysis/types";

function pickNumber(obj: any, paths: string[]): number | undefined {
  for (const p of paths) {
    const value = p.split(".").reduce<any>((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
    if (typeof value === "number" && !Number.isNaN(value)) return value;
  }
  return undefined;
}

function getDurationMinutes(session: SessionData): number {
  const sr: any = (session as any).summaryReport ?? {};
  const dr: any = (session as any).detailedReport ?? {};
  const ms =
    pickNumber({ sr, dr }, ["sr.totalDurationMs", "sr.durationMs", "dr.totalDurationMs", "dr.durationMs"]) ??
    (pickNumber(
      { sr, dr },
      ["sr.totalDurationSec", "sr.durationSec", "sr.speakingTimeSec", "dr.totalDurationSec", "dr.durationSec"]
    ) ?? 0) * 1000;
  const minutes = Math.round((ms || 0) / 60000);
  return Number.isFinite(minutes) ? minutes : 0;
}

function labelDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ProgressCharts({
  sessions,
  history,
}: {
  sessions: SessionData[];
  history: FeedbackHistoryItem[];
}) {
  const scoreSeries = useMemo(() => {
    const sorted = [...(history ?? [])].sort(
      (a, b) => new Date(a.createdAt as any).getTime() - new Date(b.createdAt as any).getTime()
    );
    const points = sorted.map((item) => {
      const overall =
        pickNumber(item, ["overallScore", "scores.overall", "summary.overallScore", "summaryReport.overallScore"]) ??
        null;

      let avg: number | null = null;
      if (overall == null) {
        const nums: number[] = [];
        const walk = (o: any) => {
          if (!o || typeof o !== "object") return;
          for (const v of Object.values(o)) {
            if (typeof v === "number" && Number.isFinite(v)) nums.push(v);
            else if (v && typeof v === "object") walk(v);
          }
        };
        walk(item);
        if (nums.length) avg = Math.round(nums.reduce((s, v) => s + v, 0) / nums.length);
      }

      const date = new Date((item as any).createdAt);
      const label = labelDate(date);
      return { date: label, score: overall ?? avg ?? null };
    });
    return points.filter((p) => p.score != null).slice(-12);
  }, [history]);

  const weeklyBars = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const buckets = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const key = d.toDateString();
      return { key, day: days[d.getDay()], sessions: 0, minutes: 0 };
    });

    (sessions ?? []).forEach((s) => {
      const created: any = (s as any).createdAt;
      const d: Date = created?.toDate ? created.toDate() : new Date(created);
      if (!d || Number.isNaN(d.getTime())) return;
      const b = buckets.find((x) => x.key === d.toDateString());
      if (b) {
        b.sessions += 1;
        b.minutes += getDurationMinutes(s);
      }
    });
    return buckets.map(({ day, sessions, minutes }) => ({ day, sessions, minutes }));
  }, [sessions]);

  const scenarioBars = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const map = new Map<string, number>();
    (sessions ?? []).forEach((s) => {
      const created: any = (s as any).createdAt;
      const d: Date = created?.toDate ? created.toDate() : new Date(created);
      if (!d || d < cutoff) return;
      const mins = getDurationMinutes(s);
      const id = (s as any).scenarioId ?? "unknown";
      map.set(id, (map.get(id) ?? 0) + mins);
    });
    return Array.from(map.entries())
      .map(([scenario, minutes]) => ({ scenario, minutes }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 6);
  }, [sessions]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Overall Score Trend */}
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Overall Score Trend</CardTitle>
          <CardDescription>Based on your recent feedback reports</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          {scoreSeries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No feedback scores yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scoreSeries}>
                <defs>
                  <linearGradient id="score" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Area type="monotone" dataKey="score" stroke="var(--primary)" fill="url(#score)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Weekly Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Activity</CardTitle>
          <CardDescription>Sessions & minutes in the last 7 days</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyBars}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="sessions" name="Sessions" />
              <Bar yAxisId="right" dataKey="minutes" name="Minutes" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Scenario Mix (last 30 days) */}
      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle>Scenario Mix (Last 30 Days)</CardTitle>
          <CardDescription>Where your practice time went, by scenario</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          {scenarioBars.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent sessions found.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scenarioBars}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="scenario" />
                <YAxis />
                <Tooltip formatter={(v) => `${v} min`} />
                <Bar dataKey="minutes" name="Minutes" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
