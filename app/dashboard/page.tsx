// app/dashboard/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, PlayCircle, History } from 'lucide-react';

import { auth } from '@/lib/firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserProfile } from '@/lib/firebase/services/userService';
import { fetchSessionsFromFirestore } from '@/lib/firebase/services/sessionService';
import type { SessionData } from '@/features/facial-analysis/types';
import { fetchFeedbackHistory } from '@/lib/firebase/services/sessionService';
import type { FeedbackHistoryItem } from '@/features/facial-analysis/types';

function toDisplayDate(v: any): string {
  try {
    if (v?.toDate) return v.toDate().toLocaleDateString();
    if (v instanceof Date) return v.toLocaleDateString();
    if (typeof v === 'number') return new Date(v * 1000).toLocaleDateString();
  } catch {}
  return '—';
}

function getProgress(score: number): { text: string; className: string } {
  if (score >= 90) {
    return { text: "Excellent", className: "text-green-600 dark:text-green-400" };
  }
  if (score >= 75) {
    return { text: "Great Progress", className: "text-blue-600 dark:text-blue-400" };
  }
  if (score >= 60) {
    return { text: "Good Progress", className: "text-yellow-600 dark:text-yellow-400" };
  }
  return { text: "Needs Focus", className: "text-red-500 dark:text-red-400" };
}

type DisplaySession = {
  id: string;
  scenario: string;
  date: string;
  score: number;
};


type ResourceVideo = {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  date: string;
  url: string;
  source: 'TED' | 'YouTube' | 'Toastmasters';
};


export default function DashboardPage() {
  const router = useRouter();

  const [userName, setUserName] = useState<string>('');
  const [tip, setTip] = useState<string>('Loading...');
  const [sessions, setSessions] = useState<DisplaySession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(true);

  // NEW: three videos for sidebar
  const [videos, setVideos] = useState<ResourceVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState<boolean>(true);

  // Fetch tip
  useEffect(() => {
    const loadTip = async () => {
      try {
        const res = await fetch('/api/speech-tip', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('Tip request failed');
        }
        const data = await res.json();
        setTip(data?.tip || 'Stand tall, breathe low, smile lightly—your body convinces your mind.');
      } catch {
        setTip('Stand tall, breathe low, smile lightly—your body convinces your mind.');
      }
    };
    loadTip();
  }, []);

  useEffect(() => {
    let ignore = false;
    const loadVideos = async () => {
      setLoadingVideos(true);
      try {
        const res = await fetch('/api/resources?limit=6', { cache: 'no-store' });
        if (!res.ok) throw new Error(`resources ${res.status}`);
        const data = await res.json();
        const list: ResourceVideo[] = (data?.videos || []) as ResourceVideo[];
        if (!ignore) setVideos(list.slice(0, 3));
      } catch (e) {
        if (!ignore) setVideos([]);
        console.error('Videos fetch failed:', e);
      } finally {
        if (!ignore) setLoadingVideos(false);
      }
    };
    loadVideos();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserName('');
        setSessions([]);
        setLoadingSessions(false);
        return;
      }

      setLoadingSessions(true);
      try {
        const profile = await getUserProfile(user.uid);
        setUserName(profile?.name || user.displayName || 'User');

        const rawHistory: FeedbackHistoryItem[] = await fetchFeedbackHistory();

        const mapped: DisplaySession[] = rawHistory.map((item) => ({
          id: item.id,
          scenario: item.session || 'Practice Session',
          date: toDisplayDate(item.createdAt),
          score: Math.round(item.overallScore || 0)
        }));

        setSessions(mapped.slice(0, 5));

      } catch (error) {
        console.error("Failed to load user data or sessions:", error);
        setSessions([]); 
      } finally {
        setLoadingSessions(false);
      }
    });

    return () => unsub();
  }, []);

  const initials = useMemo(
    () => (userName ? userName.trim().slice(0, 2).toUpperCase() : 'US'),
    [userName]
  );

  useEffect(() => {
    router.prefetch("/dashboard/practice");
  }, [router]);

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {userName || 'User'}!</h1>
          <p className="text-muted-foreground">Ready to hone your public speaking skills today?</p>
        </div>

      </header>

      <main>
        <div className="grid gap-8 md:grid-cols-3">
          {/* Main Column */}
          <div className="md:col-span-2 space-y-8">
            {/* Start Session */}
            <Card className="bg-gradient-to-br from-primary/10 to-transparent">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <PlayCircle className="text-primary" />
                  Start a New Practice Session
                </CardTitle>
                <CardDescription>
                  Choose a scenario, set your goals, and get instant, AI-powered feedback.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="lg" onClick={() => router.push("/dashboard/practice")}>
                  Begin Practice
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSessions ? (
                  <p className="text-sm text-muted-foreground">Loading your recent sessions…</p>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sessions yet. Start your first practice!</p>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session) => {
                      // Call the progress helper for each session
                      const progress = getProgress(session.score);
                      return (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                        >
                          <div>
                            <p className="font-semibold">{session.scenario}</p>
                            <p className="text-sm text-muted-foreground">{session.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              {session.score}
                              <span className="text-xs text-muted-foreground">/100</span>
                            </p>
                            {/* Use the dynamic text and color */}
                            <p className={`text-xs font-semibold ${progress.className}`}>{progress.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Column */}
          <div className="space-y-8">
            {/* Tip of the Day */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb />
                  Tip of the Day
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{tip}</p>
              </CardContent>
            </Card>

            {/* Recommended Videos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle />
                  Recommended Videos
                </CardTitle>
                <CardDescription>Hand-picked talks on public speaking.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingVideos ? (
                  <p className="text-sm text-muted-foreground">Loading videos…</p>
                ) : videos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No videos available right now.</p>
                ) : (
                  <div className="space-y-4">
                    {videos.map((v) => (
                      <a
                        key={v.id}
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex gap-3 rounded-lg hover:bg-muted/50 p-2 transition"
                      >
                        <div className="w-24 h-16 bg-muted flex items-center justify-center overflow-hidden rounded">
                          {v.thumbnail ? (
                            <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                          ) : (
                            <PlayCircle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium line-clamp-2">{v.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {v.source}
                            {v.date ? ` • ${new Date(v.date).toLocaleDateString()}` : ''}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
