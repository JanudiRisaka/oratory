// components/feedback/OverallScores.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Bar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="h-2 w-full rounded bg-muted" aria-hidden>
      <div className="h-2 rounded bg-primary" style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function OverallScores({
  expressiveness,
  steadiness,
  positivity
}: { expressiveness: number; steadiness: number; positivity: number }) {
  return (
    <Card>
      <CardHeader><CardTitle>Overall Scores</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1"><span>Expressiveness</span><span>{Math.round(expressiveness)}%</span></div>
          <Bar value={expressiveness} />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1"><span>Steadiness</span><span>{Math.round(steadiness)}%</span></div>
          <Bar value={steadiness} />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1"><span>Positivity</span><span>{Math.round(positivity)}%</span></div>
          <Bar value={positivity} />
        </div>
      </CardContent>
    </Card>
  );
}
