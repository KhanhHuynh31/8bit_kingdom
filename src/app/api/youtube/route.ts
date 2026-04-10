// app/api/youtube/route.ts
import { YOUTUBE_CHANNEL_ID } from "@/stores/types";
import { NextResponse } from "next/server";

// ─── Cấu hình ────────────────────────────────────────────────────────────────
const BASE = "https://www.googleapis.com/youtube/v3";

// Server-side cache: Next.js sẽ không re-fetch lên Google quá 1 lần/5 phút
// dù có bao nhiêu client gọi cùng lúc. Client-side cache (60p) nằm ở mapStore.
export const revalidate = 300;

// ─── Chống spam: In-memory rate limit ────────────────────────────────────────
// Mỗi IP chỉ được gọi API này tối đa MAX_REQUESTS lần trong WINDOW_MS
const WINDOW_MS = 60_000; // 1 phút
const MAX_REQUESTS = 3; // 3 lần/phút/IP — đủ cho nút "Làm mới" thủ công

const ipHitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): {
  allowed: boolean;
  retryAfterSec: number;
} {
  const now = Date.now();
  const entry = ipHitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipHitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (entry.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return { allowed: true, retryAfterSec: 0 };
}

// ─── Helper: Lấy tất cả video IDs từ uploads playlist ────────────────────────
async function fetchAllVideoIds(
  uploadsPlaylistId: string,
  apiKey: string,
): Promise<string[]> {
  const videoIds: string[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(`${BASE}/playlistItems`);
    url.searchParams.set("part", "contentDetails");
    url.searchParams.set("playlistId", uploadsPlaylistId);
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("key", apiKey);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), { next: { revalidate } });
    if (!res.ok) break;

    const json = await res.json();
    json.items?.forEach((item: { contentDetails: { videoId: string } }) => {
      videoIds.push(item.contentDetails.videoId);
    });

    pageToken = json.nextPageToken;
  } while (pageToken);

  return videoIds;
}

// ─── Helper: Lấy tổng likes + comments theo batch 50 ─────────────────────────
interface VideoStats {
  totalLikes: number;
  totalComments: number;
  totalViews: number; // ← thêm
}
async function fetchVideoStats(
  videoIds: string[],
  apiKey: string,
): Promise<VideoStats> {
  let totalLikes = 0;
  let totalComments = 0;
  let totalViews = 0; // ← thêm

  const batches = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    batches.push(videoIds.slice(i, i + 50));
  }

  await Promise.all(
    batches.map(async (batch) => {
      const url = new URL(`${BASE}/videos`);
      url.searchParams.set("part", "statistics");
      url.searchParams.set("id", batch.join(","));
      url.searchParams.set("key", apiKey);

      const res = await fetch(url.toString(), { next: { revalidate } });
      if (!res.ok) return;

      const json = await res.json();
      json.items?.forEach(
        (v: {
          statistics: {
            likeCount?: string;
            commentCount?: string;
            viewCount?: string; // ← thêm
          };
        }) => {
          totalLikes += parseInt(v.statistics.likeCount ?? "0", 10);
          totalComments += parseInt(v.statistics.commentCount ?? "0", 10);
          totalViews += parseInt(v.statistics.viewCount ?? "0", 10); // ← thêm
        },
      );
    }),
  );

  return { totalLikes, totalComments, totalViews };
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  // 1. Rate limit check
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const { allowed, retryAfterSec } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      {
        error: `Quá nhiều yêu cầu. Vui lòng thử lại sau ${retryAfterSec} giây.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(MAX_REQUESTS),
        },
      },
    );
  }

  // 2. Kiểm tra cấu hình
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || !YOUTUBE_CHANNEL_ID) {
    return NextResponse.json(
      { error: "Chưa cấu hình API Key hoặc Channel ID" },
      { status: 500 },
    );
  }

  try {
    // 3. Lấy channel statistics + uploads playlist ID (1 request)
    const chRes = await fetch(
      `${BASE}/channels?part=statistics,contentDetails&id=${YOUTUBE_CHANNEL_ID}&key=${apiKey}`,
      { next: { revalidate } },
    );

    if (!chRes.ok) {
      const err = await chRes.json();
      console.error("[YouTube API] Channel error:", err);
      throw new Error("YouTube API trả về lỗi khi lấy channel");
    }

    const chData = await chRes.json();
    const channel = chData.items?.[0];
    if (!channel) {
      return NextResponse.json(
        { error: "Không tìm thấy kênh" },
        { status: 404 },
      );
    }

    const { subscriberCount, videoCount } = channel.statistics;
    const uploadsPlaylistId: string =
      channel.contentDetails.relatedPlaylists.uploads;

    // 4. Lấy video IDs + stats song song khi đã có playlist ID
    const videoIds = await fetchAllVideoIds(uploadsPlaylistId, apiKey);
    const { totalLikes, totalComments, totalViews } = await fetchVideoStats(
      videoIds,
      apiKey,
    );

    // 5. Trả về toàn bộ dữ liệu — đã ép kiểu Number tại server
    return NextResponse.json({
      subscribers: Number(subscriberCount) || 0,
      views: totalViews, // ← từ video stats, không phải channel viewCount
      videoCount: Number(videoCount) || 0,
      totalLikes,
      totalComments,
      lastUpdate: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[YouTube API] Fetch error:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi fetch YouTube" },
      { status: 500 },
    );
  }
}
