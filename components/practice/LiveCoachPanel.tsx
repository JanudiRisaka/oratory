// components/practice/LiveCoachPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, CheckCircle2, AlertTriangle, Target, Zap, TrendingDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AnimatePresence, motion } from 'framer-motion';
import type { LiveFeedbackData, Tip, GoalFeedback, TipPriority } from '../../features/facial-analysis/types';

interface LiveCoachPanelProps {
  isSessionActive: boolean;
  feedbackData: LiveFeedbackData | null;
}

const MIN_TIP_VISIBLE_DURATION_MS = 6000;

const statusConfig: Record<GoalFeedback['status'], { color: string }> = {
  good: { color: 'bg-green-500' },
  average: { color: 'bg-blue-500' },
  needs_improvement: { color: 'bg-yellow-500' }
};

const priorityIcons = {
    critical: <AlertTriangle className="w-4 h-4 mr-2 text-red-500 flex-shrink-0" />,
    urgent: <Zap className="w-4 h-4 mr-2 text-yellow-500 flex-shrink-0" />,
    trending_down: <TrendingDown className="w-4 h-4 mr-2 text-orange-500 flex-shrink-0" />,
    positive: <CheckCircle2 className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />,

};

const getPriorityScore = (priority: TipPriority) => {
  const scores: Record<TipPriority, number> = {
    critical: 1, urgent: 2, trending_down: 3, moderate: 4, positive: 5, neutral: 6
  };
  return scores[priority] || 7;
};

export function LiveCoachPanel({ isSessionActive, feedbackData }: LiveCoachPanelProps) {
  const [activeTip, setActiveTip] = useState<{ tip: Tip; shownAt: number } | null>(null);

  useEffect(() => {
    if (!isSessionActive || !feedbackData) {
      setActiveTip(null);
      return;
    }

    const allTips = (Object.values(feedbackData) as GoalFeedback[]).flatMap(goal => goal.tips);
    const now = Date.now();

    const highestPriorityIncomingTip = allTips.length > 0
      ? allTips.sort((a, b) => getPriorityScore(a.priority) - getPriorityScore(b.priority))[0]
      : null;

    if (!activeTip) {
      if (highestPriorityIncomingTip) {
        setActiveTip({ tip: highestPriorityIncomingTip, shownAt: now });
      }
    } else {
      const timeSinceShown = now - activeTip.shownAt;

      if (timeSinceShown > MIN_TIP_VISIBLE_DURATION_MS) {
        if (highestPriorityIncomingTip && highestPriorityIncomingTip.message !== activeTip.tip.message) {

          setActiveTip({ tip: highestPriorityIncomingTip, shownAt: now });
        } else if (!highestPriorityIncomingTip) {

          setActiveTip(null);
        }
      } else {
        if (highestPriorityIncomingTip?.priority === 'critical' && activeTip.tip.priority !== 'critical') {
          setActiveTip({ tip: highestPriorityIncomingTip, shownAt: now });
        }
      }
    }
  }, [feedbackData, isSessionActive, activeTip]);

  const goals: [string, GoalFeedback][] = feedbackData ? Object.entries(feedbackData) : [];

  if (!isSessionActive) { /* ... */ }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* --- TOP BOX: The Intelligent Tip Stack --- */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center text-sm font-semibold mb-2 text-primary">
          <Lightbulb className="w-4 h-4 mr-2" />
          Coaching Tip
        </div>
        <div className="h-12 flex items-center justify-center text-center">
          <AnimatePresence mode="wait">
            {activeTip ? (
              <motion.p
                key={activeTip.tip.message}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="font-medium text-foreground flex items-center text-sm"
              >
                {priorityIcons[activeTip.tip.priority as keyof typeof priorityIcons]}
                {activeTip.tip.message}
              </motion.p>
            ) : (!feedbackData || goals.length === 0) ? (
              <motion.p key="initializing-tip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground">
                Start Session For Live Feedback...
              </motion.p>
            ) : (
              <motion.p key="no-tip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground">
                You're doing great! Keep going 👏
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Separator />
      {/* --- BOTTOM BOX: Goal Percentages --- */}
      <div className="flex-grow">
        <div className="flex items-center text-sm font-semibold mb-3">
          <Target className="w-4 h-4 mr-2" />
          Your Focus Goals
        </div>
        <div className="space-y-4">
          {feedbackData && goals.length > 0 ? (
            goals.map(([goalName, data]) => {
              if (!data) return null;
              const config = statusConfig[data.status] || statusConfig.average;
              const clampedPercentage = Math.max(0, Math.min(100, data.percentage));

              return (
                <div key={goalName}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-foreground">{goalName}</span>
                    <span className="text-sm font-semibold text-primary">{clampedPercentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full ${config.color}`}
                      initial={{ width: "0%" }}
                      animate={{ width: `${clampedPercentage}%` }}
                      transition={{ duration: 0.5, ease: "circOut" }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center pt-4">
              {isSessionActive ? "Analyzing..." : "Waiting for session to start..."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}