import { NextResponse } from "next/server";
import Parser from "rss-parser";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// ---------- Types ----------
type BlogOut = {
  id: string;
  title: string;
  summary: string;
  type: "blog";
  image: string;
  date: string;
  url: string;
  source: string;
};

type VideoOut = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  date: string;
  url: string;
  source: "TED" | "YouTube";
};

type FeedItem = {
  title?: string;
  link?: string;
  contentSnippet?: string;
  content?: string;
  enclosure?: { url?: string; type?: string };
  pubDate?: string;
  isoDate?: string;
  guid?: string;
};

const parser: Parser<FeedItem> = new Parser({
  headers: { "User-Agent": "Oratory/1.0 (+https://example.com)" },
});

// ---------- Helpers ----------
const DEFAULT_BLOG_IMAGE =
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1600&auto=format&fit=crop";

function stripHtml(s = "") {
  return s.replace(/<[^>]*>/g, "");
}
function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

// ---------- BLOGS (non-TED only) ----------
const GENERAL_FEEDS: { url: string; sourceHint: string }[] = [
  { url: "https://sixminutes.dlugan.com/feed/", sourceHint: "Six Minutes" },
  { url: "https://speakupforsuccess.com/feed/", sourceHint: "Speak Up for Success" },
  { url: "https://www.presentationzen.com/atom.xml", sourceHint: "Presentation Zen" },

];

async function fetchBlogs(limit = 30): Promise<BlogOut[]> {
  const settled = await Promise.allSettled(
    GENERAL_FEEDS.map(async ({ url, sourceHint }) => ({ feed: await parser.parseURL(url), sourceHint }))
  );

  const items: BlogOut[] = [];
  for (const res of settled) {
    if (res.status !== "fulfilled") continue;
    const { feed, sourceHint } = res.value;
    const sourceTitle = feed?.title || sourceHint;

    for (const item of feed.items ?? []) {
      const id = item.guid || item.link || uuid();
      const title = item.title || "Untitled";
      const url = item.link || "#";
      const rawDate = item.isoDate || item.pubDate || new Date().toISOString();
      const summary =
        (item.contentSnippet && truncate(item.contentSnippet, 240)) ||
        (item.content && truncate(stripHtml(item.content), 240)) ||
        "";

      const image = DEFAULT_BLOG_IMAGE;

      items.push({
        id,
        title,
        summary,
        type: "blog",
        image,
        date: new Date(rawDate).toISOString(),
        url,
        source: sourceTitle || "Blog",
      });
    }
  }

  const seen = new Set<string>();
  const deduped = items
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter((x) => (x.url && !seen.has(x.url) ? (seen.add(x.url), true) : false));

  return deduped.slice(0, limit);
}

// ---------- TED Videos (HTML search scrape + per-talk enrich) ----------
async function fetchTedVideos(q = "public speaking", limit = 12): Promise<VideoOut[]> {
  const url = `https://www.ted.com/search?cat=videos&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { "User-Agent": "Oratory/1.0" }, cache: "no-store" });
  if (!res.ok) return [];
  const html = await res.text();

  const hrefs = Array.from(
    new Set(
      [...html.matchAll(/href=["'](\/talks\/[^"']+)["']/gi)]
        .map((m) => m[1])
        .filter((h) => h && !h.includes("#"))
    )
  ).slice(0, limit * 2);

  const out: VideoOut[] = [];
  for (const path of hrefs) {
    const full = `https://www.ted.com${path}`;

    let title = "TED Talk";
    let thumbnail = "";
    let description = "";
    let dateISO = new Date().toISOString();

    try {
      const talkRes = await fetch(full, { headers: { "User-Agent": "Oratory/1.0" }, cache: "no-store" });
      if (talkRes.ok) {
        const talkHtml = await talkRes.text();
        const ogTitle = talkHtml.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1];
        const ogDesc = talkHtml.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)?.[1];
        const ogImage = talkHtml.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1];
        const pubDate =
          talkHtml.match(/<meta\s+property=["']article:published_time["']\s+content=["']([^"']+)["']/i)?.[1] ||
          talkHtml.match(/<meta\s+itemprop=["']uploadDate["']\s+content=["']([^"']+)["']/i)?.[1];

        if (ogTitle) title = ogTitle;
        if (ogDesc) description = ogDesc;
        if (ogImage) thumbnail = ogImage;
        if (pubDate) dateISO = new Date(pubDate).toISOString();
      }
    } catch {
      
    }

    out.push({
      id: full,
      title,
      description,
      thumbnail,
      date: dateISO,
      url: full,
      source: "TED",
    });

    if (out.length >= limit) break;
  }

  return out;
}

// ---------- YouTube (official API) ----------
async function fetchYouTubeVideos(query = "public speaking", limit = 12): Promise<VideoOut[]> {
  if (!YOUTUBE_API_KEY) return [];
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
    query
  )}&type=video&maxResults=${Math.min(limit, 50)}&key=${YOUTUBE_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  return (data.items || []).map((item: any) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnail: item.snippet.thumbnails?.medium?.url || "",
    date: item.snippet.publishedAt,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    source: "YouTube" as const,
  }));
}

// ---------- Main handler (blogs + videos only) ----------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const qParam = searchParams.get("q")?.trim();
    const limitParam = Number(searchParams.get("limit") || "0");

    const BLOG_LIMIT = limitParam > 0 ? limitParam : 30;
    const VIDEO_LIMIT = limitParam > 0 ? limitParam : 12;

    const [blogs, tedVideos, ytVideos] = await Promise.all([
      fetchBlogs(BLOG_LIMIT), // non-TED blogs only + same image
      fetchTedVideos(qParam || "public speaking", VIDEO_LIMIT),
      fetchYouTubeVideos(qParam || "public speaking", VIDEO_LIMIT),
    ]);

    const videos: VideoOut[] = [...tedVideos, ...ytVideos];

    return NextResponse.json({ blogs, videos });
  } catch (err) {
    console.error("Resources API error:", err);
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 });
  }
}
