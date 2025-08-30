// app/dashboard/practice/CameraPanel.tsx
'use client';

import React from 'react';
import { Loader2, CameraOff } from 'lucide-react';

interface CameraPanelProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isModelLoaded: boolean;
  isProcessing: boolean;
}

export function CameraPanel({ videoRef, isModelLoaded, isProcessing }: CameraPanelProps) {
  return (
    <div className="h-full w-full bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover transform -scale-x-100"
      />
      {/* Overlay */}
      {!isProcessing ? (
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4 text-center">
            <CameraOff className="h-10 w-10" />
            <p className="mt-2">Camera is Off</p>
         </div>
      ) : !isModelLoaded ? (
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p>Initializing AI Coach...</p>
         </div>
      ) : null}
    </div>
  );
}