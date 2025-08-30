// components/feedback/TimelineChart.tsx
"use client";

import { Line } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Chart as ChartJS,
  LineElement, PointElement,
  CategoryScale, LinearScale, Tooltip, Legend
} from "chart.js";
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

function downsample(timeline: { t: number; probs: number[] }[], maxPoints = 200) {
  if (timeline.length <= maxPoints) return timeline;
  const step = Math.ceil(timeline.length / maxPoints);
  return timeline.filter((_, i) => i % step === 0);
}

export function TimelineChart({
  labels,
  timeline
}: {
  labels: string[];
  timeline: { t: number; probs: number[] }[];
}) {
  const sampled = downsample(timeline, 300); 
  const times = sampled.map(p => p.t.toFixed(1));
  const datasets = labels.map((cls, i) => ({
    label: `${cls} prob`,
    data: sampled.map(p => (p.probs[i] ?? 0)),
    fill: false,
    tension: 0.2,
    pointRadius: 0,
    borderWidth: 1
  }));

  const data = { labels: times, datasets };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" as const } },
    scales: {
      x: { ticks: { maxTicksLimit: 10 } },
      y: { min: 0, max: 1, ticks: { callback: (v: any) => v.toFixed?.(1) ?? v } }
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Probabilities over Time</CardTitle></CardHeader>
      <CardContent style={{ height: 300 }}>
        <Line data={data as any} options={options as any} />
      </CardContent>
    </Card>
  );
}
