// components/feedback/KeyMoments.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Film } from "lucide-react";

type RawItem = {
  t?: number;
  tStart?: number;
  tEnd?: number;
  label: string;
  note?: string;
  thumb_b64?: string | null;
  clip_url?: string | null;
};

export function KeyMoments({ items }: { items: RawItem[] }) {
  const [playingClip, setPlayingClip] = useState<string | null>(null);

  const handlePlayClip = (clipUrl: string | null | undefined) => {
    if (clipUrl) {
      setPlayingClip(clipUrl);
    }
  };

  const norm = items.map(it => {
    const tStart = it.tStart ?? (it.t ?? 0);
    const tEnd = it.tEnd ?? (it.t ? it.t + 2.0 : tStart + 2.0);
    return { tStart, tEnd, label: it.label, note: it.note ?? "", thumb_b64: it.thumb_b64, clip_url: it.clip_url };
  });

  return (
    <Card>
      <CardHeader><CardTitle>Key Moments</CardTitle></CardHeader>
      <CardContent className="space-y-4"> {/* Increased spacing slightly */}
        {norm.length === 0 ? (
          <div className="text-sm text-muted-foreground">No strong, sustained expressions detected.</div>
        ) : norm.map((m, idx) => (
          <div key={idx} className="text-sm flex items-start space-x-3">
            {m.thumb_b64 ? (
              <div style={{ width: 96, minWidth: 96 }}>
                <img src={m.thumb_b64} alt={`${m.label} thumbnail`} className="rounded" />
              </div>
            ) : (
              <div className="flex-shrink-0 pt-1">
                <Film className="w-4 h-4 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1">
              <div className="font-medium capitalize">{m.label} <span className="text-xs text-muted-foreground">({m.tStart.toFixed(1)}s → {m.tEnd.toFixed(1)}s)</span></div>
              <div className="text-muted-foreground">{m.note}</div>
              {m.clip_url && (
                <div className="mt-2">
                  <button className="text-xs text-primary hover:underline" onClick={() => handlePlayClip(m.clip_url)}>
                    Play clip
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {playingClip && (
          <div className="mt-4">
            <video src={playingClip} controls autoPlay onEnded={() => setPlayingClip(null)} className="w-full rounded" />
            <div className="text-right mt-2">
              <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setPlayingClip(null)}>Close</button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}