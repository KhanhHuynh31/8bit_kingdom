import { YOUTUBE_CHANNEL_ID } from '@/stores/mapStore';
import { NextResponse } from 'next/server';

// Đổi thành 0 hoặc một con số nhỏ hơn nếu bạn muốn Server luôn sẵn sàng 
// trả về dữ liệu mới khi Client yêu cầu. 
// Store của chúng ta đã có logic chặn 60p rồi, nên Server không cần chặn quá chặt nữa.
export const revalidate = 60; 

export async function GET() {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey || !YOUTUBE_CHANNEL_ID) {
    return NextResponse.json({ error: "Chưa cấu hình API Key" }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${YOUTUBE_CHANNEL_ID}&key=${apiKey}`,
      {
        // Sử dụng force-cache nhưng cho phép revalidate.
        // Hoặc dùng { cache: 'no-store' } nếu bạn muốn Client hoàn toàn quyết định việc fetch.
        next: { revalidate: 60 } 
      }
    );

    if (!response.ok) {
      // Log lỗi chi tiết ở server để bạn dễ debug
      const errorData = await response.json();
      console.error("YouTube API Error:", errorData);
      throw new Error('YouTube API trả về lỗi');
    }

    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      // Ép kiểu về số ngay tại Server để Frontend không cần parseInt lại
      const stats = data.items[0].statistics;
      
      return NextResponse.json({
        subscribers: Number(stats.subscriberCount) || 0,
        views: Number(stats.viewCount) || 0,
        lastUpdate: new Date().toISOString()
      });
    }

    return NextResponse.json({ error: "Không tìm thấy kênh" }, { status: 404 });
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi fetch YouTube" }, { status: 500 });
  }
}