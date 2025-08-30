"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, TrendingUp, TrendingDown, ExternalLink, Target, AlertCircle } from "lucide-react";
import { fetchFeedbackHistory } from "@/lib/firebase/services/sessionService";
import type { FeedbackHistoryItem } from "@/features/facial-analysis/types";
import { Skeleton } from "@/components/ui/skeleton";
import { scenarios } from "@/app/config/practiceConfig";


function getScoreColor(score: number) {
  if (score >= 85) return "text-green-600 dark:text-green-400";
  if (score >= 70) return "text-blue-600 dark:text-blue-400";
  return "text-yellow-600 dark:text-yellow-400";
}

function getScoreBadgeVariant(score: number): "default" | "secondary" | "outline" {
  if (score >= 85) return "default";
  if (score >= 70) return "secondary";
  return "outline";
}


export default function ProgressHistoryPage() {
  const router = useRouter();
  const [sessionHistory, setSessionHistory] = useState<FeedbackHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchFeedbackHistory();
        setSessionHistory(data);
      } catch (err) {
        setError("Failed to load session history. Please try again later.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, []);

  const handleViewReport = (sessionId: string) => {
    alert(`Navigating to detailed report for session ID: ${sessionId}`);
  };

  if (isLoading) {
    return <HistoryPageSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold">Could not load data</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (sessionHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Target className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">No History Yet</h2>
        <p className="text-muted-foreground">Your completed practice sessions will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Progress History</h1>
          <p className="text-muted-foreground">Detailed chronological logs of all your practice sessions</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">{sessionHistory.length} sessions</Badge>
      </div>

      <div className="space-y-4">
        {sessionHistory.map((session) => (
          <Card key={session.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{session.session}</CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(session.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(session.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span>Duration: {session.duration}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getScoreBadgeVariant(session.overallScore)}>
                    {session.overallScore}% Overall
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricBox title="Positivity" score={session.positivityScore} />
                <MetricBox title="Steadiness" score={session.steadinessScore} />
                <MetricBox title="Expressiveness" score={session.expressivenessScore} />
                <MetricBox title="Overall Score" score={session.overallScore} />
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-blue-600 dark:text-blue-400 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Key Insights from this Session</span>
                </h4>
                <ul className="space-y-2">
                  {session.keyInsights.map((insight, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MetricBox({ title, score }: { title: string; score: number }) {
  return (
    <div className="text-center p-3 rounded-lg bg-muted/50">
      <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
        {score}%
      </div>
      <div className="text-sm text-muted-foreground">{title}</div>
    </div>
  );
}

function HistoryPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-8 w-28" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}