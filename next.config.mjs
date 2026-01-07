import { Value } from '@radix-ui/react-select';
import { Key } from 'lucide-react';

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental:{
    serverComponentsHmrCache: false
  },

  images: {
    remotePatterns:[
      {
        protocol:"https",
        hostname:"dmvoqjlvvqjaclktviqj.supabase.co"
      },
    ],
  },

  reactCompiler: true,
  async headers(){
    return [
      {
        source:"/embed",
        headers: [
          {
            key:"Content-Security-Policy",
            value: "frame-src 'self' https://vehiqls-waitlist-page.created.app"
          }

        ]

      }
    ]
  }
};

export default nextConfig;
