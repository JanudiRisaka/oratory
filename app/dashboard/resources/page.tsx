"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Search, ExternalLink, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Blog = {
  id: string;
  title: string;
  summary: string;
  type: "blog";
  image: string;
  date: string;
  url: string;
  source: string;
};

type Video = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  date: string;
  url: string;
  source: "TED" | "YouTube";
};

type TabKey = "blogs" | "videos";

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("blogs");

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set("q", searchQuery.trim());
        const url = `/api/resources${params.toString() ? `?${params}` : ""}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());

        const data = (await res.json()) as { blogs: Blog[]; videos: Video[] };
        if (!ignore) {
          setBlogs(data.blogs || []);
          setVideos(data.videos || []);
        }
      } catch (e) {
        console.error("Resources fetch failed:", e);
        if (!ignore) setError("Unable to load resources right now. Please try again.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    const handle = setTimeout(load, 250); 
    return () => {
      ignore = true;
      clearTimeout(handle);
    };
  }, [searchQuery]);

  const hasBlogs = blogs.length > 0;
  const hasVideos = videos.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl p-6 md:p-10">
        <h1 className="text-2xl md:text-3xl font-bold">Resources</h1>
        <p className="text-white/90 mt-2 max-w-2xl">
          Curated blogs and videos on public speaking, presentations, and storytelling.
        </p>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Tabs */}
        <div className="inline-flex rounded-md border bg-card overflow-hidden">
          {(["blogs", "videos"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
              aria-pressed={activeTab === tab}
            >
              {tab === "blogs" ? "Blogs" : "Videos"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
          <input
            type="text"
            placeholder="Search topics (e.g., eye contact, anxiety)…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-brand-400"
            aria-label="Search resources"
          />
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">Loading…</CardContent>
        </Card>
      )}
      {!!error && !loading && (
        <Card>
          <CardContent className="py-10 text-center text-destructive">{error}</CardContent>
        </Card>
      )}

      {/* Blogs */}
      {!loading && !error && activeTab === "blogs" && (
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-semibold">Articles & Blogs</h2>
          {hasBlogs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((b) => (
                <Card key={b.id} className="overflow-hidden">
                  <img src="/blog.png" alt={b.title} className="w-full h-44 object-cover" />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {b.source || "Blog"}
                      </span>
                      <span className="text-xs text-muted-foreground">{new Date(b.date).toLocaleDateString()}</span>
                    </div>
                    <CardTitle className="text-base mt-2 line-clamp-2">{b.title}</CardTitle>
                    <CardDescription className="line-clamp-3">{b.summary}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <a href={b.url} target="_blank" rel="noopener noreferrer" className="inline-flex w-full">
                      <Button variant="outline" className="w-full">
                        Read Article <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No blogs found.</CardContent></Card>
          )}
        </div>
      )}

      {/* Videos */}
      {!loading && !error && activeTab === "videos" && (
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-semibold">Videos</h2>
          {hasVideos ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((v) => (
                <Card key={v.id} className="overflow-hidden">
                  {v.thumbnail ? (
                    <img src={v.thumbnail} alt={v.title} className="w-full h-44 object-cover" />
                  ) : (
                    <div className="w-full h-44 bg-muted flex items-center justify-center">
                      <PlayCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          v.source === "TED"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                        }`}
                      >
                        {v.source}
                      </span>
                      <span className="text-xs text-muted-foreground">{new Date(v.date).toLocaleDateString()}</span>
                    </div>
                    <CardTitle className="text-base mt-2 line-clamp-2">{v.title}</CardTitle>
                    <CardDescription className="line-clamp-3">{v.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <a href={v.url} target="_blank" rel="noopener noreferrer" className="inline-flex w-full">
                      <Button variant="default" className="w-full">
                        <PlayCircle className="mr-2 h-4 w-4" /> Watch
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No videos found.</CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
}
