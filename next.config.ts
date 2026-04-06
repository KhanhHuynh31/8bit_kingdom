import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/**", // Cho phép tất cả các đường dẫn từ host này
      },
    ],
  },
};

export default nextConfig;