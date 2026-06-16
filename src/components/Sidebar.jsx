import React from 'react';
import { 
  BarChart2, 
  Flame, 
  FileText, 
  Users, 
  Settings, 
  Menu,
  X,
  TrendingUp,
  Search
} from 'lucide-react';

const YoutubeLogo = ({ size = 24, className }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    fill="currentColor" 
    className={className}
  >
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.003 3.003 0 0 0 .502 6.163C0 8.07 0 12 0 12s0 3.93.502 5.837a3.003 3.003 0 0 0 2.11 2.107c1.878.507 9.38.507 9.38.507s7.507 0 9.379-.507a3.003 3.003 0 0 0 2.11-2.107C24 15.93 24 12 24 12s0-3.93-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, setMobileOpen }) {
  const menuItems = [
    { id: 'trend-overview', name: '트렌드 오버뷰', icon: TrendingUp },
    { id: 'keyword-search', name: '키워드 트렌드', icon: Search },
    { id: 'dashboard', name: '채널 분석', icon: BarChart2 },
    { id: 'trending', name: '급상승 TOP 100', icon: Flame },
    { id: 'trend-report', name: '분야별 AI 분석 보고서', icon: FileText },
    { id: 'competitors', name: '경쟁 채널 분석', icon: Users },
    { id: 'settings', name: '설정', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 md:hidden hover:bg-zinc-800 transition-colors"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 border-r border-zinc-800 bg-[#0c0c0f]/85 backdrop-blur-md transition-transform duration-300 ease-in-out
        md:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Section */}
        <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-6">
          <YoutubeLogo className="text-red-500 fill-red-500" size={28} />
          <span className="text-xl font-bold tracking-tight text-zinc-50 bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
            TubePulse
          </span>
          <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded border border-blue-500/20">
            PRO
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`
                  flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.05)] font-bold' 
                    : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 border border-transparent'
                  }
                `}
              >
                <Icon size={18} className={isActive ? 'text-blue-500' : 'text-zinc-400'} />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="absolute bottom-6 left-6 right-6 text-xs text-zinc-500 font-mono">
          <div>Status: Next.js App</div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>API Bridge Connected</span>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}
    </>
  );
}
