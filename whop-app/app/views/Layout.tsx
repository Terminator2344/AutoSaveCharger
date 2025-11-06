'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

interface LayoutProps {
  devMode?: boolean;
  children: React.ReactNode;
}

export default function Layout({ devMode, children }: LayoutProps) {
  const pathname = usePathname();
  const isInExperiences = pathname?.includes('/experiences/');
  const experienceIdMatch = pathname?.match(/\/experiences\/([^\/]+)/);
  const experienceId = experienceIdMatch ? experienceIdMatch[1] : null;
  
  const isDashboard = pathname?.startsWith('/dashboard') || pathname?.includes('/dashboard') || pathname === '/';
  const isEvents = pathname?.startsWith('/events') || pathname?.includes('/events');
  
  const dashboardHref = isInExperiences && experienceId ? `/experiences/${experienceId}/dashboard` : '/dashboard';
  const eventsHref = isInExperiences && experienceId ? `/experiences/${experienceId}/events` : '/events';

  return (
    <>
      <header className="sticky top-0 z-50 bg-black/85 backdrop-blur-xl border-b border-orange-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.7),0_0_1px_rgba(255,85,0,0.2)]">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="text-[24px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ff5500] via-[#ff8800] to-[#ffcc66] drop-shadow-[0_0_20px_rgba(255,136,0,0.6)]">
            Revenue Recovery Assistant
          </div>
          <nav className="flex gap-2 text-sm font-semibold">
            <Link
              href={dashboardHref}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                isDashboard
                  ? 'text-[#ffcc66] bg-gradient-to-r from-[#ff5500]/30 to-[#ff8800]/30 border border-[#ff5500]/50 shadow-[0_0_15px_rgba(255,85,0,0.4)] hover:shadow-[0_0_25px_rgba(255,136,0,0.6)] hover:border-[#ff8800]'
                  : 'text-gray-400 hover:text-[#ffaa00] hover:bg-[#ff5500]/10 hover:border hover:border-[#ff5500]/30'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href={eventsHref}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                isEvents
                  ? 'text-[#ffcc66] bg-gradient-to-r from-[#ff5500]/30 to-[#ff8800]/30 border border-[#ff5500]/50 shadow-[0_0_15px_rgba(255,85,0,0.4)] hover:shadow-[0_0_25px_rgba(255,136,0,0.6)] hover:border-[#ff8800]'
                  : 'text-gray-400 hover:text-[#ffaa00] hover:bg-[#ff5500]/10 hover:border hover:border-[#ff5500]/30'
              }`}
            >
              Events
            </Link>
            <Link
              href="/logout"
              className="px-4 py-2 rounded-lg text-gray-400 hover:text-[#ffaa00] hover:bg-[#ff5500]/10 hover:border hover:border-[#ff5500]/30 transition-all duration-300"
            >
              Logout
            </Link>
          </nav>
        </div>
      </header>

      {devMode && (
        <div className="text-center text-xs text-[#ff8800] bg-gradient-to-r from-[#ff5500]/10 to-[#ff8800]/10 py-2 border-b border-[#ff5500]/30 shadow-[0_2px_8px_rgba(255,85,0,0.2)]">
          🔥 Dev mode: Whop iframe not detected.
        </div>
      )}

      <main
        className="min-h-screen text-gray-200 font-['Inter',sans-serif]"
        style={{
          background: `
            radial-gradient(circle at 20% 20%, rgba(255, 136, 0, 0.08) 0%, transparent 60%),
            radial-gradient(circle at 80% 80%, rgba(255, 85, 0, 0.06) 0%, transparent 60%),
            linear-gradient(to bottom, #0a0a0a 0%, #050505 100%)
          `,
          backgroundAttachment: 'fixed',
        }}
      >
        {children}
      </main>
    </>
  );
}
