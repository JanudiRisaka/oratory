"use client"

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Calendar, Target, Clock, AlertCircle } from "lucide-react";
import { fetchFeedbackHistory } from "@/lib/firebase/services/sessionService";
import type { FeedbackHistoryItem } from "@/features/facial-analysis/types";
import { Skeleton } from "@/components/ui/skeleton";


function getChangeColor(change: number) {
  if (change === 0) return "text-muted-foreground";
  return change > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
}

function getChangeIcon(change: number) {
  if (change === 0) return TrendingUp;
  return change > 0 ? TrendingUp : TrendingDown;
}

function parseDurationToMinutes(duration: string): number {
  const parts = duration.split(':').map(Number);
  if (parts.length !== 2) return 0;
  return parts[0] + parts[1] / 60;
}

export default function ProgressPage() {
  const [history, setHistory] = useState<FeedbackHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchFeedbackHistory();
        setHistory(data);
      } catch (err) {
        setError("Failed to load progress data. Please try again later.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, []);

  const processedData = useMemo(() => {
    if (history.length === 0) {
      return {
        progressData: [],
        weeklyData: [],
        totalSessionsThisWeek: 0,
        totalDurationThisWeek: 0,
        averageScore: 0,
      };
    }

    const recentSessions = history.slice(0, 5);
    const previousSessions = history.slice(5, 10);

    const calculateAverages = (sessions: FeedbackHistoryItem[]) => {
      if (sessions.length === 0) return { positivity: 0, steadiness: 0, expressiveness: 0, overall: 0 };
      const totals = sessions.reduce((acc, session) => {
        acc.positivity += session.positivityScore;
        acc.steadiness += session.steadinessScore;
        acc.expressiveness += session.expressivenessScore;
        acc.overall += session.overallScore;
        return acc;
      }, { positivity: 0, steadiness: 0, expressiveness: 0, overall: 0 });

      return {
        positivity: Math.round(totals.positivity / sessions.length),
        steadiness: Math.round(totals.steadiness / sessions.length),
        expressiveness: Math.round(totals.expressiveness / sessions.length),
        overall: Math.round(totals.overall / sessions.length),
      };
    };

    const currentScores = calculateAverages(recentSessions);
    const previousScores = calculateAverages(previousSessions);

    const progressData = [
      { metric: "Overall Score", current: currentScores.overall, previous: previousScores.overall, change: currentScores.overall - previousScores.overall },
      { metric: "Positivity", current: currentScores.positivity, previous: previousScores.positivity, change: currentScores.positivity - previousScores.positivity },
      { metric: "Steadiness", current: currentScores.steadiness, previous: previousScores.steadiness, change: currentScores.steadiness - previousScores.steadiness },
      { metric: "Expressiveness", current: currentScores.expressiveness, previous: previousScores.expressiveness, change: currentScores.expressiveness - previousScores.expressiveness },
    ];

    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const sessionsThisWeek = history.filter(session => new Date(session.createdAt) >= startOfWeek);

    const weeklyDataTemplate = [
      { day: "Mon", sessions: 0, duration: 0 }, { day: "Tue", sessions: 0, duration: 0 },
      { day: "Wed", sessions: 0, duration: 0 }, { day: "Thu", sessions: 0, duration: 0 },
      { day: "Fri", sessions: 0, duration: 0 }, { day: "Sat", sessions: 0, duration: 0 },
      { day: "Sun", sessions: 0, duration: 0 },
    ];

    sessionsThisWeek.forEach(session => {
      const sessionDay = new Date(session.createdAt).getDay();
      const index = sessionDay === 0 ? 6 : sessionDay - 1;
      if (weeklyDataTemplate[index]) {
        weeklyDataTemplate[index].sessions += 1;
        weeklyDataTemplate[index].duration += parseDurationToMinutes(session.duration);
      }
    });

    const weeklyData = weeklyDataTemplate.map(day => ({...day, duration: Math.round(day.duration)}));

    const totalSessionsThisWeek = weeklyData.reduce((sum, day) => sum + day.sessions, 0);
    const totalDurationThisWeek = weeklyData.reduce((sum, day) => sum + day.duration, 0);
    const averageScore = history.length > 0 ? Math.round(history.reduce((sum, item) => sum + item.overallScore, 0) / history.length) : 0;

    return { progressData, weeklyData, totalSessionsThisWeek, totalDurationThisWeek, averageScore };
  }, [history]);

  if (isLoading) {
    return <ProgressPageSkeleton />;
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

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Target className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">No Progress Yet</h2>
        <p className="text-muted-foreground">Complete a practice session to start tracking your progress.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Progress Overview</h1>
          <p className="text-muted-foreground">Track your improvement with detailed analytics and insights</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">All Time</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{processedData.totalSessionsThisWeek}</p>
                <p className="text-sm text-muted-foreground">Sessions This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{Math.floor(processedData.totalDurationThisWeek / 60)}h {processedData.totalDurationThisWeek % 60}m</p>
                <p className="text-sm text-muted-foreground">Practice This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{processedData.averageScore}%</p>
                <p className="text-sm text-muted-foreground">Overall Average</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Recent 5 sessions vs. the 5 before that</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {processedData.progressData.map((item, index) => {
              const ChangeIcon = getChangeIcon(item.change);
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.metric}</span>
                    <div className="flex items-center space-x-2">
                      <ChangeIcon className={`w-4 h-4 ${getChangeColor(item.change)}`} />
                      <span className={`text-sm font-medium ${getChangeColor(item.change)}`}>
                        {item.change > 0 ? '+' : ''}{item.change}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-secondary rounded-full h-2">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${item.current}%` }} />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{item.current}%</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>Your practice sessions and duration this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processedData.weeklyData.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-sm w-8">{day.day}</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${day.sessions > 0 ? 'bg-primary' : 'bg-muted'}`} />
                      <span className="text-sm text-muted-foreground">
                        {day.sessions} session{day.sessions !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-medium">{day.duration}min</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProgressPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-6"><Skeleton className="h-12 w-full" /></CardContent></Card>
        <Card><CardContent className="p-6"><Skeleton className="h-12 w-full" /></CardContent></Card>
        <Card><CardContent className="p-6"><Skeleton className="h-12 w-full" /></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><Skeleton className="h-6 w-40 mb-2" /><Skeleton className="h-4 w-64" /></CardHeader>
          <CardContent className="space-y-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-40 mb-2" /><Skeleton className="h-4 w-64" /></CardHeader>
          <CardContent className="space-y-4">
            {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}