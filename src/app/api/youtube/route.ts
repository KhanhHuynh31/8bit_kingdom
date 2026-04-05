import { NextResponse } from 'next/server';

// Cấu hình ISR: Dữ liệu sẽ được cache và cập nhật tối đa 1 lần mỗi giờ
export const revalidate = 3600; 

export async function GET() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey || !channelId) {
    return NextResponse.json({ error: "Chưa cấu hình API Key" }, { status: 500 });
  }

  try {
    // Sử dụng fetch với cache tag để Next.js quản lý
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`,
      {
        next: { revalidate: 3600 } // Đảm bảo fetch cũng được cache
      }
    );

    if (!response.ok) {
      throw new Error('YouTube API trả về lỗi');
    }

    const data = await response.json();
    
    // Trả về dữ liệu rút gọn để Frontend xử lý nhẹ hơn
    if (data.items && data.items.length > 0) {
      return NextResponse.json({
        subscribers: data.items[0].statistics.subscriberCount,
        views: data.items[0].statistics.viewCount,
        lastUpdate: new Date().toISOString()
      });
    }

    return NextResponse.json({ error: "Không tìm thấy kênh" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}