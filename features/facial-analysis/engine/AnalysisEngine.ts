// features/facial-analysis/engine/AnalysisEngine.ts

import { FaceLandmarkerResult, Category } from "@mediapipe/tasks-vision";
import type {
  DetailedReport,
  LiveFeedbackData,
  GoalFeedback,
  Tip,
  BackendReport,
  TimelineEvent,
  KeyMoment
} from "../types";
import { facialAnalysisGoals } from "@/app/config/practiceConfig";
const EMOTION_LABELS = ['happy', 'neutral', 'sad', 'surprise', 'yawning'];

class Counter<T extends string | number> {
  public values: Record<T, number> = {} as Record<T, number>;
  constructor(items: T[] = []) { items.forEach(item => this.add(item)); }
  add(item: T) { this.values[item] = (this.values[item] || 0) + 1; }
  mostCommon(n: number): [T, number][] {
    return (Object.entries(this.values) as [T, number][])
      .sort(([, a], [, b]) => b - a)
      .slice(0, n);
  }
}

// Helpers
const calculateAverage = (arr: number[]): number =>
  arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

const calculateStdDev = (arr: number[]): number => {
  if (arr.length < 2) return 0;
  const mean = calculateAverage(arr);
  const variance = arr.map(n => (n - mean) ** 2).reduce((a, b) => a + b) / arr.length;
  return Math.sqrt(variance);
};

const goalToMetricMap: Record<string, string> = {

  "Professional Smile": "smileScore",
  "Eye Contact": "eyeContact",
  "Respectful Gaze": "eyeContact",
  "Blank Face Avoidance": "expressionRange",
  "eyeContact": "eyeContact",
  "smileScore": "smileScore",
  "expressionRange": "expressionRange",
  "poseStability": "poseStability",
  "headShake": "headShake",
  "headTilt": "headTilt",
  "mouthOpenness": "mouthOpenness",
  "lipPress": "lipPress",
  "chinAngle": "chinAngle",
  "stageHeadMovement": "stageHeadMovement",
  "custom": "custom",
};

const scenarioThresholds = {
  interview: {
    poseStability: { jitterRmsDeg: 1.2 },
    eyeContact: { targetPct: 0.70 },
    smileScore: { minPct: 0.05 },
    lipPress: { maxAvgScore: 0.2 },
  },
  presentation: {
    stageHeadMovement: { jitterRmsDeg: 2.0 },
    expressionRange: { minScore: 0.15 },
    eyeContact: { targetPct: 0.65 },
    mouthOpenness: { targetMar: 0.4 },
    smileScore: { minPct: 0.10 },
  },
  comedy: {
    expressionRange: { minScore: 0.22 },
    smileScore: { minPct: 0.18 },
    stageHeadMovement: { jitterRmsDeg: 2.2 },
    mouthOpenness: { targetMar: 0.45 },
    eyeContact: { targetPct: 0.60 },
  },
  custom: { /* neutral baseline */ },
  default: {
    eyeContact: { targetPct: 0.6 },
    smileScore: { minPct: 0.1 },
    expressionRange: { minScore: 0.1 },
    poseStability: { jitterRmsDeg: 1.8 },
    headShake: { maxNpm: 8 },
    headTilt: { targetNpm: 4 },
    mouthOpenness: { targetMar: 0.35 },
    lipPress: { maxAvgScore: 0.3 },
    chinAngle: { targetPitchRad: 0 },
    stageHeadMovement: { jitterRmsDeg: 2.5 },
  }
} as const;

type ScenarioThresholds = {
  [K in keyof typeof scenarioThresholds.default]?: {
    [SK in keyof (typeof scenarioThresholds.default)[K]]: number;
  };
};
const FRAMES_PER_SECOND = 30;
const OPENING_SECONDS = 10;

const YAWN_JAW_OPEN_THRESHOLD = 0.7;
const YAWN_DURATION_FRAMES = 60;

