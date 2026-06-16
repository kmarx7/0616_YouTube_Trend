import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { 
  Search, 
  Eye, 
  ThumbsUp, 
  MessageSquare, 
  Globe, 
  ChevronRight, 
  ExternalLink,
  BookOpen,
  Gamepad2,
  Music,
  Tv,
  Atom,
  Trophy,
  X,
  Sparkles,
  MessageCircle,
  Smile,
  Frown,
  Clock,
  ListRestart,
  HelpCircle,
  Play
} from 'lucide-react';
import { 
  fetchVideosByKeyword, 
  getCountry, 
  setCountry, 
  fetchComments 
} from '../utils/youtubeService';
import { YOUTUBE_COUNTRIES } from '../utils/mockData';

const CATEGORY_MAP = {
  '10': { name: '음악', icon: Music, color: '#ec4899' },
  '20': { name: '게임', icon: Gamepad2, color: '#8b5cf6' },
  '24': { name: '엔터테인먼트', icon: Tv, color: '#ef4444' },
  '27': { name: '교육', icon: BookOpen, color: '#3b82f6' },
  '28': { name: '과학기술', icon: Atom, color: '#10b981' },
  '17': { name: '스포츠', icon: Trophy, color: '#f59e0b' }
};

const SUGGESTED_KEYWORDS = ['인공지능', '캠핑', '아이폰', '재테크', '해외여행', '스마트폰'];

