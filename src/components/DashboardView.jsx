import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { 
  Users, 
  Eye, 
  Video, 
  TrendingUp, 
  Search, 
  Calendar, 
  Clock, 
  ChevronRight,
  ExternalLink,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  X,
  Play
} from 'lucide-react';
import { fetchChannelData } from '../utils/youtubeService';

export default function DashboardView() {
  const [query, setQuery] = useState('IT_Tech_Reviewer');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  // Table and drawer state
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Video Player Popup Modal state
  const [playVideoId, setPlayVideoId] = useState(null);

  // Hydration safety check
  const [isClient, setIsClient] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setSelectedVideo(null);
    setCurrentPage(1);

    try {
      const result = await fetchChannelData(query);
      setData(result);
    } catch (err) {
      setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    handleSearch();
  }, []);

  // Esc key down listener for video modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setPlayVideoId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-zinc-400 font-mono">채널 분석 데이터를 로드하는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center p-6">
        <div className="max-w-md text-center bg-zinc-900 border border-zinc-800 rounded-xl p-8">
          <X className="mx-auto text-red-500 mb-4" size={40} />
          <h3 className="text-xl font-bold text-zinc-100 mb-2">오류가 발생했습니다</h3>
          <p className="text-zinc-400 mb-6">{error || '데이터가 존재하지 않습니다.'}</p>
          <button 
            onClick={() => handleSearch()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 font-medium transition-colors cursor-pointer"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const { channelInfo, subscriberTrend, videos, categories, uploadTimeStats } = data;

  // Format Helper
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ECharts Line Chart Option (Subscriber Trend)
  const getSubTrendOption = () => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0c0c0f',
        borderColor: '#1e1e24',
        textStyle: { color: '#fafafa' }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: subscriberTrend.map(t => t.month),
        axisLine: { lineStyle: { color: '#2e3039' } },
        axisLabel: { color: '#a1a1aa' }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#2e3039' } },
        axisLabel: { color: '#a1a1aa' },
        splitLine: { lineStyle: { color: '#1e1e24' } }
      },
      series: [{
        name: '구독자 수',
        type: 'line',
        data: subscriberTrend.map(t => t.subscribers),
        smooth: true,
        lineStyle: { width: 3, color: '#2563eb' },
        itemStyle: { color: '#2563eb' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(37, 99, 235, 0.25)' },
              { offset: 1, color: 'rgba(37, 99, 235, 0)' }
            ]
          }
        }
      }]
    };
  };

  // ECharts Pie Chart Option (Categories)
  const getCategoryOption = () => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#0c0c0f',
        borderColor: '#1e1e24',
        textStyle: { color: '#fafafa' }
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        textStyle: { color: '#a1a1aa' }
      },
      series: [
        {
          name: '콘텐츠 카테고리',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#0c0c0f',
            borderWidth: 2
          },
          label: { show: false },
          labelLine: { show: false },
          data: categories.map((c, idx) => ({
            value: c.count,
            name: c.name,
            itemStyle: {
              color: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"][idx % 4]
            }
          }))
        }
      ]
    };
  };

  // Pagination Logic
  const totalPages = Math.ceil(videos.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVideos = videos.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50">채널 분석 대시보드</h1>
          <p className="text-zinc-400 text-sm mt-1">지정한 유튜브 채널의 상세 퍼포먼스와 콘텐츠 전략을 시각화합니다.</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-2.5 text-zinc-500" size={18} />
            <input
              type="text"
              placeholder="채널명 또는 핸들(ID) 입력..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-200"
            />
          </div>
          <button 
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 font-medium text-sm transition-colors shadow-sm cursor-pointer"
          >
            분석
          </button>
        </form>
      </div>

      {data.apiError && (
        <div className="bg-amber-900/20 border border-amber-800/30 text-amber-300 rounded-lg p-4 text-sm flex items-center justify-between">
          <span>⚠️ API 할당량 제한 또는 오류로 인해 실시간 시뮬레이션 데이터를 제공하고 있습니다. (사유: {data.apiError})</span>
        </div>
      )}

      {/* Channel Banner & Info Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-md">
        {channelInfo.bannerImage ? (
          <div className="h-32 w-full bg-cover bg-center" style={{ backgroundImage: `url(${channelInfo.bannerImage})` }} />
        ) : (
          <div className="h-24 w-full bg-gradient-to-r from-blue-900/30 to-zinc-900 border-b border-zinc-800" />
        )}
        <div className="p-6 flex flex-col md:flex-row md:items-center gap-4">
          <img 
            src={channelInfo.profileImage || 'https://api.dicebear.com/7.x/initials/svg?seed=Channel'} 
            alt={channelInfo.title} 
            className="w-20 h-20 rounded-full border-2 border-zinc-800 -mt-10 md:-mt-16 bg-zinc-950 object-cover self-start md:self-auto"
          />
          <div className="flex-grow">
            <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
              {channelInfo.title}
              <a 
                href={`https://youtube.com/channel/${channelInfo.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-500 hover:text-blue-500 transition-colors"
              >
                <ExternalLink size={16} />
              </a>
            </h2>
            <p className="text-zinc-400 text-sm mt-1 max-w-2xl line-clamp-2">{channelInfo.description || '채널 설명이 제공되지 않습니다.'}</p>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">구독자 수</span>
            <span className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500"><Users size={16} /></span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-zinc-100">{formatNumber(channelInfo.subscribers)}</span>
            <span className="bg-emerald-500/10 text-emerald-500 text-xs px-1.5 py-0.5 rounded font-mono">+12.5%</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1.5 font-mono">전월 대비 순증가</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">누적 조회수</span>
            <span className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500"><Eye size={16} /></span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-zinc-100">{formatNumber(channelInfo.views)}</span>
            <span className="bg-emerald-500/10 text-emerald-500 text-xs px-1.5 py-0.5 rounded font-mono">+8.3%</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1.5 font-mono">채널 전체 합산</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">업로드 영상 수</span>
            <span className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500"><Video size={16} /></span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-zinc-100">{channelInfo.videos}</span>
            <span className="text-zinc-400 text-xs px-1.5 py-0.5 rounded font-mono">Total</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1.5 font-mono">숏폼 및 롱폼 합산</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">평균 참여율(ER)</span>
            <span className="p-1.5 bg-purple-500/10 rounded-lg text-purple-500"><TrendingUp size={16} /></span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-zinc-100">
              {(videos.reduce((acc, v) => acc + v.engagementRate, 0) / (videos.length || 1)).toFixed(2)}%
            </span>
            <span className="bg-emerald-500/10 text-emerald-500 text-xs px-1.5 py-0.5 rounded font-mono">+1.2%</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1.5 font-mono">조회수 대비 좋아요+댓글</p>
        </div>
      </div>

      {/* Main Charts Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscriber Trend Chart Card */}
        <div className="lg:col-span-2 bg-[#0c0c0f] border border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">구독자 추이 (최근 12달)</h3>
            <span className="text-xs text-zinc-500 font-mono">Total growth curve</span>
          </div>
          <div className="h-72">
            {isClient && <ReactECharts option={getSubTrendOption()} style={{ height: '100%', width: '100%' }} />}
          </div>
        </div>

        {/* Content Category Ratio Chart Card */}
        <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">카테고리 비율</h3>
            <span className="text-xs text-zinc-500 font-mono">Video count ratio</span>
          </div>
          <div className="h-72">
            {isClient && <ReactECharts option={getCategoryOption()} style={{ height: '100%', width: '100%' }} />}
          </div>
        </div>
      </div>

      {/* Strategy / Upload frequency Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-zinc-100">요일 및 시간대별 업로드 빈도</h3>
            <p className="text-zinc-500 text-xs mt-0.5">가장 적극적으로 업로드가 일어나는 골든 타임을 모니터링합니다.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-xs font-semibold uppercase text-zinc-400 mb-3 flex items-center gap-1.5">
              <Calendar size={14} /> 요일별 업로드 빈도
            </h4>
            <div className="space-y-2.5">
              {uploadTimeStats.days.map((day) => {
                const maxVal = Math.max(...uploadTimeStats.days.map(d => d.count));
                const percentage = (day.count / (maxVal || 1)) * 100;
                return (
                  <div key={day.name} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400 w-6 font-medium">{day.name}</span>
                    <div className="flex-grow bg-zinc-800 rounded-full h-3 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-300" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="text-xs font-mono text-zinc-400 w-8 text-right">{day.count}회</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase text-zinc-400 mb-3 flex items-center gap-1.5">
              <Clock size={14} /> 시간대별 업로드 빈도
            </h4>
            <div className="space-y-2.5">
              {uploadTimeStats.hours.map((hour) => {
                const maxVal = Math.max(...uploadTimeStats.hours.map(h => h.count));
                const percentage = (hour.count / (maxVal || 1)) * 100;
                return (
                  <div key={hour.name} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400 w-32 font-medium">{hour.name}</span>
                    <div className="flex-grow bg-zinc-800 rounded-full h-3 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="text-xs font-mono text-zinc-400 w-8 text-right">{hour.count}회</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Table & Side Panel split layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Videos Table */}
        <div className={`
          w-full bg-[#0c0c0f] border border-zinc-800 rounded-xl overflow-hidden transition-all duration-300
          ${selectedVideo ? 'lg:w-2/3' : 'lg:w-full'}
        `}>
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-zinc-100">최근 업로드 영상 성과</h3>
            <span className="text-xs text-zinc-500 font-mono">Total {videos.length} videos</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 text-xs font-semibold">
                  <th className="p-4">영상 정보</th>
                  <th className="p-4">업로드 일자</th>
                  <th className="p-4">조회수</th>
                  <th className="p-4">참여율</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-sm">
                {currentVideos.map((video) => {
                  const isSelected = selectedVideo?.id === video.id;
                  return (
                    <tr 
                      key={video.id}
                      onClick={() => setSelectedVideo(isSelected ? null : video)}
                      className={`
                        hover:bg-zinc-800/30 cursor-pointer transition-colors
                        ${isSelected ? 'bg-blue-500/10 hover:bg-blue-500/15' : ''}
                      `}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={video.thumbnail} alt={video.title} className="w-16 h-9 object-cover rounded-md border border-zinc-800 bg-zinc-950 flex-shrink-0" />
                          <div>
                            <span className="font-semibold text-zinc-200 line-clamp-1 hover:text-blue-400 transition-colors">{video.title}</span>
                            <span className="text-xs text-zinc-500 font-mono block mt-0.5">{formatDuration(video.duration)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-zinc-400 whitespace-nowrap">{formatDate(video.publishedAt)}</td>
                      <td className="p-4 font-mono font-semibold text-zinc-300">{formatNumber(video.views)}</td>
                      <td className="p-4">
                        <div className="w-24">
                          <div className="flex justify-between text-[10px] text-zinc-500 font-mono mb-1">
                            <span>ER</span>
                            <span>{video.engagementRate}%</span>
                          </div>
                          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${video.engagementRate > 5 ? 'bg-emerald-500' : (video.engagementRate > 3 ? 'bg-orange-400' : 'bg-rose-500')}`}
                              style={{ width: `${Math.min(video.engagementRate * 10, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-zinc-800 flex justify-between items-center bg-zinc-900/20 text-xs">
            <span className="text-zinc-500 font-mono">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronsLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Side Detail Panel */}
        {selectedVideo && (
          <div className="w-full lg:w-1/3 bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg relative animate-fade-in self-stretch">
            <button 
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">영상 상세 정보</h3>
            
            {/* Thumbnail with hover Play overlay */}
            <div 
              onClick={() => setPlayVideoId(selectedVideo.id)}
              className="relative w-full aspect-video rounded-lg border border-zinc-850 bg-zinc-950 mb-4 overflow-hidden group cursor-pointer"
            >
              <img src={selectedVideo.thumbnail} alt={selectedVideo.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-red-600 text-white p-3 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <Play size={20} fill="currentColor" />
                </div>
              </div>
            </div>

            <h4 className="text-base font-bold text-zinc-100 leading-snug">{selectedVideo.title}</h4>
            <p className="text-xs text-zinc-500 font-mono mt-1">Uploaded on {formatDate(selectedVideo.publishedAt)}</p>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">조회수</span>
                <span className="text-base font-extrabold text-zinc-200 font-mono mt-1 block">{selectedVideo.views.toLocaleString()}</span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">좋아요</span>
                <span className="text-base font-extrabold text-zinc-200 font-mono mt-1 block">{selectedVideo.likes.toLocaleString()}</span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">댓글</span>
                <span className="text-base font-extrabold text-zinc-200 font-mono mt-1 block">{selectedVideo.comments.toLocaleString()}</span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">평균 참여율</span>
                <span className="text-base font-extrabold text-zinc-200 font-mono mt-1 block">{selectedVideo.engagementRate}%</span>
              </div>
            </div>

            <div className="mt-6">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-2">동영상 설명</span>
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3 max-h-32 overflow-y-auto text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">
                {selectedVideo.description || '설명이 없습니다.'}
              </div>
            </div>
            
            <a 
              href={`https://youtube.com/watch?v=${selectedVideo.id}`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 flex w-full justify-center items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2.5 text-xs font-semibold transition-colors shadow-sm"
            >
              유튜브에서 영상 보기 <ExternalLink size={14} />
            </a>
          </div>
        )}
      </div>

      {/* YouTube Player Modal Popup */}
      {playVideoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl max-w-3xl w-full mx-4 relative">
            <button 
              onClick={() => setPlayVideoId(null)}
              className="absolute -top-8 right-0 text-zinc-400 hover:text-zinc-200 p-1 flex items-center gap-1 text-xs cursor-pointer"
            >
              <X size={14} /> 닫기 (Esc)
            </button>
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${playVideoId}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
            <div className="p-4 bg-zinc-950 border-t border-zinc-850 flex justify-between items-center text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300 truncate max-w-md">{selectedVideo.title}</span>
              <button 
                onClick={() => setPlayVideoId(null)}
                className="bg-zinc-850 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded font-medium cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
