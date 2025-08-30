// features/facial-analysis/engine/fileProcessor.ts

import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import { InferenceSession, Tensor, env as ortEnv } from "onnxruntime-web";
import { AnalysisEngine } from "./AnalysisEngine";
import type { BackendReport, DetailedReport } from "@/features/facial-analysis/types";

let emotionSession: InferenceSession | undefined = undefined;
let faceDetector: FaceDetector | undefined = undefined;

const EMOTION_LABELS = ['happy', 'neutral', 'sad', 'surprise', 'yawning'];
const MODEL_INPUT_SHAPE = [224, 224];

const MEAN = [0.485, 0.456, 0.406];
const STD  = [0.229, 0.224, 0.225];

async function initializeModels() {
  if (emotionSession && faceDetector) return;
  try {
    console.log("Initializing ONNX session (single model) and face detector...");

    ortEnv.wasm.wasmPaths = "/wasm/";

    const sessionOptions: InferenceSession.SessionOptions = {
      executionProviders: ['webgpu', 'webgl', 'wasm'],
      graphOptimizationLevel: 'all'
    };
    const modelPath = '/models/resnet50.onnx';

    const [session, detector] = await Promise.all([
      InferenceSession.create(modelPath, sessionOptions),
      FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm")
        .then(resolver => FaceDetector.createFromOptions(resolver, {
            baseOptions: { modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite` },
            runningMode: "IMAGE"
        }))
    ]);

    emotionSession = session;
    faceDetector = detector;
    console.log(`ONNX session initialized with provider: ${sessionOptions.executionProviders?.[0]}`);

    const dummyInput = new Tensor('float32', new Float32Array(1 * 3 * MODEL_INPUT_SHAPE[0] * MODEL_INPUT_SHAPE[1]), [1, 3, ...MODEL_INPUT_SHAPE]);
    const inputName = session.inputNames[0];
    await session.run({ [inputName]: dummyInput });
    console.log("ONNX model warm-up complete.");

  } catch (e) {
    console.error("Failed to initialize models:", e);
    throw new Error("Could not load AI models for analysis.");
  }
}

export async function processUploadedVideo(
  videoFile: File
): Promise<{ backendReport: BackendReport, detailedReport: DetailedReport }> {
  await initializeModels();
  if (!emotionSession || !faceDetector) {
    throw new Error("Models are not initialized.");
  }

  const analysisEngine = new AnalysisEngine();
  const video = document.createElement("video");
  video.preload = "auto";
  video.src = URL.createObjectURL(videoFile);
  video.muted = true;
  video.playsInline = true;

  return new Promise((resolve, reject) => {
    video.onloadedmetadata = () => {
      analysisEngine.setVideoElement(video);
      analysisEngine.startSession();

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return reject(new Error("Could not create canvas context."));
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const duration = video.duration;
      const interval = 1 / 15;
      let currentTime = 0;

      const processNextFrame = async () => {
        if (!faceDetector || !emotionSession) {
            return reject(new Error("A model was lost during processing."));
        }

        video.currentTime = currentTime;
        await new Promise(res => video.onseeked = res);
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

        const detections = await faceDetector.detect(canvas);
        if (detections.detections.length > 0) {
          const face = detections.detections[0].boundingBox;
          if (face) {
            const faceImageData = ctx.getImageData(face.originX, face.originY, face.width, face.height);
            const tensor = await preprocessForOnnx(faceImageData);

            const inputName = emotionSession.inputNames[0];
            const feeds = { [inputName]: tensor };
            const results = await emotionSession.run(feeds);
            const outputName = emotionSession.outputNames[0];
            let probabilities = Array.from(results[outputName].data as Float32Array);

            const maxLogit = Math.max(...probabilities);
            const exps = probabilities.map(logit => Math.exp(logit - maxLogit));
            const sumExps = exps.reduce((a, b) => a + b, 0);
            probabilities = exps.map(exp => exp / sumExps);

            if (probabilities.length !== EMOTION_LABELS.length) {
              return reject(new Error(`Model output size (${probabilities.length}) does not match labels size (${EMOTION_LABELS.length}).`));
            }

            analysisEngine.addTimelineEvent(currentTime, probabilities);
          }
        }

        currentTime += interval;
        if (currentTime <= duration) {
          requestAnimationFrame(processNextFrame);
        } else {
          const detailedReport = analysisEngine.getDetailedReport();
          const backendReport = analysisEngine.getBackendReport();
          URL.revokeObjectURL(video.src);
          resolve({ backendReport, detailedReport });
        }
      };
      requestAnimationFrame(processNextFrame);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("There was an error loading the video file."));
    };
  });
}

async function preprocessForOnnx(imageData: ImageData): Promise<Tensor> {
    const { data, width, height } = imageData;
    const modelWidth = MODEL_INPUT_SHAPE[0];
    const modelHeight = MODEL_INPUT_SHAPE[1];

    const chw = new Float32Array(3 * modelWidth * modelHeight);

    let p = 0;
    for (let y = 0; y < modelHeight; y++) {
        for (let x = 0; x < modelWidth; x++) {
            const srcX = Math.floor(x * width / modelWidth);
            const srcY = Math.floor(y * height / modelHeight);
            const srcIndex = (srcY * width + srcX) * 4;

            const r = data[srcIndex] / 255;
            const g = data[srcIndex + 1] / 255;
            const b = data[srcIndex + 2] / 255;

            chw[0 * modelWidth * modelHeight + p] = (r - MEAN[0]) / STD[0];
            chw[1 * modelWidth * modelHeight + p] = (g - MEAN[1]) / STD[1];
            chw[2 * modelWidth * modelHeight + p] = (b - MEAN[2]) / STD[2];
            p++;
        }
    }

    return new Tensor('float32', chw, [1, 3, modelHeight, modelWidth]);
}