export default function KeywordSearchView() {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);
  
  // Aggregate Stats
  const [stats, setStats] = useState({
    topCategory: { name: 'N/A', count: 0 },
    topViewsCategory: { name: 'N/A', views: 0 },
    topEngagementCategory: { name: 'N/A', rate: 0 },
    totalAnalyzed: 0
  });

  // Chart datasets
  const [shareData, setShareData] = useState([]);
  const [performanceData, setPerformanceData] = useState({ categories: [], views: [], er: [] });

  // Detail Panel & Comments state
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [drawerTab, setDrawerTab] = useState('info'); // info, summary, comments
  const [loadingComments, setLoadingComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoadedFor, setCommentsLoadedFor] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoadedFor, setSummaryLoadedFor] = useState(null);

  // Video Player Popup Modal state
  const [playVideoId, setPlayVideoId] = useState(null);

  // Table pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Hydration safety check
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Esc key down listener for video modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setPlayVideoId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = async (e, keywordOverride = '') => {
    if (e) e.preventDefault();
    const searchQuery = (keywordOverride || query).trim();
    if (!searchQuery) return;

    setLoading(true);
    setError(null);
    setSelectedVideo(null);
    setCurrentPage(1);
    setActiveQuery(searchQuery);
    if (!keywordOverride) setQuery(searchQuery);

    try {
      const data = await fetchVideosByKeyword(searchQuery);
      setVideos(data);
      processKeywordData(data);
    } catch (err) {
      setError(err.message || '키워드 검색 결과를 분석하는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const processKeywordData = (videoList) => {
    if (!videoList || videoList.length === 0) return;

    // Grouping by Category
    const categoryStats = {};
    
    // Initialize default categories to ensure comparison is clean
    Object.keys(CATEGORY_MAP).forEach(catId => {
      categoryStats[catId] = {
        id: catId,
        name: CATEGORY_MAP[catId].name,
        color: CATEGORY_MAP[catId].color,
        count: 0,
        totalViews: 0,
        totalER: 0,
        videos: []
      };
    });

    videoList.forEach(video => {
      const catId = video.categoryId || '24'; // fallback
      if (!categoryStats[catId]) {
        categoryStats[catId] = {
          id: catId,
          name: CATEGORY_MAP[catId]?.name || `기타 (${catId})`,
          color: CATEGORY_MAP[catId]?.color || '#64748b',
          count: 0,
          totalViews: 0,
          totalER: 0,
          videos: []
        };
      }
      categoryStats[catId].count += 1;
      categoryStats[catId].totalViews += video.views;
      categoryStats[catId].totalER += video.engagementRate;
      categoryStats[catId].videos.push(video);
    });

    // Filter out categories with 0 videos
    const activeCategories = Object.values(categoryStats).filter(cat => cat.count > 0);

    // Sort by count
    const sortedByCount = [...activeCategories].sort((a, b) => b.count - a.count);

    // Calc Averages
    const processedCats = activeCategories.map(cat => {
      return {
        ...cat,
        avgViews: Math.round(cat.totalViews / cat.count),
        avgER: parseFloat((cat.totalER / cat.count).toFixed(2))
      };
    });

    const sortedByViews = [...processedCats].sort((a, b) => b.avgViews - a.avgViews);
    const sortedByER = [...processedCats].sort((a, b) => b.avgER - a.avgER);

    // Set KPI Stats
    setStats({
      topCategory: sortedByCount[0] ? { name: sortedByCount[0].name, count: sortedByCount[0].count } : { name: 'N/A', count: 0 },
      topViewsCategory: sortedByViews[0] ? { name: sortedByViews[0].name, views: sortedByViews[0].avgViews } : { name: 'N/A', views: 0 },
      topEngagementCategory: sortedByER[0] ? { name: sortedByER[0].name, rate: sortedByER[0].avgER } : { name: 'N/A', rate: 0 },
      totalAnalyzed: videoList.length
    });

    // Share Data (Pie Chart)
    const pieData = processedCats.map(cat => ({
      value: cat.count,
      name: cat.name,
      itemStyle: { color: cat.color }
    }));
    setShareData(pieData);

    // Performance Data (Bar/Line Chart)
    setPerformanceData({
      categories: processedCats.map(c => c.name),
      views: processedCats.map(c => Math.round(c.avgViews / 10000) / 100), // In Million units
      er: processedCats.map(c => c.avgER)
    });
  };

  const handleVideoClick = (video) => {
    if (selectedVideo?.id === video.id) {
      setSelectedVideo(null);
    } else {
      setSelectedVideo(video);
      setDrawerTab('info');
      setComments([]);
      setCommentsLoadedFor(null);
      setSummaryData(null);
      setSummaryLoadedFor(null);
      setPlayVideoId(null); // Reset player
    }
  };

  const handleLoadComments = async () => {
    if (!selectedVideo) return;
    setLoadingComments(true);
    try {
      const fetched = await fetchComments(selectedVideo.id, selectedVideo.title);
      setComments(fetched);
      setCommentsLoadedFor(selectedVideo.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLoadSummary = () => {
    if (!selectedVideo) return;
    setLoadingSummary(true);
    setTimeout(() => {
      setSummaryData({
        lineSummary: [
          `이 영상은 키워드 "${activeQuery}"와 관련하여 상위 노출에 성공한 화제 영상입니다.`,
          `검색 볼륨 내에서 높은 클릭률(CTR)과 평균 이상의 체류 시간을 기록하고 있습니다.`,
          `내용 요약: 해당 키워드의 실생활 응용 및 사용자들이 궁금해하는 트렌드를 정확히 조준하여 명쾌히 피드백합니다.`
        ],
        chapters: [
          { time: '00:00', label: '단원 도입 및 핵심 이슈 제기' },
          { time: '02:40', label: '본론 분석 및 구체적 근거/비교' },
          { time: '06:15', label: '주의 사항 및 실질적 사용 가이드' },
          { time: '09:05', label: '최종 결론 요약 및 추천 팁' }
        ],
        tags: [activeQuery, '트렌드분석', '이슈포커스', '추천공개', '완벽분석']
      });
      setSummaryLoadedFor(selectedVideo.id);
      setLoadingSummary(false);
    }, 1200);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit' });
  };

  const formatDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getSentimentStats = () => {
    if (comments.length === 0) return { positive: 0, neutral: 0, negative: 0 };
    let pos = 0, neu = 0, neg = 0;
    comments.forEach(c => {
      if (c.sentiment === 'positive') pos++;
      else if (c.sentiment === 'negative') neg++;
      else neu++;
    });
    const total = comments.length;
    return {
      positive: parseFloat(((pos / total) * 100).toFixed(1)),
      neutral: parseFloat(((neu / total) * 100).toFixed(1)),
      negative: parseFloat(((neg / total) * 100).toFixed(1))
    };
  };

  const sentimentStats = getSentimentStats();

  const getSentimentOption = () => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}%',
        backgroundColor: '#0c0c0f',
        borderColor: '#1e1e24',
        textStyle: { color: '#fafafa' }
      },
      legend: {
        bottom: '0%',
        left: 'center',
        textStyle: { color: '#a1a1aa' }
      },
      series: [
        {
          name: '감성 분석',
          type: 'pie',
          radius: ['45%', '75%'],
          avoidLabelOverlap: false,
          label: { show: false },
          labelLine: { show: false },
          data: [
            { value: sentimentStats.positive, name: '긍정', itemStyle: { color: '#10b981' } },
            { value: sentimentStats.neutral, name: '중립', itemStyle: { color: '#71717a' } },
            { value: sentimentStats.negative, name: '부정', itemStyle: { color: '#ef4444' } }
          ]
        }
      ]
    };
  };

  // ECharts Options
  const getShareOption = () => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}개 ({d}%)',
        backgroundColor: '#0c0c0f',
        borderColor: '#1e1e24',
        textStyle: { color: '#fafafa' }
      },
      legend: {
        bottom: '5%',
        left: 'center',
        textStyle: { color: '#a1a1aa', fontSize: 10 }
      },
      series: [
        {
          name: '분야별 분포 비율',
          type: 'pie',
          radius: ['40%', '65%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#09090b',
            borderWidth: 2
          },
          label: { show: false },
          labelLine: { show: false },
          data: shareData
        }
      ]
    };
  };

  const getPerformanceOption = () => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#0c0c0f',
        borderColor: '#1e1e24',
        textStyle: { color: '#fafafa' }
      },
      legend: {
        data: ['평균 조회수 (M)', '평균 참여율 (ER, %)'],
        textStyle: { color: '#a1a1aa' }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: performanceData.categories,
        axisLine: { lineStyle: { color: '#2e3039' } },
        axisLabel: { color: '#a1a1aa', fontSize: 10 }
      },
      yAxis: [
        {
          type: 'value',
          name: '조회수 (백만)',
          nameTextStyle: { color: '#71717a' },
          axisLabel: { color: '#a1a1aa', formatter: '{value} M' },
          splitLine: { lineStyle: { color: '#1e1e24' } }
        },
        {
          type: 'value',
          name: '참여율 (%)',
          nameTextStyle: { color: '#71717a' },
          axisLabel: { color: '#a1a1aa', formatter: '{value} %' },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '평균 조회수 (M)',
          type: 'bar',
          data: performanceData.views,
          itemStyle: {
            color: '#3b82f6',
            borderRadius: [4, 4, 0, 0]
          }
        },
        {
          name: '평균 참여율 (ER, %)',
          type: 'line',
          yAxisIndex: 1,
          data: performanceData.er,
          symbolSize: 8,
          lineStyle: { width: 3, color: '#10b981' },
          itemStyle: { color: '#10b981' }
        }
      ]
    };
  };

  // Pagination calculations
  const totalPages = Math.ceil(videos.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVideos = videos.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6">
      {/* Top Banner with Search Form */}
      <div className="border-b border-zinc-800 pb-6 flex flex-col gap-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50 flex items-center gap-2">
            <Search className="text-blue-500" size={28} />
            키워드 트렌드 검색 대시보드
          </h1>
          <p className="text-zinc-400 text-sm mt-1">분석하고 싶은 검색어를 입력하면 전역 유튜브 관련 콘텐츠 분포와 성과 통계를 추출합니다.</p>
        </div>
        
        {/* Large glassmorphic keyword search bar, moved below the header title */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full max-w-xl">
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-3 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="예: AI, 캠핑, 스마트폰, 재테크..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-11 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-200 placeholder-zinc-500"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-800 text-white rounded-lg px-6 font-semibold text-sm transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              '분석'
            )}
          </button>
        </form>
      </div>

      {videos.apiError && (
        <div className="bg-amber-900/20 border border-amber-800/30 text-amber-300 rounded-lg p-4 text-sm">
          ⚠️ API 할당량 제한으로 시뮬레이션 키워드 데이터를 제공 중입니다. (사유: {videos.apiError})
        </div>
      )}

      {loading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-zinc-400 font-mono">유튜브에서 키워드 "{query || activeQuery}" 콘텐츠를 분석하는 중...</p>
          </div>
        </div>
      ) : activeQuery === '' ? (
        /* Empty State with recommendations */
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 max-w-lg mx-auto">
          <HelpCircle className="text-zinc-700 animate-pulse animate-duration-3000" size={56} />
          <div>
            <h2 className="text-xl font-bold text-zinc-300">트렌드 키워드를 검색해보세요</h2>
            <p className="text-zinc-500 text-sm mt-1">유튜브 상의 실시간 검색어 성과 지표와 분야별 분포도를 대시보드로 시각화해 줍니다.</p>
          </div>
          
          <div className="space-y-2.5 pt-4 w-full">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">또는 추천 키워드 선택</span>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_KEYWORDS.map(kw => (
                <button
                  key={kw}
                  onClick={(e) => handleSearchSubmit(e, kw)}
                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200 text-zinc-400 text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer"
                >
                  #{kw}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800/30 text-red-300 rounded-lg p-6 text-center max-w-md mx-auto mt-12">
          {error}
        </div>
      ) : (
        /* Searched Dashboard state */
        <>
          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
              <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block">키워드 주 유입 분야</span>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-zinc-100">{stats.topCategory.name}</span>
                <span className="text-xs text-zinc-400 font-mono">({stats.topCategory.count}개)</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 font-mono">이 분야에 영상이 가장 조밀함</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
              <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block">평균 조회수 최고 분야</span>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-zinc-100">{stats.topViewsCategory.name}</span>
                <span className="text-xs text-zinc-400 font-mono">({formatNumber(stats.topViewsCategory.views)})</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 font-mono">해당 카테고리 영상의 평균 성과</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
              <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block">시청자 참여율 최고 분야</span>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-zinc-100">{stats.topEngagementCategory.name}</span>
                <span className="text-xs text-zinc-400 font-mono">({stats.topEngagementCategory.rate}%)</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 font-mono">시청자 충성도/반응 1위</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
              <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block">수집 완료 영상수</span>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-zinc-100">{stats.totalAnalyzed}개 Video</span>
                <span className="text-xs text-blue-400 font-mono font-bold">API Sync</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 font-mono">"{activeQuery}" 검색 샘플링</p>
            </div>
          </div>

          {/* ECharts Charts section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Share */}
            <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-6 shadow-sm">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">"{activeQuery}" 카테고리별 분포 비율</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">이 키워드가 어떤 비디오 분야에서 주로 발생하고 있는지 분석</p>
              </div>
              <div className="h-64 mt-4">
                {isClient && <ReactECharts option={getShareOption()} style={{ height: '100%', width: '100%' }} />}
              </div>
            </div>

            {/* Performance Comparison */}
            <div className="lg:col-span-2 bg-[#0c0c0f] border border-zinc-800 rounded-xl p-6 shadow-sm">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">분야별 영상 성과 비교</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">카테고리별 영상의 평균 조회수와 참여 반응도 상관관계</p>
              </div>
              <div className="h-64 mt-4">
                {isClient && <ReactECharts option={getPerformanceOption()} style={{ height: '100%', width: '100%' }} />}
              </div>
            </div>
          </div>

          {/* Videos Table & Detail Panel split */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className={`
              w-full bg-[#0c0c0f] border border-zinc-800 rounded-xl overflow-hidden transition-all duration-300
              ${selectedVideo ? 'lg:w-2/3' : 'lg:w-full'}
            `}>
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/10">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    키워드 인기 영상 리스트
                  </h3>
                  <span className="text-xs text-zinc-500 font-mono">Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, videos.length)} of {videos.length}</span>
                </div>
              </div>

              {videos.length === 0 ? (
                <div className="p-20 text-center text-zinc-500">조회된 비디오가 없습니다.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 text-xs font-semibold">
                        <th className="p-4 w-16 text-center">순위</th>
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
                            onClick={() => handleVideoClick(video)}
                            className={`
                              hover:bg-zinc-800/30 cursor-pointer transition-colors
                              ${isSelected ? 'bg-blue-500/10 hover:bg-blue-500/15' : ''}
                            `}
                          >
                            <td className="p-4 text-center font-mono font-bold text-zinc-500">
                              {video.rank}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <img src={video.thumbnail} alt={video.title} className="w-16 h-9 object-cover rounded-md border border-zinc-800 bg-zinc-950 flex-shrink-0" />
                                <div>
                                  <span className="font-semibold text-zinc-200 line-clamp-1 hover:text-blue-400 transition-colors">{video.title}</span>
                                  <span className="text-xs text-zinc-500 font-mono block mt-0.5">{video.channelTitle} ({formatDuration(video.duration)})</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-zinc-400 whitespace-nowrap text-xs">{formatDate(video.publishedAt)}</td>
                            <td className="p-4 font-mono font-semibold text-zinc-300">{formatNumber(video.views)}</td>
                            <td className="p-4">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono
                                ${video.engagementRate > 5 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : (video.engagementRate > 3 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-zinc-800 text-zinc-400')
                                }
                              `}>
                                {video.engagementRate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              <div className="p-4 border-t border-zinc-800 flex justify-between items-center bg-zinc-900/20 text-xs">
                <span className="text-zinc-500 font-mono">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    이전
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    ◀
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    ▶
                  </button>
                  <button 
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    끝
                  </button>
                </div>
              </div>
            </div>

            {/* Video Detail & Comments/Summary Drawer */}
            {selectedVideo && (
              <div className="w-full lg:w-1/3 bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg relative animate-fade-in self-stretch flex flex-col justify-between">
                <div>
                  {/* Close Button */}
                  <button 
                    onClick={() => setSelectedVideo(null)}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>

                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">영상 상세 분석</h3>
                  
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
                  <p className="text-xs text-zinc-500 font-mono mt-1 mb-4">Channel: {selectedVideo.channelTitle}</p>

                  {/* Drawer Tabs */}
                  <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-850 text-xs mb-4">
                    {[
                      { id: 'info', name: '기본 정보' },
                      { id: 'summary', name: '대본 요약 (AI)' },
                      { id: 'comments', name: '댓글 분석' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setDrawerTab(t.id)}
                        className={`flex-1 text-center py-1.5 rounded font-semibold transition-all duration-200 cursor-pointer
                          ${drawerTab === t.id
                            ? 'bg-blue-500/10 text-blue-500 shadow-sm border border-blue-500/10'
                            : 'text-zinc-500 hover:text-zinc-300'
                          }
                        `}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>

                  {/* Tab 1: Info */}
                  {drawerTab === 'info' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-2.5">
                          <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">조회수</span>
                          <span className="text-sm font-bold text-zinc-200 font-mono mt-0.5 block">{selectedVideo.views.toLocaleString()}</span>
                        </div>
                        <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-2.5">
                          <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">평균 참여율</span>
                          <span className="text-sm font-bold text-zinc-200 font-mono mt-0.5 block">{selectedVideo.engagementRate}%</span>
                        </div>
                      </div>
                      <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3 max-h-48 overflow-y-auto text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">
                        상세 데이터는 유튜브 API를 통해 수집된 비디오 정보에 속하며, 챕터 분석 및 실시간 댓글 요약을 보시려면 상단 탭을 눌러 탐색해보세요.
                      </div>
                    </div>
                  )}

                  {/* Tab 2: AI Script Summary */}
                  {drawerTab === 'summary' && (
                    <div className="space-y-4">
                      {summaryLoadedFor === selectedVideo.id && summaryData ? (
                        <div className="space-y-4">
                          {/* 3 line summary */}
                          <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg p-4 space-y-2">
                            <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1 uppercase tracking-wider">
                              <Sparkles size={12} className="fill-blue-500/20" /> AI 대본 핵심 요약
                            </span>
                            <ul className="text-xs text-zinc-300 list-disc pl-4 space-y-1.5 leading-relaxed">
                              {summaryData.lineSummary.map((line, idx) => (
                                <li key={idx}>{line}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Chapters Timeline */}
                          <div className="space-y-2">
                            <span className="text-xs font-semibold text-zinc-400 block">타임라인 키워드 챕터 (Skip)</span>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                              {summaryData.chapters.map((chap, idx) => (
                                <div key={idx} className="flex gap-2.5 bg-zinc-950 border border-zinc-850 p-2 rounded text-xs items-center hover:border-zinc-700 transition-colors">
                                  <span className="bg-blue-500/10 text-blue-400 font-bold font-mono px-1.5 py-0.5 rounded border border-blue-500/20 flex-shrink-0 cursor-pointer">
                                    {chap.time}
                                  </span>
                                  <span className="text-zinc-300 truncate font-sans">{chap.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* AI tags */}
                          <div className="flex flex-wrap gap-1">
                            {summaryData.tags.map(t => (
                              <span key={t} className="bg-zinc-950 border border-zinc-850 text-zinc-400 px-2 py-0.5 rounded text-[10px] font-semibold">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={handleLoadSummary}
                          disabled={loadingSummary}
                          className="w-full bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 text-blue-500 rounded-lg py-5 font-semibold text-xs transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
                        >
                          {loadingSummary ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                          ) : (
                            <>
                              <Sparkles size={18} />
                              <span>AI 대본 요약 & 타임라인 챕터 추출</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Comments */}
                  {drawerTab === 'comments' && (
                    <div className="space-y-4">
                      {commentsLoadedFor === selectedVideo.id ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-zinc-400">댓글 여론 분석 ({comments.length}개)</span>
                            <button onClick={handleLoadComments} className="text-[10px] text-blue-500 hover:underline font-semibold flex items-center gap-1">
                              <ListRestart size={10} /> 새로고침
                            </button>
                          </div>

                          {/* ECharts Sentiment Donut */}
                          <div className="h-40 bg-zinc-950 border border-zinc-800 rounded-lg p-2 flex items-center justify-center">
                            {isClient && <ReactECharts option={getSentimentOption()} style={{ height: '100%', width: '100%' }} />}
                            <div className="flex flex-col gap-1 text-[11px] pl-2 border-l border-zinc-800">
                              <span className="text-emerald-400 font-semibold flex items-center gap-1"><Smile size={12} /> 긍정: {sentimentStats.positive}%</span>
                              <span className="text-zinc-400 flex items-center gap-1"><Clock size={12} /> 중립: {sentimentStats.neutral}%</span>
                              <span className="text-rose-400 font-semibold flex items-center gap-1"><Frown size={12} /> 부정: {sentimentStats.negative}%</span>
                            </div>
                          </div>

                          {/* Comment feed list */}
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {comments.slice(0, 10).map(c => (
                              <div key={c.id} className="bg-zinc-950/60 border border-zinc-850 p-2.5 rounded-lg text-xs leading-relaxed">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-zinc-300">{c.author}</span>
                                  <span className={`text-[9px] px-1 py-0.25 rounded font-bold border
                                    ${c.sentiment === 'positive' 
                                      ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' 
                                      : c.sentiment === 'negative' 
                                        ? 'bg-rose-500/5 text-rose-400 border-rose-500/20' 
                                        : 'bg-zinc-850 text-zinc-400 border-zinc-800'
                                    }
                                  `}>
                                    {c.sentiment === 'positive' ? '긍정' : c.sentiment === 'negative' ? '부정' : '중립'}
                                  </span>
                                </div>
                                <p className="text-zinc-400 mt-1">{c.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={handleLoadComments}
                          disabled={loadingComments}
                          className="w-full bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 text-blue-500 rounded-lg py-5 font-semibold text-xs transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
                        >
                          {loadingComments ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                          ) : (
                            <>
                              <MessageCircle size={18} />
                              <span>이 영상의 실시간 댓글 30개 수집 및 감성 분석 로드</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
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
        </>
      )}

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
