// app/dashboard/feedback-history/page.tsx
"use client"; // FIX: Add this directive to enable client-side hooks

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Download,
  ExternalLink,
  Filter,
  Search,
  TrendingUp,
  Target,
  Lightbulb
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState, useMemo  } from "react";
import { fetchFeedbackHistory } from "@/lib/firebase/services/sessionService";
import type { FeedbackHistoryItem } from "@/features/facial-analysis/types";

function getScoreColor(score: number) {
  if (score >= 90) return "text-green-600 dark:text-green-400";
  if (score >= 80) return "text-blue-600 dark:text-blue-400";
  if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function getScoreBadgeVariant(score: number) {
  if (score >= 90) return "default";
  if (score >= 80) return "secondary";
  if (score >= 70) return "outline";
  return "destructive";
}

export default function FeedbackHistoryPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [allSessions, setAllSessions] = useState<FeedbackHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {

    const loadHistory = async () => {
      try {
        const allSessionsData = await fetchFeedbackHistory();
        setAllSessions(allSessionsData);
      } catch (err) {
        setError("Failed to load session history. Please try again later.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, []);

  const filteredSessions = useMemo(() => {
    if (!searchTerm) {
      return allSessions;
    }
    return allSessions.filter(session =>
      session.session.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allSessions, searchTerm]);


   const totalSessions = allSessions.length;

  const averageScore = totalSessions > 0
    ? Math.round(allSessions.reduce((sum, item) => sum + item.overallScore, 0) / totalSessions)
    : 0;

  const totalInsights = allSessions.reduce((sum, item) => sum + (item.keyInsights?.length || 0), 0);

  const bestScore = totalSessions > 0
    ? Math.max(...allSessions.map(item => item.overallScore))
    : 0;

  if (!isLoading && allSessions.length === 0) {
      return (
        <div className="text-center py-10">
            <h2 className="text-2xl font-bold mb-2">No Feedback History Found</h2>
            <p className="text-muted-foreground">Complete a practice session to see your feedback here.</p>
        </div>
      )
  }

  if (totalSessions === 0) {
      return (
        <div className="text-center py-10">
            <h2 className="text-2xl font-bold mb-2">No Feedback History Found</h2>
            <p className="text-muted-foreground">Complete a practice session to see your feedback here.</p>
        </div>
      )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feedback History</h1>
          <p className="text-muted-foreground">
            Archive of all AI-generated feedback and insights from your practice sessions
          </p>
        </div>
        <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by session title..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Button variant="outline" onClick={() => alert("Filter functionality coming soon!")}>
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{averageScore}%</p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{totalSessions}</p>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{totalInsights}</p>
                <p className="text-sm text-muted-foreground">AI Insights</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{bestScore}%</p>
                <p className="text-sm text-muted-foreground">Best Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search feedback sessions..." className="pl-8" />
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feedback History List */}
      <div className="space-y-4">
        {filteredSessions.map((session) => (
          <Card key={session.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{session.session}</CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      {/* Safely format the date */}
                      <span>{session.createdAt?.toDate ? session.createdAt.toDate().toLocaleDateString() : new Date(session.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{session.duration}</span>
                    </div>
                    <span>{session.keyInsights.length} insights</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getScoreBadgeVariant(session.overallScore)}>
                    {session.overallScore}%
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-blue-600 dark:text-blue-400 flex items-center space-x-2">
                    <Lightbulb className="w-4 h-4" />
                    <span>Key Insights</span>
                  </h4>
                  <ul className="space-y-1">
                    {session.keyInsights.map((insight, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start space-x-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-yellow-600 dark:text-yellow-400 flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span>Action Items</span>
                  </h4>
                  <ul className="space-y-1">
                    {session.actionItems.map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start space-x-2">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        <span>{item.task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button variant="outline" size="lg">
          Load More Sessions
        </Button>
      </div>
    </div>
  )
}