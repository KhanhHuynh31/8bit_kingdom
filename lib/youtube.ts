// lib/youtube.ts
export const YT_BASE = 'https://www.googleapis.com/youtube/v3';

// ─── Thời gian cache thống nhất cho cả 2 routes ───────────────────────────────
// Quan trọng: cả 2 route phải dùng CÙNG giá trị này để Next.js fetch dedup hoạt động.
// Nếu 2 route dùng revalidate khác nhau → Next.js cache riêng → gọi API 2 lần.
export const YT_REVALIDATE = 3600; // 1 giờ

// ─── Shared in-memory rate limiter ───────────────────────────────────────────
const WINDOW_MS   = 60_000; // 1 phút
const MAX_REQUESTS = 3;     // 3 lần/phút/IP

const ipHitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSec: number } {
  const now   = Date.now();
  const entry = ipHitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipHitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }
  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true, retryAfterSec: 0 };
}

export function getIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

export function rateLimitResponse(retryAfterSec: number) {
  return Response.json(
    { error: `Quá nhiều yêu cầu. Vui lòng thử lại sau ${retryAfterSec} giây.` },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSec),
        'X-RateLimit-Limit': String(MAX_REQUESTS),
      },
    },
  );
}

// ─── Parse ISO 8601 duration → seconds ───────────────────────────────────────
export function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? '0') * 3600) +
         (parseInt(m[2] ?? '0') * 60)  +
          parseInt(m[3] ?? '0');
}

// ─── Format seconds → "mm:ss" hoặc "h:mm:ss" ─────────────────────────────────
export function formatDuration(sec: number): string {
  if (sec < 3600) {
    return `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;
  }
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// ─── Fetch channel info (statistics + uploads playlist ID) ────────────────────
// Dùng YT_REVALIDATE để Next.js cache chung, cả 2 route gọi URL giống nhau
// → Next.js chỉ thực sự gọi Google 1 lần trong window revalidate
export async function fetchChannelData(channelId: string, apiKey: string) {
  const res = await fetch(
    `${YT_BASE}/channels?part=statistics,contentDetails&id=${channelId}&key=${apiKey}`,
    { next: { revalidate: YT_REVALIDATE } }, // ← URL + revalidate giống nhau = dedup
  );
  if (!res.ok) return null;
  const json = await res.json();
  const ch   = json.items?.[0];
  if (!ch) return null;
  return {
    subscriberCount:    ch.statistics.subscriberCount  as string,
    videoCount:         ch.statistics.videoCount       as string,
    uploadsPlaylistId:  ch.contentDetails.relatedPlaylists.uploads as string,
  };
}

// ─── Fetch tất cả items từ uploads playlist ───────────────────────────────────
export type PlaylistItem = {
  id:          string;
  title:       string;
  thumbnail:   string;
  publishedAt: string;
};

export async function fetchPlaylistItems(
  uploadsPlaylistId: string,
  apiKey: string,
): Promise<PlaylistItem[]> {
  const items: PlaylistItem[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(`${YT_BASE}/playlistItems`);
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('playlistId', uploadsPlaylistId);
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('key', apiKey);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url.toString(), { next: { revalidate: YT_REVALIDATE } });
    if (!res.ok) break;
    const json = await res.json();

    json.items?.forEach((item: {
      contentDetails: { videoId: string };
      snippet: {
        title: string;
        publishedAt: string;
        thumbnails: { medium?: { url: string }; default?: { url: string } };
      };
    }) => {
      items.push({
        id:          item.contentDetails.videoId,
        title:       item.snippet.title,
        thumbnail:   item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? '',
        publishedAt: item.snippet.publishedAt,
      });
    });

    pageToken = json.nextPageToken;
  } while (pageToken);

  return items;
}

// ─── Fetch video stats (views + likes + comments + duration) theo batch ───────
export type VideoDetail = {
  id:           string;
  durationSec:  number;
  views:        number;
  likes:        number;
  comments:     number;
};

export async function fetchVideoDetails(
  videoIds: string[],
  apiKey: string,
): Promise<Map<string, VideoDetail>> {
  const map = new Map<string, VideoDetail>();

  await Promise.all(
    Array.from({ length: Math.ceil(videoIds.length / 50) }, (_, i) =>
      videoIds.slice(i * 50, i * 50 + 50),
    ).map(async (batch) => {
      const url = new URL(`${YT_BASE}/videos`);
      url.searchParams.set('part', 'statistics,contentDetails');
      url.searchParams.set('id', batch.join(','));
      url.searchParams.set('key', apiKey);

      const res = await fetch(url.toString(), { next: { revalidate: YT_REVALIDATE } });
      if (!res.ok) return;
      const json = await res.json();

      json.items?.forEach((v: {
        id: string;
        contentDetails: { duration: string };
        statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
      }) => {
        map.set(v.id, {
          id:          v.id,
          durationSec: parseDuration(v.contentDetails.duration),
          views:       parseInt(v.statistics.viewCount    ?? '0', 10),
          likes:       parseInt(v.statistics.likeCount    ?? '0', 10),
          comments:    parseInt(v.statistics.commentCount ?? '0', 10),
        });
      });
    }),
  );

  return map;
}