import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com", // ← thêm dòng này
      },
      // ... các hostname khác nếu đã có sẵn
    ],
  },
};

export default nextConfig;
