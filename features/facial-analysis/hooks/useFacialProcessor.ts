// features/facial-analysis/hooks/useFacialProcessor.ts

import { useState, useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import { AnalysisEngine } from '@/features/facial-analysis/engine/AnalysisEngine';

let faceLandmarker: FaceLandmarker | undefined = undefined;

let frameCounter = 0;
const ANALYSIS_INTERVAL = 2;
export function useFacialProcessor(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  analysisEngineRef: React.RefObject<AnalysisEngine | null>
) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<FaceLandmarkerResult | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const requestRef = useRef<number | null>(null);
  let lastVideoTime = -1;

  useEffect(() => {
    const createFaceLandmarker = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
        faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU",
          },
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
          runningMode: "VIDEO",
          numFaces: 1,
        });
        setIsLoaded(true);
      } catch (e: any) {
        setError("AI model failed to load. Please check your network or browser settings.");
      }
    };
    if (!faceLandmarker) createFaceLandmarker();
    else setIsLoaded(true);
  }, []);

  const startProcessing = async () => {
    if (isProcessing || !isLoaded || !videoRef.current) return;
    setError(null);
    try {
      const constraints = { video: { width: { ideal: 640 }, height: { ideal: 480 } } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;
      videoRef.current.addEventListener("loadeddata", () => {
        setIsProcessing(true);
      });
    } catch (err) {
      setError("Webcam access was denied. Please grant permission.");
    }
  };

  const stopProcessing = () => {
    if (!isProcessing || !videoRef.current) return;
    const stream = videoRef.current.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsProcessing(false);
    setLatestResult(null);
  };

  useEffect(() => {
    const predictWebcam = () => {
      if (!videoRef.current || !faceLandmarker || !analysisEngineRef.current) {
        requestRef.current = requestAnimationFrame(predictWebcam);
        return;
      }
      const video = videoRef.current;
      if (video.paused || video.ended || video.readyState < 3) {
        requestRef.current = requestAnimationFrame(predictWebcam);
        return;
      }

      frameCounter++;

      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;

        if (frameCounter % ANALYSIS_INTERVAL === 0) {
          const results = faceLandmarker.detectForVideo(video, performance.now());
          analysisEngineRef.current.processFrame(results);
          setLatestResult(results);
        }
      }
      requestRef.current = requestAnimationFrame(predictWebcam);
    };

    if (isProcessing && isLoaded) {
      predictWebcam();
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isProcessing, isLoaded, videoRef, analysisEngineRef]);

  return {
      isLoaded,
      error,
      latestResult,
      isProcessing,
      startProcessing,
      stopProcessing
  };
}