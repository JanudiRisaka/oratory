// oratory/app/dashboard/feedback/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain, Lightbulb, Target, CheckCircle, AlertCircle, TrendingUp, Eye,
  Smile, Frown, Hand
} from "lucide-react";

import { OverallScores } from "@/components/feedback/OverallScores";
import { EmotionPie } from "@/components/feedback/EmotionPie";
import { KeyMoments } from "@/components/feedback/KeyMoments";
import { GapsList } from "@/components/feedback/GapsList";
import { generateUnifiedFeedbackReport } from "./reportGenerator";
import { Skeleton } from "@/components/ui/skeleton";
import { UnifiedFeedbackData, FeedbackHistoryItem } from "@/features/facial-analysis/types";
import { fetchFeedbackById, fetchFeedbackHistory } from "@/lib/firebase/services/sessionService";


const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high": return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950";
    case "medium": return "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950";
    case "low": return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950";
    default: return "border-muted";
  }
};

export default function FeedbackPage() {
  const router = useRouter();
  const [feedbackData, setFeedbackData] = useState<FeedbackHistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isInitialLoad = useRef(true);

useEffect(() => {
    const loadFeedback = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let feedbackItem: FeedbackHistoryItem | null = null;

        if (isInitialLoad.current) {
          const newSessionId = localStorage.getItem("newlyCompletedSessionId");
          if (newSessionId) {
            console.log("Fetching newly completed session:", newSessionId);
            feedbackItem = await fetchFeedbackById(newSessionId);
            localStorage.removeItem("newlyCompletedSessionId");
          }
        }

        if (!feedbackItem) {
          console.log("Fetching most recent session...");
          const recentHistory = await fetchFeedbackHistory(1);
          if (recentHistory.length > 0) {
            feedbackItem = recentHistory[0];
          }
        }

        if (feedbackItem) {
          setFeedbackData(feedbackItem);
        } else {
          setError("No feedback report found. Complete a practice session to see your results.");
        }
      } catch (e) {
        console.error("Failed to load feedback data:", e);
        setError("Could not load your feedback report. Please try again.");
      } finally {
        setIsLoading(false);
        isInitialLoad.current = false;
      }
    };

    loadFeedback();
  }, [router]);

  const handleStartNewSession = () => {
    router.push('/dashboard/practice');
  };

  if (isLoading) {
    return <Skeleton />; 
  }

  if (error || !feedbackData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold mb-4">Feedback Not Available</h1>
        <p className="text-muted-foreground mb-6">{error || "Please complete a session first."}</p>
        <Button size="lg" onClick={handleStartNewSession}><TrendingUp className="w-4 h-4 mr-2" />Start a Practice Session</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-8xl mx-auto p-4 md:p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Feedback & Insights</h1>
          <p className="text-muted-foreground">
            A summary of your practice session
            </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">{feedbackData.date}</Badge>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{feedbackData.session}</CardTitle>
              <CardDescription>Duration: {feedbackData.duration} • Overall Score: {feedbackData.overallScore}%</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{feedbackData.overallScore}%</div>
              <div className="text-sm text-muted-foreground">Overall Performance</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2"><Brain className="w-5 h-5" /><span>Key Insights</span></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feedbackData.keyInsights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 rounded-lg bg-muted/50">
                <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>



      {feedbackData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <OverallScores
            expressiveness={feedbackData.expressivenessScore ?? 0}
            steadiness={feedbackData.steadinessScore ?? 0}
            positivity={feedbackData.positivityScore ?? 0}
          />

          <Card>
            <CardContent className=" w-full flex items-center justify-center p-4">
              <EmotionPie
                labels={feedbackData.rawReport.classes ?? []}
                durationsSec={feedbackData.rawReport.aggregates?.durationsSec ?? {}}
              />
            </CardContent>
          </Card>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* <KeyMoments items={feedbackData.rawReport.insights?.keyMoments ?? []} /> */}
            <GapsList gaps={feedbackData.rawReport.insights?.gaps ?? []} />
          </div>

        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2"><Target className="w-5 h-5" /><span>Recommended Action Items</span></CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {feedbackData.actionItems.map((item, index) => (
              <div key={index} className={`p-4 rounded-lg border-2 ${getPriorityColor(item.priority)}`}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Badge variant={item.priority === "high" ? "destructive" : "secondary"}>{item.priority} priority</Badge>
                    <h4 className="font-medium">{item.task}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>


      <div className="text-center py-6">
        <Button size="lg" onClick={handleStartNewSession}><TrendingUp className="w-4 h-4 mr-2" />Start New Practice Session</Button>
      </div>
    </div>
  );
}