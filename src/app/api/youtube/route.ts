// app/api/youtube/route.ts
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
} from '@/lib/youtube';

export const revalidate = YT_REVALIDATE; // đồng bộ với lib

export async function GET(request: Request) {
  // 1. Rate limit
  const { allowed, retryAfterSec } = checkRateLimit(getIp(request));
  if (!allowed) return rateLimitResponse(retryAfterSec);

  // 2. Kiểm tra cấu hình
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || !YOUTUBE_CHANNEL_ID) {
    return NextResponse.json({ error: 'Chưa cấu hình API Key hoặc Channel ID' }, { status: 500 });
  }

  try {
    // 3. Channel info — Next.js cache dedup với /api/youtube/videos nếu gọi gần nhau
    const channel = await fetchChannelData(YOUTUBE_CHANNEL_ID, apiKey);
    if (!channel) {
      return NextResponse.json({ error: 'Không tìm thấy kênh' }, { status: 404 });
    }

    // 4. Playlist items + video details — cùng URL → Next.js dedup cache
    const items      = await fetchPlaylistItems(channel.uploadsPlaylistId, apiKey);
    const detailsMap = await fetchVideoDetails(items.map(i => i.id), apiKey);

    // 5. Tổng hợp số liệu
    let totalViews = 0, totalLikes = 0, totalComments = 0;
    detailsMap.forEach(v => {
      totalViews    += v.views;
      totalLikes    += v.likes;
      totalComments += v.comments;
    });

    return NextResponse.json({
      subscribers:   Number(channel.subscriberCount) || 0,
      views:         totalViews,
      videoCount:    Number(channel.videoCount)      || 0,
      totalLikes,
      totalComments,
      lastUpdate:    new Date().toISOString(),
    });

  } catch (error) {
    console.error('[YouTube API] Fetch error:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống khi fetch YouTube' }, { status: 500 });
  }
}