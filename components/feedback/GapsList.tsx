// components/feedback/GapsList.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

type Gap = { message: string; severity: "low" | "medium" | "high" };

export function GapsList({ gaps }: { gaps: string[] }) {
  if (!gaps || gaps.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Suggested Improvements</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No specific improvement areas detected. Great job!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Suggested Improvements</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {gaps.map((gapMessage, index) => (
          <div key={index} className="flex items-start space-x-3">
            <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-1" />
            <p className="text-sm text-muted-foreground">{gapMessage}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}