'use client';

import dynamic from 'next/dynamic';

const ChatAppRouter = dynamic(() => import('@/frontend/ChatAppRouter'), { ssr: false });

export default function Home() {
  return <ChatAppRouter />;
}