const YAW_THRESHOLD = 0.26;
const PITCH_THRESHOLD = 0.22;

const SHAKE_YAW_THRESHOLD = 0.04;
const TILT_ROLL_THRESHOLD = 0.04;

const TIP_TRIGGER_FRAMES = FRAMES_PER_SECOND * 2;

function classifyEmotionFromBlendshapes(blendshapes: Category[]): number[] {
  const get = (name: string) => blendshapes.find(s => s.categoryName === name)?.score ?? 0;

  const smile = (get('mouthSmileLeft') + get('mouthSmileRight')) / 2;
  const browDown = (get('browDownLeft') + get('browDownRight')) / 2;
  const browUp = (get('browOuterUpLeft') + get('browOuterUpRight')) / 2;
  const jawOpen = get('jawOpen');
  const frown = (get('mouthFrownLeft') + get('mouthFrownRight')) / 2;

  // Calculate raw scores for the core emotions
  const happyScore = smile * 0.8 + browUp * 0.1;
  const sadScore = frown * 0.6 + browDown * 0.2;
  const surpriseScore = browUp * 0.5 + jawOpen * 0.4;

  // Yawning is primarily defined by a wide-open jaw
  const yawnScore = jawOpen > 0.7 ? jawOpen : 0;

  // Create a raw scores array matching the NEW EMOTION_LABELS order
  // Note: We removed fear, disgust, and angry, and added yawning.
  const scores = [happyScore, sadScore, surpriseScore, 0.15, yawnScore]; // Add a base for neutral

  // If yawning is detected, suppress other emotions to make it dominant
  if (yawnScore > 0.7) {
      scores[0] *= 0.1; // Suppress happy
      scores[1] *= 0.1; // Suppress sad
      scores[2] *= 0.1; // Suppress surprise
  }

  // Softmax function to convert scores to probabilities
  const maxScore = Math.max(...scores);
  const exps = scores.map(s => Math.exp(s - maxScore));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

type HeadPose = { yaw: number; pitch: number; roll: number; timestamp: number };

export class AnalysisEngine {

  // State
  private totalFrames = 0;
  private validFrames = 0;

  private eyeContactFrames = 0;
  private blinkTimestamps: number[] = [];

  private smileScores: number[] = [];
  private browFurrowScores: number[] = [];
  private mouthOpennessScores: number[] = [];
  private jawOpenScores: number[] = [];
  private lipPressScores: number[] = [];

  private openingSmileScores: number[] = [];

  private headShakeCount = 0;
  private headTiltCount = 0;

  private lastPose: HeadPose | null = null;
  private poseJitterHistory: number[] = [];

  private awayGazeFrames = 0;
  private longestAwayGaze = 0;
  private currentAwayGaze = 0;

  private tipTriggerTimestamps: Record<string, number> = {};

  private timeline: TimelineEvent[] = [];
  private potentialKeyMoments: (TimelineEvent & { thumb_b64: string })[] = [];

  private videoElement: HTMLVideoElement | null = null;

  private averagePitch = 0;
  private pitchHistory: number[] = [];

  private yawnCount = 0;
  private sustainedJawOpenFrames = 0;
  private isCurrentlyYawning = false;

  private sessionStartTime = 0;

  private lastShakeTimestamp = 0;
  private lastTiltTimestamp = 0;

  private controlledSmileFrames = 0;
private highSmileFrames = 0;
private furrowedBrowFrames = 0;
private lookingAwayFrames = 0;
private naturalExpressionFrames = 0;
private neutralFaceFrames = 0;

private captureCooldowns: { [key: string]: number } = {};

  private scenarioId: keyof typeof scenarioThresholds = 'default';

  private nodCount = 0;

  constructor() { this.reset(); }

  public reset() {
    Object.keys(this).forEach(key => {
      const prop = this[key as keyof this];
      if (Array.isArray(prop)) (this[key as keyof this] as any[]) = [];
      else if (typeof prop === 'number') (this[key as keyof this] as any) = 0;
      else if (typeof prop === 'object' && prop !== null) (this[key as keyof this] as any) = {};
    });
    this.videoElement = null;
    this.lastPose = null;
    this.isCurrentlyYawning = false;
    this.potentialKeyMoments = [];
    this.sessionStartTime = 0;
    this.validFrames = 0;
    this.scenarioId = 'default';

    this.controlledSmileFrames = 0;
this.highSmileFrames = 0;
this.furrowedBrowFrames = 0;
this.lookingAwayFrames = 0;
this.naturalExpressionFrames = 0;
this.neutralFaceFrames = 0;
this.captureCooldowns = { lastCaptureTime: 0 };
  }

    public getEmotionLabels(): readonly string[] {
    return EMOTION_LABELS;
  }

  public setScenario(scenarioId: string) {
    this.scenarioId = (scenarioId in scenarioThresholds)
      ? scenarioId as keyof typeof scenarioThresholds
      : 'default';
    console.log(`AnalysisEngine scenario set to: ${this.scenarioId}`);
  }

  public startSession() {
    this.reset();
    this.sessionStartTime = performance.now();
    console.log("AnalysisEngine session started.");
  }

  public setVideoElement(video: HTMLVideoElement) { this.videoElement = video; }

  private generateThumbnail(): string | null {
    if (!this.videoElement) return null;
    const canvas = document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  }



  public processFrame(results: FaceLandmarkerResult): void {
    if (this.sessionStartTime === 0) return;
    this.totalFrames++;
    if (!results.faceBlendshapes || results.faceLandmarks.length === 0 || !results.facialTransformationMatrixes) {
      return;
    }
    this.validFrames++;

    const blendshapes = results.faceBlendshapes[0].categories;
    const matrix = results.facialTransformationMatrixes[0].data;

    const smileAvg = ((blendshapes.find(s => s.categoryName === 'mouthSmileLeft')?.score ?? 0) + (blendshapes.find(s => s.categoryName === 'mouthSmileRight')?.score ?? 0)) / 2;
    const jawOpenScore = blendshapes.find(s => s.categoryName === 'jawOpen')?.score ?? 0;
    const browDown = ((blendshapes.find(s => s.categoryName === 'browDownLeft')?.score ?? 0) + (blendshapes.find(s => s.categoryName === 'browDownRight')?.score ?? 0)) / 2;
    const browUp = ((blendshapes.find(s => s.categoryName === 'browOuterUpLeft')?.score ?? 0) + (blendshapes.find(s => s.categoryName === 'browOuterUpRight')?.score ?? 0)) / 2;
    const frown = ((blendshapes.find(s => s.categoryName === 'mouthFrownLeft')?.score ?? 0) + (blendshapes.find(s => s.categoryName === 'mouthFrownRight')?.score ?? 0)) / 2;
    const disgustAU = ((blendshapes.find(s => s.categoryName === 'noseSneerLeft')?.score ?? 0) + (blendshapes.find(s => s.categoryName === 'noseSneerRight')?.score ?? 0)) / 2;
    const yaw = Math.asin(-matrix[8]);
    const pitch = Math.atan2(matrix[9], matrix[10]);
    const roll = Math.atan2(matrix[4], matrix[0]);
    const currentPose: HeadPose = { yaw, pitch, roll, timestamp: performance.now() };

    this.smileScores.push(smileAvg);
    this.browFurrowScores.push(browDown);
    this.mouthOpennessScores.push(jawOpenScore);
    this.jawOpenScores.push(jawOpenScore);
    this.lipPressScores.push(((blendshapes.find(s => s.categoryName === 'mouthPressLeft')?.score ?? 0) + (blendshapes.find(s => s.categoryName === 'mouthPressRight')?.score ?? 0)) / 2);
    if (this.totalFrames <= OPENING_SECONDS * FRAMES_PER_SECOND) this.openingSmileScores.push(smileAvg);
    if (smileAvg >= 0.15 && smileAvg <= 0.55) this.controlledSmileFrames++;
    if (smileAvg > 0.60) this.highSmileFrames++;
    if (browDown > 0.40) this.furrowedBrowFrames++;
    const isBlinking = (blendshapes.find(s => s.categoryName === 'eyeBlinkLeft')?.score ?? 0) > 0.6;
    if (isBlinking && (this.totalFrames % 2 === 0)) this.blinkTimestamps.push(performance.now());
    this.pitchHistory.push(pitch);
    if (this.pitchHistory.length > 150) this.pitchHistory.shift();
    this.averagePitch = calculateAverage(this.pitchHistory);

    const YAW_THRESHOLD_STRICT = 0.22;
    const PITCH_THRESHOLD_STRICT = 0.18;
     if (Math.abs(yaw) < YAW_THRESHOLD_STRICT && Math.abs(pitch) < PITCH_THRESHOLD_STRICT) {
      this.eyeContactFrames++;
      this.currentAwayGaze = 0;
    } else {
      this.awayGazeFrames++;
      this.lookingAwayFrames++;
      this.currentAwayGaze++;
      if (this.currentAwayGaze > this.longestAwayGaze) this.longestAwayGaze = this.currentAwayGaze;
    }
    if (this.lastPose) {
      const deltaYaw = currentPose.yaw - this.lastPose.yaw;
      const deltaRoll = currentPose.roll - this.lastPose.roll;
      const deltaPitch = currentPose.pitch - this.lastPose.pitch;
      const now = performance.now();

      const totalRotationDegrees = (Math.abs(deltaYaw) + Math.abs(deltaPitch) + Math.abs(deltaRoll)) * (180 / Math.PI);
      this.poseJitterHistory.push(totalRotationDegrees);
      if (this.poseJitterHistory.length > 100) this.poseJitterHistory.shift();

      if (Math.abs(deltaYaw) > SHAKE_YAW_THRESHOLD && now - this.lastShakeTimestamp > 1000) {
        this.headShakeCount++; this.lastShakeTimestamp = now;
      }
      if (Math.abs(deltaRoll) > TILT_ROLL_THRESHOLD && now - this.lastTiltTimestamp > 1000) {
        this.headTiltCount++; this.lastTiltTimestamp = now;
      }
    }
    this.lastPose = currentPose;

    const timestamp = (performance.now() - this.sessionStartTime) / 1000;
    const probabilities = classifyEmotionFromBlendshapes(blendshapes);
    const dominantEmotion = EMOTION_LABELS[probabilities.indexOf(Math.max(...probabilities))];
    const maxProb = Math.max(...probabilities);
    const timelineEvent: TimelineEvent = { t: timestamp, label: dominantEmotion, probs: probabilities };
    this.timeline.push(timelineEvent);

    if (jawOpenScore > YAWN_JAW_OPEN_THRESHOLD) this.sustainedJawOpenFrames++;
    else { this.sustainedJawOpenFrames = 0; this.isCurrentlyYawning = false; }
    if (this.sustainedJawOpenFrames > YAWN_DURATION_FRAMES && !this.isCurrentlyYawning) {
      this.yawnCount++;
      this.isCurrentlyYawning = true;
    }
    if (dominantEmotion === 'neutral' && maxProb > 0.60) {
      this.neutralFaceFrames++;
    } else {
      this.naturalExpressionFrames++;
    }

    const strongAU = (dominantEmotion === 'happy' && smileAvg > 0.35) || (dominantEmotion === 'surprise' && (jawOpenScore > 0.50 || browUp > 0.45)) || (dominantEmotion === 'sad' && frown > 0.30) || (dominantEmotion === 'angry' && browDown > 0.35) || (dominantEmotion === 'disgust' && disgustAU > 0.30) || (dominantEmotion === 'fear' && maxProb > 0.45);
    const nowMs = performance.now();
    const lastCap = this.captureCooldowns[dominantEmotion] || 0;
    const okByCooldown = nowMs - lastCap > 3000;
    const isCandidate = dominantEmotion !== 'neutral' && (maxProb > 0.50 || strongAU);
    if (isCandidate && okByCooldown) {
      const thumbnail = this.generateThumbnail();
      if (thumbnail) {
        this.potentialKeyMoments.push({ ...timelineEvent, thumb_b64: thumbnail });
        this.captureCooldowns[dominantEmotion] = nowMs;
      }
    }
  }

  public addTimelineEvent(timestamp: number, probabilities: number[]) {

    this.totalFrames++;
    this.validFrames++;

    if (probabilities.length !== EMOTION_LABELS.length) {
            console.error("Mismatched probability length in addTimelineEvent");
            return;
        }

    const dominantEmotion = EMOTION_LABELS[probabilities.indexOf(Math.max(...probabilities))];

        this.timeline.push({
            t: timestamp,
            label: dominantEmotion,
            probs: probabilities
        });

        const smileProb = probabilities[EMOTION_LABELS.indexOf('happy')];
        this.smileScores.push(smileProb);
        const sadProb = probabilities[EMOTION_LABELS.indexOf('sad')];
        this.browFurrowScores.push(sadProb);
    }

  public getLiveFeedback(activeGoals: ReadonlyArray<string>): LiveFeedbackData {
    const feedback: LiveFeedbackData = {};
    const sessionDurationSeconds = (performance.now() - this.sessionStartTime) / 1000;

    if (sessionDurationSeconds < 3) {
      activeGoals.forEach(goal => {
        feedback[goal] = {
          percentage: 0,
          status: 'average',
          tips: [{ message: "Analyzing...", priority: 'neutral' }]
        };
      });
      return feedback;
    }

    const framesDen = Math.max(1, this.validFrames);
    const thresholds: ScenarioThresholds = scenarioThresholds[this.scenarioId] || scenarioThresholds.default;
    const uniqueMetrics = new Set(activeGoals.map(goal => goalToMetricMap[goal]).filter(Boolean));

    for (const metric of uniqueMetrics) {
      let percentage = 50;
      const tips: Tip[] = [];
      let status: GoalFeedback['status'] = 'average';

      switch (metric) {

      case "Professional Smile": {
        percentage = (this.controlledSmileFrames / framesDen) * 100;
        if (percentage > 70) status = 'good';
        else if (percentage < 40) status = 'needs_improvement';

        if (this.highSmileFrames > TIP_TRIGGER_FRAMES) {
          tips.push({ message: "Smile is a bit strong. Try a more relaxed look.", priority: 'moderate' });
        } else if (this.furrowedBrowFrames > TIP_TRIGGER_FRAMES) {
          tips.push({ message: "Relax your forehead to appear more composed.", priority: 'moderate' });
        } else if (status === 'good') {
          tips.push({ message: "Great controlled smile—warm but not overdone.", priority: 'positive' });
        }
        break;
      }

      case "Eye Contact":
      case "Respectful Gaze": {
        percentage = (this.eyeContactFrames / framesDen) * 100;
        if (percentage > 85) status = 'good';
        else if (percentage < 50) status = 'needs_improvement';

        if (this.lookingAwayFrames > TIP_TRIGGER_FRAMES / 2) {
          tips.push({ message: "Look at the camera to connect with your audience 👀", priority: 'urgent' });
        } else if (status === 'good') {
          tips.push({ message: "Steady eye contact—nice!", priority: 'positive' });
        }
        break;
      }

      case "Blank Face Avoidance": {
        percentage = (this.naturalExpressionFrames / framesDen) * 100;
        if (percentage > 75) status = 'good';
        else if (percentage < 40) status = 'needs_improvement';

        if (this.neutralFaceFrames > TIP_TRIGGER_FRAMES) {
          tips.push({ message: "Expression is a bit static. Try a gentle smile 😊", priority: 'moderate' });
        } else if (status === 'good') {
          tips.push({ message: "Good variety—your face isn't staying neutral.", priority: 'positive' });
        }
        break;
      }

      case "eyeContact": {
        percentage = (this.eyeContactFrames / framesDen) * 100;
        if (percentage > 85) status = 'good';
        else if (percentage < 50) status = 'needs_improvement';

        if (this.lookingAwayFrames > TIP_TRIGGER_FRAMES / 2) {
          tips.push({ message: "Look at the camera to connect with your audience 👀", priority: 'urgent' });
        } else if (status === 'good') {
          tips.push({ message: "Steady eye contact—nice!", priority: 'positive' });
        }
        break;
      }

      case "smileScore": {
        const recentSmile = calculateAverage(this.smileScores.slice(-90));
        const target = thresholds.smileScore?.minPct ?? scenarioThresholds.default.smileScore.minPct;
        percentage = Math.min(100, (recentSmile / (target * 2)) * 100);
        if (sessionDurationSeconds < OPENING_SECONDS && this.shouldTriggerTip(recentSmile < 0.15, "opening_smile", 5000)) {
          tips.push({ message: "Remember a brief, warm opening smile.", priority: 'critical' });
        }
        break;
      }

      case "expressionRange": {
        const smileStd = calculateStdDev(this.smileScores.slice(-150));
        const target = thresholds.expressionRange?.minScore ?? scenarioThresholds.default.expressionRange.minScore;
        percentage = Math.min(100, (smileStd / target) * 100);
        if (this.shouldTriggerTip(percentage < 40, "low_range", 15000)) {
          tips.push({ message: "Expression is static. Try a gentle smile or small brow raise to add variety.", priority: 'moderate' });
        }
        break;
      }

      case "poseStability": {
        const avgJitter = calculateAverage(this.poseJitterHistory);
        const target = thresholds.poseStability?.jitterRmsDeg ?? scenarioThresholds.default.poseStability.jitterRmsDeg;
        percentage = Math.max(0, 100 - (avgJitter / (target * 2)) * 100);
        if (this.shouldTriggerTip(avgJitter > target * 1.5, "high_jitter", 10000)) {
          tips.push({ message: "Keep your head steady for a composed look.", priority: 'urgent' });
        }
        break;
      }

      case "headShake": {
        const shakesPerMinute = sessionDurationSeconds > 0 ? (this.headShakeCount / sessionDurationSeconds) * 60 : 0;
        const maxN = thresholds.headShake?.maxNpm ?? 8;
        percentage = Math.max(0, 100 - (shakesPerMinute / maxN) * 100);

        if (this.shouldTriggerTip(shakesPerMinute > maxN, "high_shake", 15000)) {
          tips.push({ message: "Avoid unintentional head shakes to appear more decisive.", priority: 'moderate' });
        }
        break;
      }

      case "headTilt": {
        const tiltsPerMinute = sessionDurationSeconds > 0 ? (this.headTiltCount / sessionDurationSeconds) * 60 : 0;
        const target = thresholds.headTilt?.targetNpm ?? 4;
        percentage = Math.min(100, (tiltsPerMinute / target) * 100);

        if (this.shouldTriggerTip(percentage > 70 && sessionDurationSeconds > 15, "good_tilt", 20000)) {
          tips.push({ message: "Good use of head tilt to show engagement.", priority: 'positive' });
        }
        break;
      }

      case "mouthOpenness": {
        const avg = calculateAverage(this.mouthOpennessScores.slice(-90));
        const target = thresholds.mouthOpenness?.targetMar ?? 0.35;

        const deviation = Math.abs(avg - target);
        percentage = Math.max(0, 100 - (deviation * 300));

        if (this.shouldTriggerTip(avg < target / 2 && sessionDurationSeconds > 10, "mouth_closed", 12000)) {
          tips.push({ message: "Open your mouth slightly more for clearer articulation.", priority: 'moderate' });
        }
        if (this.shouldTriggerTip(avg > target * 1.8, "mouth_too_open", 12000)) {
          tips.push({ message: "Your mouth is a bit wide. Relax your jaw for a more natural look.", priority: 'moderate' });
        }
        break;
      }

      case "lipPress": {
        const avg = calculateAverage(this.lipPressScores.slice(-90));
        const maxAvg = thresholds.lipPress?.maxAvgScore ?? 0.3;
        percentage = Math.max(0, 100 - (avg / maxAvg) * 100);

        if (this.shouldTriggerTip(avg > maxAvg, "lip_press", 10000)) {
          tips.push({ message: "You're pressing your lips. Relax your mouth to appear more at ease.", priority: 'moderate' });
        }
        break;
      }

      case "chinAngle": {
        const target = thresholds.chinAngle?.targetPitchRad ?? 0;
        percentage = Math.max(0, 100 - Math.abs(this.averagePitch - target) * 200);

        if (this.shouldTriggerTip(this.averagePitch > 0.2, "chin_up", 12000)) {
          tips.push({ message: "Lower your chin slightly for a more balanced and connected look.", priority: 'moderate' });
        } else if (this.shouldTriggerTip(this.averagePitch < -0.2, "chin_down", 12000)) {
          tips.push({ message: "Lift your chin slightly to project more confidence.", priority: 'moderate' });
        }
        break;
      }

      case "stageHeadMovement": {
        const avgMove = calculateAverage(this.poseJitterHistory);
        const target = thresholds.stageHeadMovement?.jitterRmsDeg ?? 2.5;

        if (avgMove < target * 0.5) {
            percentage = (avgMove / (target * 0.5)) * 75;
        } else if (avgMove > target * 1.5) {
            percentage = Math.max(0, 75 - ((avgMove - (target * 1.5)) / target) * 75);
        } else {
            percentage = 100;
        }

        if (this.shouldTriggerTip(avgMove < target * 0.4 && sessionDurationSeconds > 15, "low_movement", 15000)) {
          tips.push({ message: "Use more head movements to energize your delivery.", priority: 'moderate' });
        }
        if (this.shouldTriggerTip(avgMove > target * 1.8, "high_movement", 15000)) {
            tips.push({ message: "Movement is a bit excessive. Try to be more deliberate.", priority: 'moderate' });
        }
        break;
    }

      default: {
        continue;
      }
    }

    if (percentage >= 75) status = 'good';
      else if (percentage < 40) status = 'needs_improvement';

      if (status === 'good') {
        tips.push({ message: "Looking great!", priority: 'positive' });
      } else if (status === 'needs_improvement') {
        tips.push({ message: "Needs focus.", priority: 'neutral' });
      } else {
        tips.push({ message: "Steady performance.", priority: 'neutral' });
      }
      activeGoals.forEach(originalGoal => {
        if (goalToMetricMap[originalGoal] === metric) {
          feedback[originalGoal] = { percentage: Math.round(percentage), status, tips };
        }
      });
    }
    return feedback;
  }

  private shouldTriggerTip(condition: boolean, tipKey: string, delayMs: number): boolean {
    const now = performance.now();
    if (condition) {
      const last = this.tipTriggerTimestamps[tipKey] || 0;
      if (now - last > delayMs) {
        this.tipTriggerTimestamps[tipKey] = now;
        return true;
      }
    }
    return false;
  }

  public getDetailedReport(): DetailedReport {
    const dur = this.sessionStartTime > 0 ? (performance.now() - this.sessionStartTime) / 1000 : 0;
    const bpm = dur > 0 ? (this.blinkTimestamps.length / dur) * 60 : 0;

    return {
      sessionDuration: parseFloat(dur.toFixed(1)),
      blinksPerMinute: Math.round(bpm),
      averageSmileIntensity: calculateAverage(this.smileScores),
      averageBrowFurrow: calculateAverage(this.browFurrowScores),
      averageJawOpen: calculateAverage(this.jawOpenScores),
      nodCount: this.nodCount, 
      gazePercent: (this.eyeContactFrames / Math.max(1, this.totalFrames)) * 100,
      openingSmileIntensity: calculateAverage(this.openingSmileScores),
      eyeContactPercent: (this.eyeContactFrames / Math.max(1, this.totalFrames)) * 100,
      blinkRate: Math.round(bpm),
      keyMoments: [],
      yawnCount: this.yawnCount,
    };
  }

  public getBackendReport(): BackendReport {
        const durationSec = this.sessionStartTime > 0 ? (performance.now() - this.sessionStartTime) / 1000 : 0;
        const fps = this.totalFrames / durationSec || FRAMES_PER_SECOND;
        if (!this.timeline.length) {
            return { error: "No data in timeline" } as any;
        }

        const labels = this.timeline.map(item => item.label);
        const counts = new Counter(labels);
        const durationsSec = Object.fromEntries(
            Object.entries(counts.values).map(([label, count]) => [label, (count as number) / fps])
        );

        const positivityScore = durationSec > 0 ? ((durationsSec['happy'] || 0) / durationSec) * 100 : 0;
        const negativeTime = (durationsSec['fear'] || 0) + (durationsSec['sad'] || 0);
        const steadinessScore = durationSec > 0 ? Math.max(0, (1 - negativeTime / durationSec) * 100) : 0;
        const expressivenessScore = Math.min(100, (calculateStdDev(this.smileScores) + calculateStdDev(this.browFurrowScores)) * 500);

        const maxProbs = this.timeline.map(item => Math.max(...(item.probs || [])));
        const meanConfidence = maxProbs.length ? maxProbs.reduce((a, b) => a + b, 0) / maxProbs.length : 0;

        const keyMoments: KeyMoment[] = [];
        if (this.timeline.length > 50) {

            const allSignificantEvents = this.timeline.filter(
                event => event.label !== 'neutral' && Math.max(...event.probs) > 0.65
            );

            const topEvents = allSignificantEvents
                .sort((a, b) => Math.max(...b.probs) - Math.max(...a.probs))
                .slice(0, 3);

            topEvents.forEach(item => {
                keyMoments.push({
                    tStart: item.t,
                    tEnd: item.t + 1.0,
                    label: item.label,
                    note: `A strong '${item.label}' expression was detected with ${Math.round(Math.max(...item.probs) * 100)}% confidence.`,
                    thumb_b64: null,
                    clip_url: null
                });
            });
        }

        const gaps: string[] = [];
        if (positivityScore < 20) {
            gaps.push("Your use of positive expressions like smiling was limited. Try a warm opening smile to build rapport.");
        }
        if ((durationsSec['angry'] || 0) > 3.0) {
            gaps.push("The AI detected expressions of anger or tension for over 3 seconds. Practice relaxing your brow after key points.");
        }
        if (keyMoments.length === 0) {
            gaps.push("Your expressions were generally neutral. Try using more varied facial expressions to emphasize your key points.");
        }
        if (!gaps.length) {
            gaps.push("Excellent emotional control! Your expressions were generally well-matched and composed.");
        }


        return {
            classes: EMOTION_LABELS,
            timeline: this.timeline,
            aggregates: {
                counts: counts.values,
                durationsSec,
                meanConfidence: parseFloat(meanConfidence.toFixed(4)),
                perClassMeanConf: {}
            },
            scores: {
                expressiveness: Math.round(expressivenessScore),
                steadiness: Math.round(steadinessScore),
                positivity: Math.round(positivityScore)
            },
            insights: {
                dominantEmotion: counts.mostCommon(1)[0][0],
                keyMoments,
                gaps
            },
            version: "7.5.0-Final-KeyMoments",
            fps: parseFloat(fps.toFixed(2)),
            durationSec: parseFloat(durationSec.toFixed(2))
        };
    }

}