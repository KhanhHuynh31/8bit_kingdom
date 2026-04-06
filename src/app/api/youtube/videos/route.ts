// app/api/youtube/videos/route.ts
import { YOUTUBE_CHANNEL_ID } from '@/stores/mapStore';
import { NextResponse } from 'next/server';
import {
  YT_REVALIDATE,
  checkRateLimit,
  getIp,
  rateLimitResponse,
  fetchChannelData,
  fetchPlaylistItems,
  fetchVideoDetails,
  formatDuration,
} from '../../../../../lib/youtube';

export const revalidate = YT_REVALIDATE; // đồng bộ với lib → dedup cache với route stats

export interface YtVideo {
  id:          string;
  title:       string;
  thumbnail:   string;
  duration:    string;    // "mm:ss" hoặc "h:mm:ss"
  durationSec: number;    // để phân biệt Shorts (≤ 60s)
  views:       string;    // đã format: "1.2k", "980"
  publishedAt: string;    // ISO string
  isShort:     boolean;
}

export async function GET(request: Request) {
  // 1. Rate limit — dùng cùng shared limiter với /api/youtube
  const { allowed, retryAfterSec } = checkRateLimit(getIp(request));
  if (!allowed) return rateLimitResponse(retryAfterSec);

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || !YOUTUBE_CHANNEL_ID) {
    return NextResponse.json({ error: 'Chưa cấu hình' }, { status: 500 });
  }

  try {
    // 2. Channel info — Next.js cache dedup: nếu /api/youtube đã gọi trước đó
    // trong cùng revalidate window, request này sẽ dùng lại cache, không tốn quota
    const channel = await fetchChannelData(YOUTUBE_CHANNEL_ID, apiKey);
    if (!channel) {
      return NextResponse.json({ error: 'Không tìm thấy kênh' }, { status: 404 });
    }

    // 3. Playlist items — tương tự, dedup cache với route stats
    const items = await fetchPlaylistItems(channel.uploadsPlaylistId, apiKey);

    // 4. Video details (duration + stats) — dedup cache với route stats
    const detailsMap = await fetchVideoDetails(items.map(i => i.id), apiKey);

    // 5. Ghép lại thành YtVideo[], sort mới nhất lên trước
    const videos: YtVideo[] = items
      .map((item) => {
        const detail = detailsMap.get(item.id);
        const sec    = detail?.durationSec ?? 0;
        const count  = detail?.views ?? 0;
        return {
          id:          item.id,
          title:       item.title,
          thumbnail:   item.thumbnail,
          duration:    formatDuration(sec),
          durationSec: sec,
          views:       count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count),
          publishedAt: item.publishedAt,
          isShort:     sec > 0 && sec <= 60,
        };
      })
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return NextResponse.json({ videos });

  } catch (err) {
    console.error('[YouTube Videos API]', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}