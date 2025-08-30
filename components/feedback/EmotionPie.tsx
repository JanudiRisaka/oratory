// components/feedback/EmotionPie.tsx
"use client";

import { Pie } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

const emotionColors: Record<string, string> = {
  happy:    'rgba(74, 222, 128, 0.8)',    // Green
  sad:      'rgba(96, 165, 250, 0.8)',    // Blue
  surprise: 'rgba(250, 204, 21, 0.8)',    // Yellow
  neutral:  'rgba(156, 163, 175, 0.8)',   // Gray
  yawning:  'rgba(244, 114, 182, 0.8)',   // Pink (for distinction)
};

const emotionBorderColors: Record<string, string> = {
  happy:    'rgba(34, 197, 94, 1)',
  sad:      'rgba(59, 130, 246, 1)',
  surprise: 'rgba(234, 179, 8, 1)',
  neutral:  'rgba(107, 114, 128, 1)',
  yawning:  'rgba(236, 72, 153, 1)',
};

export function EmotionPie({ labels, durationsSec }: { labels: string[]; durationsSec: Record<string, number> }) {

  const raw = labels.map(l => durationsSec[l] ?? 0);
  const total = raw.reduce((s, v) => s + v, 0);

  if (total <= 0.0001) {
    return (
      <Card>
        <CardHeader><CardTitle>Emotion Breakdown (Duration)</CardTitle></CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No emotion duration data available for this session.</div>
        </CardContent>
      </Card>
    );
  }

  const percentData = raw.map(v => +(v / total * 100).toFixed(1));

  const data = {
    labels,
    datasets: [
      {
        label: "Duration (%)",
        data: percentData,
        backgroundColor: labels.map(label => emotionColors[label] || 'rgba(209, 213, 219, 0.8)'),
        borderColor: labels.map(label => emotionBorderColors[label] || 'rgba(156, 163, 175, 1)'),
        borderWidth: 1
      }
    ]
  };

  const options = {
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const idx = ctx.dataIndex;
            const label = ctx.chart.data.labels[idx] ?? "";
            const pct = ctx.raw;
            const seconds = raw[idx];
            return `${label}: ${pct}% (${seconds.toFixed(1)}s)`;
          }
        }
      }
    }
  };

  return (
    <div>
      <CardHeader><CardTitle>Emotion Breakdown</CardTitle></CardHeader>
      <CardContent className="content-center ">
        <Pie data={data} options={options as any} />
      </CardContent>
    </div>
  );
}
