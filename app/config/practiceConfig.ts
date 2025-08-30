// app/config/practiceConfig.ts
import { GraduationCap, Briefcase, Presentation, Mic, Settings } from "lucide-react";

export const facialAnalysisGoals = [
  "eyeContact",
  "smileScore",
  "expressionRange",
  "poseStability",
  "headShake",
  "headTilt",
  "mouthOpenness",
  "lipPress",
  "chinAngle",
  "stageHeadMovement",
  "Professional Smile",
  "Respectful Gaze",
  "Blank Face Avoidance",
] as const;

export const goalLabels = {
  eyeContact: "Persuasive Eye Contact",
  smileScore: "Warm & Welcoming Smile",
  expressionRange: "Energetic Expression",
  poseStability: "Confident Stillness",
  headShake: "Decisive Head Shakes",
  headTilt: "Engaged Head Tilt",
  mouthOpenness: "Clear Articulation",
  lipPress: "Composed Lips",
  chinAngle: "Balanced Chin Angle",
  stageHeadMovement: "Purposeful Head Movement",
} as const;

export const goalTooltips = {
  eyeContact: "Maintain steady, respectful connection with the camera.",
  smileScore: "Use friendly smiles for openings and closings.",
  expressionRange: "Vary your expressions to match your message and keep the audience engaged.",
  poseStability: "A steady head position reads as composed and confident.",
  headNod: "Use brief nods to acknowledge points and show agreement.",
  headShake: "Keep head shakes intentional when disagreeing or negating.",
  headTilt: "A gentle tilt can show curiosity and active listening.",
  mouthOpenness: "Moderate mouth opening improves vocal clarity.",
  lipPress: "Relax your lips to reduce signs of tension or hesitation.",
  chinAngle: "A neutral to slightly up chin angle projects confidence.",
  stageHeadMovement: "Use intentional turns and nods to energize your delivery.",
} as const;

export const scenarios = [
  {
    id: "interview",
    title: "Job Interview",
    subtitle: "Virtual or In-Person",
    icon: Briefcase,
    description: "Focus on confidence, professionalism, and showing engagement.",
    culturalTip: "Project confidence and poise. A genuine, controlled smile builds rapport, and active listening cues show you are engaged.",
    suggestedGoals: [
      "poseStability",
      "eyeContact",
      "smileScore",
      "lipPress"
    ],
    timeRecommendation: 4,
  },
  {
    id: "presentation",
    title: "Presentation (Pitch / Academic)",
    subtitle: "Persuade & Inform",
    icon: Presentation,
    description: "Deliver ideas with clarity, energy, and conviction.",
    culturalTip: "Convey enthusiasm and conviction. Use dynamic expressions to emphasize key points and build a strong, persuasive case.",
    suggestedGoals: [
      "stageHeadMovement",
      "expressionRange",
      "eyeContact",
      "mouthOpenness",
      "smileScore"
    ],
    timeRecommendation: 8,
  },
  {
    id: "comedy",
    title: "Stand-up Comedy Set",
    subtitle: "Club or Event",
    icon: Mic,
    description: "Deliver punchlines with expressive face work and purposeful movement.",
    culturalTip: "A quick smile or head tilt after punchlines invites laughter. Vary your expressions to match the tone of your jokes.",
    suggestedGoals: [
      "expressionRange",
      "smileScore",
      "stageHeadMovement",
      "mouthOpenness",
      "eyeContact"
    ],
    timeRecommendation: 7,
  },
  {
    id: "custom",
    title: "Custom Scenario",
    subtitle: "Build Your Own",
    icon: Settings,
    description: "Select any combination of goals to focus on for a personalized session.",
    culturalTip: "This is your sandbox. Experiment with different combinations of goals to find what works best for your unique style.",
    suggestedGoals: [
    ],
    timeRecommendation: 5,
  },
] as const;

export function getGoalLabel(goalId: string): string {
  if (goalId in goalLabels) {
    return goalLabels[goalId as keyof typeof goalLabels];
  }

  return goalId;
}