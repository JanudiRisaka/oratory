// app/dashboard/feedback/reportGenerator.ts
import { BackendReport, DetailedReport, UnifiedFeedbackData } from "@/features/facial-analysis/types";

export const generateUnifiedFeedbackReport = (
  backend: BackendReport,
  detailed: DetailedReport,
  selectedGoals: string[],
  scenarioId: string
): UnifiedFeedbackData => {

  const positivityScore = Math.round(backend.scores?.positivity ?? 0);
  const steadinessScore = Math.round(backend.scores?.steadiness ?? 0);
  const expressivenessScore = Math.round(backend.scores?.expressiveness ?? 0);

  const weights: { [key: string]: { positivity: number, steadiness: number, expressiveness: number } } = {
    interview: { positivity: 0.3, steadiness: 0.5, expressiveness: 0.2 },
    pitch:     { positivity: 0.5, steadiness: 0.2, expressiveness: 0.3 },
    academic:  { positivity: 0.1, steadiness: 0.6, expressiveness: 0.3 },
    general:   { positivity: 0.4, steadiness: 0.4, expressiveness: 0.2 },
  };
  const scenarioWeights = weights[scenarioId] || weights.general;

  const overallScore = Math.round(
    positivityScore * scenarioWeights.positivity +
    steadinessScore * scenarioWeights.steadiness +
    expressivenessScore * scenarioWeights.expressiveness
  );

  const keyInsights = [
    `Your scenario-weighted performance score was ${overallScore}%.`,
    `Your primary detected emotion was '${backend.insights?.dominantEmotion ?? "neutral"}' with ${Math.round(backend.aggregates.meanConfidence * 100)}% AI confidence.`,
    `You used ${detailed.nodCount} affirmative head nods during the session.`,
    `Your positivity score was ${positivityScore}%, reflecting your use of positive expressions like smiling.`
  ];
  if (detailed.yawnCount > 0) {
    const yawnText = detailed.yawnCount === 1 ? "1 yawn" : `${detailed.yawnCount} yawns`;
    keyInsights.push(`The AI detected ${yawnText}, which can signal fatigue.`);
  }

  const actionItems: UnifiedFeedbackData['actionItems'] = [];

  if (steadinessScore < 60) {
    actionItems.push({
      priority: "high",
      task: "Practice maintaining a composed expression under pressure. Try recording just your opening statement while focusing on relaxing your brow and jaw."
    });
  }
  if (backend.insights?.gaps.some(gap => gap.includes("anger"))) {
    actionItems.push({
      priority: "high",
      task: "Identify moments of tension. Watch the key moments where 'angry' expressions were detected and practice delivering those lines with a more neutral tone."
    });
  }

  if (positivityScore < 50) {
    actionItems.push({
      priority: "medium",
      task: "Incorporate more positive expressions. Practice smiling briefly at the beginning and end of your talk to build better rapport."
    });
  }
  if (expressivenessScore < 65) {
    actionItems.push({
      priority: "medium",
      task: "Increase your facial expressiveness. Try practicing in front of a mirror and exaggerating your expressions to match your key points."
    });
  }
  if (detailed.gazePercent && detailed.gazePercent < 70) {
      actionItems.push({
          priority: "medium",
          task: "Improve your camera eye contact. Place a sticky note next to your webcam as a reminder to look at the lens, not the screen."
      });
  }

  actionItems.push({
    priority: "low",
    task: "Review your 'Key Moments' to see which expressions were most impactful and memorable."
  });

  if (actionItems.length === 0) {
    actionItems.push({
      priority: "medium",
      task: "Excellent session! For your next practice, try a different scenario to challenge yourself in a new context."
    });
  }

  return {
    overallScore,
    positivityScore,
    steadinessScore,
    expressivenessScore,
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    session: "Your Latest Practice Session",
    duration: `${Math.floor(backend.durationSec / 60).toString().padStart(2, '0')}:${Math.round(backend.durationSec % 60).toString().padStart(2, '0')}`,
    keyInsights,
    actionItems: actionItems.slice(0, 3), // Return the top 3 most relevant action items
  };
};