import { YOUTUBE_CHANNEL_ID } from '@/stores/mapStore';
import { NextResponse } from 'next/server';

const BASE = 'https://www.googleapis.com/youtube/v3';
export const revalidate = 3600; // Cache 1 giờ — danh sách video ít thay đổi

export interface YtVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;      // ISO 8601 e.g. "PT14M2S"
  durationSec: number;   // seconds — dùng để phân biệt Shorts < 60s
  views: string;
  publishedAt: string;
  isShort: boolean;
}

// Parse ISO 8601 duration → seconds
function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? '0') * 3600) +
         (parseInt(m[2] ?? '0') * 60)  +
          parseInt(m[3] ?? '0');
}

// Format seconds → "mm:ss" hoặc "hh:mm:ss"
export function formatDuration(sec: number): string {
  if (sec < 3600) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export async function GET() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || !YOUTUBE_CHANNEL_ID) {
    return NextResponse.json({ error: 'Chưa cấu hình' }, { status: 500 });
  }

  try {
    // 1. Lấy uploads playlist ID
    const chRes = await fetch(
      `${BASE}/channels?part=contentDetails&id=${YOUTUBE_CHANNEL_ID}&key=${apiKey}`,
      { next: { revalidate } }
    );
    const chJson = await chRes.json();
    const uploadsId = chJson.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) return NextResponse.json({ error: 'Không tìm thấy playlist' }, { status: 404 });

    // 2. Lấy tất cả video IDs + tiêu đề + thumbnail từ playlist
    const items: { id: string; title: string; thumbnail: string; publishedAt: string }[] = [];
    let pageToken: string | undefined;

    do {
      const url = new URL(`${BASE}/playlistItems`);
      url.searchParams.set('part', 'snippet,contentDetails');
      url.searchParams.set('playlistId', uploadsId);
      url.searchParams.set('maxResults', '50');
      url.searchParams.set('key', apiKey);
      if (pageToken) url.searchParams.set('pageToken', pageToken);

      const res = await fetch(url.toString(), { next: { revalidate } });
      const json = await res.json();

      json.items?.forEach((item: {
        contentDetails: { videoId: string };
        snippet: { title: string; publishedAt: string; thumbnails: { medium?: { url: string }; default?: { url: string } } };
      }) => {
        items.push({
          id: item.contentDetails.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? '',
          publishedAt: item.snippet.publishedAt,
        });
      });

      pageToken = json.nextPageToken;
    } while (pageToken);

    // 3. Batch lấy duration + viewCount (50/batch, song song)
    const videoMap = new Map<string, { durationSec: number; views: string }>();

    await Promise.all(
      Array.from({ length: Math.ceil(items.length / 50) }, (_, i) =>
        items.slice(i * 50, i * 50 + 50)
      ).map(async (batch) => {
        const url = new URL(`${BASE}/videos`);
        url.searchParams.set('part', 'contentDetails,statistics');
        url.searchParams.set('id', batch.map(v => v.id).join(','));
        url.searchParams.set('key', apiKey);

        const res = await fetch(url.toString(), { next: { revalidate } });
        const json = await res.json();

        json.items?.forEach((v: {
          id: string;
          contentDetails: { duration: string };
          statistics: { viewCount?: string };
        }) => {
          const sec = parseDuration(v.contentDetails.duration);
          const views = parseInt(v.statistics.viewCount ?? '0');
          videoMap.set(v.id, {
            durationSec: sec,
            views: views >= 1000 ? `${(views / 1000).toFixed(1)}k` : String(views),
          });
        });
      })
    );

    // 4. Ghép lại thành YtVideo[]
    const videos: YtVideo[] = items
      .map(item => {
        const extra = videoMap.get(item.id);
        const sec = extra?.durationSec ?? 0;
        return {
          id: item.id,
          title: item.title,
          thumbnail: item.thumbnail,
          duration: formatDuration(sec),
          durationSec: sec,
          views: extra?.views ?? '0',
          publishedAt: item.publishedAt,
          isShort: sec > 0 && sec <= 120,
        };
      })
      // Mới nhất lên trước
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return NextResponse.json({ videos });

  } catch (err) {
    console.error('[YouTube Videos API]', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}