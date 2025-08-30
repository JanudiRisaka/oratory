// features/facial-analysis/rules/scenarioAdaptations.ts
import { CalculatedMetrics, FeedbackTip, FeedbackRuleContext } from '../types';

export function generateFeedbackBasedOnRules(
  metrics: CalculatedMetrics | null,
  context: FeedbackRuleContext
): FeedbackTip[] {
  if (!metrics) {
    return [{ id: 'no_metrics', text: "AI Coach is calibrating or no face detected clearly.", category: 'general', type: 'neutral' }];
  }

  const tips: FeedbackTip[] = [];
  const { scenarioId, selectedGoals /*, culturalAdaptation */ } = context;

  if (metrics.isSmiling) {
    if (metrics.smileIntensity && metrics.smileIntensity > 0.7) {
      tips.push({ id: 'strong_smile', text: "That's a great, engaging smile!", category: 'expression', type: 'positive' });
    } else if (metrics.smileIntensity && metrics.smileIntensity > 0.3) {
      tips.push({ id: 'nice_smile', text: "Nice smile, it conveys warmth.", category: 'expression', type: 'positive' });
    }
  } else {
    if (scenarioId === 'pitch' || scenarioId === 'general') {
      tips.push({ id: 'consider_smiling', text: "Consider adding a smile to connect more with your audience.", category: 'expression', type: 'constructive' });
    }
  }

  if (metrics.isBrowFurrowed) {
    tips.push({ id: 'brow_furrowed', text: "Your brows are furrowed. If not intentional, try relaxing your forehead for a more open expression.", category: 'expression', type: 'constructive' });
  }

  if (metrics.isLookingAtCamera === false) {
    tips.push({ id: 'look_at_camera', text: "Remember to maintain eye contact with the camera.", category: 'engagement', type: 'constructive', importance: 'high' });
  } else if (metrics.isLookingAtCamera === true) {
    tips.push({ id: 'good_eye_contact', text: "Excellent eye contact!", category: 'engagement', type: 'positive' });
  }


  if (scenarioId === 'interview') {
    if (metrics.isSmiling && metrics.smileIntensity && metrics.smileIntensity > 0.6) {
      const existingTipIndex = tips.findIndex(t => t.id === 'strong_smile');
      if (existingTipIndex !== -1) tips.splice(existingTipIndex, 1); // Remove generic positive
      tips.push({ id: 'interview_smile_note', text: "Good smile! In an interview, balance enthusiasm with professional composure.", category: 'expression', type: 'neutral', importance: 'medium' });
    }
  }
  if (selectedGoals.includes("Clear Articulation")) {

  }


  if (tips.length === 0 && metrics.dominantExpression) {
     tips.push({ id: 'general_observation', text: `You seem mostly ${metrics.dominantExpression}. Keep practicing!`, category: 'general', type: 'neutral' });
  } else if (tips.length === 0) {
     tips.push({ id: 'general_default', text: "Keep up the good work!", category: 'general', type: 'positive'});
  }

  const uniqueTips = Array.from(new Map(tips.map(tip => [tip.id, tip])).values());
  return uniqueTips.slice(0, 3);
}