import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { 
  TrendingUp, 
  Flame, 
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
  Play,
  Utensils,
  Compass,
  Smartphone,
  Coins,
  Activity,
  Palette
} from 'lucide-react';
import { 
  fetchTrendingVideos, 
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
  '17': { name: '스포츠', icon: Trophy, color: '#f59e0b' },
  beauty: { name: '뷰티 & 패션', icon: Sparkles, color: '#f43f5e' },
  cooking: { name: '푸드 & 쿠킹', icon: Utensils, color: '#ea580c' },
  travel: { name: '여행 & 아웃도어', icon: Compass, color: '#06b6d4' },
  tech: { name: '테크 & 디바이스', icon: Smartphone, color: '#6366f1' },
  finance: { name: '금융 & 재테크', icon: Coins, color: '#10b981' },
  selfdev: { name: '자기계발 & 생산성', icon: Sparkles, color: '#f59e0b' },
  pets: { name: '반려동물 & 애완동물', icon: Smile, color: '#84cc16' },
  media: { name: '영화 & 드라마 리뷰', icon: Tv, color: '#a855f7' },
  health: { name: '건강 & 피트니스', icon: Activity, color: '#06b6d4' },
  kids: { name: '키즈 & 패밀리', icon: Smile, color: '#fbbf24' },
  culture: { name: '문화 & 예술', icon: Palette, color: '#d946ef' }
};

export default function TrendOverviewView() {
  const [country, setCountryState] = useState('KR');
  // Default selected categories (max 7)
  const [selectedCategories, setSelectedCategories] = useState(['10', '20', '24', '27', '28', '17', 'culture']); 
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);
  
  // Aggregate Stats
  const [stats, setStats] = useState({
    topCategory: { name: 'N/A', count: 0 },
    topViewsCategory: { name: 'N/A', views: 0 },
    topEngagementCategory: { name: 'N/A', rate: 0 },
    totalAnalyzed: 0
  });

  // Category chart datasets
  const [shareData, setShareData] = useState([]);
  const [performanceData, setPerformanceData] = useState({ categories: [], views: [], er: [] });
  const [topVideosPerCategory, setTopVideosPerCategory] = useState([]);

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

  // Hydration safety check
  const [isClient, setIsClient] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTrendingVideos('all');
      setVideos(data);
    } catch (err) {
      setError(err.message || '트렌드 데이터를 분석하는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const processTrendData = (videoList) => {
    if (!videoList || videoList.length === 0) return;

    // 1. Grouping by Category
    const categoryStats = {};
    
    // Initialize ONLY selected categories to ensure comparison is restricted to selection
    selectedCategories.forEach(catId => {
      if (CATEGORY_MAP[catId]) {
        categoryStats[catId] = {
          id: catId,
          name: CATEGORY_MAP[catId].name,
          color: CATEGORY_MAP[catId].color,
          count: 0,
          totalViews: 0,
          totalER: 0,
          videos: []
        };
      }
    });

    videoList.forEach(video => {
      const catId = video.categoryId || '24'; // fallback
      if (categoryStats[catId]) {
        categoryStats[catId].count += 1;
        categoryStats[catId].totalViews += video.views;
        categoryStats[catId].totalER += video.engagementRate;
        categoryStats[catId].videos.push(video);
      }
    });

    // Filter out categories with 0 videos inside our selection (though we initialized, we only want to plot if count > 0)
    const activeCategories = Object.values(categoryStats).filter(cat => cat.count > 0);

    // Sort active categories by share count
    const sortedByCount = [...activeCategories].sort((a, b) => b.count - a.count);

    // Calc Average Views and ER
    const processedCats = activeCategories.map(cat => {
      return {
        ...cat,
        avgViews: Math.round(cat.totalViews / cat.count),
        avgER: parseFloat((cat.totalER / cat.count).toFixed(2))
      };
    });

    const sortedByViews = [...processedCats].sort((a, b) => b.avgViews - a.avgViews);
    const sortedByER = [...processedCats].sort((a, b) => b.avgER - a.avgER);

    // 2. Set Stats KPI
    setStats({
      topCategory: sortedByCount[0] ? { name: sortedByCount[0].name, count: sortedByCount[0].count } : { name: 'N/A', count: 0 },
      topViewsCategory: sortedByViews[0] ? { name: sortedByViews[0].name, views: sortedByViews[0].avgViews } : { name: 'N/A', views: 0 },
      topEngagementCategory: sortedByER[0] ? { name: sortedByER[0].name, rate: sortedByER[0].avgER } : { name: 'N/A', rate: 0 },
      totalAnalyzed: videoList.filter(v => selectedCategories.includes(v.categoryId || '24')).length
    });

    // 3. Share Data (Pie Chart)
    const pieData = processedCats.map(cat => ({
      value: cat.count,
      name: cat.name,
      itemStyle: { color: cat.color }
    }));
    setShareData(pieData);

    // 4. Performance Data (Bar Chart)
    setPerformanceData({
      categories: processedCats.map(c => c.name),
      views: processedCats.map(c => Math.round(c.avgViews / 10000) / 100), // In Million units
      er: processedCats.map(c => c.avgER),
      colors: processedCats.map(c => c.color)
    });

    // 5. Get Top Video of each major category (limit to registered in CATEGORY_MAP & selectedCategories)
    const topVideos = [];
    selectedCategories.forEach(catId => {
      const catObj = categoryStats[catId];
      if (catObj && catObj.videos.length > 0) {
        const sortedVids = [...catObj.videos].sort((a, b) => b.views - a.views);
        topVideos.push({
          categoryName: catObj.name,
          categoryId: catId,
          color: catObj.color,
          icon: CATEGORY_MAP[catId].icon,
          ...sortedVids[0]
        });
      }
    });
    topVideos.sort((a, b) => b.views - a.views);
    setTopVideosPerCategory(topVideos);
  };

  useEffect(() => {
    setIsClient(true);
    setCountryState(getCountry());
  }, []);

  useEffect(() => {
    loadData();
    setSelectedVideo(null);
    setComments([]);
    setCommentsLoadedFor(null);
    setSummaryData(null);
    setSummaryLoadedFor(null);
    setDrawerTab('info');
    setPlayVideoId(null);
  }, [country]);

  // Re-run processing when selectedCategories or videos raw data changes
  useEffect(() => {
    if (videos.length > 0) {
      processTrendData(videos);
    }
  }, [selectedCategories, videos]);

  // Esc key down listener for video modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setPlayVideoId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCountryChange = (code) => {
    setCountry(code);
    setCountryState(code);
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
      const keyword = selectedVideo.title.split('#')[0].trim().substring(0, 8);
      setSummaryData({
        lineSummary: [
          `이 영상은 "${keyword}" 카테고리 분야의 대표 트렌드로 분석된 고성과 콘텐츠입니다.`,
          `업로드 직후 폭발적인 시청 지표 상승을 기록하며, 해당 분야 핵심 오디언스의 지지를 얻고 있습니다.`,
          `시각적 연출과 직관적인 스크립트 구성이 타 영상 대비 높은 이탈 방지(완독률)를 보여줍니다.`
        ],
        chapters: [
          { time: '00:00', label: '주요 클립 및 오프닝 분석' },
          { time: '02:10', label: '핵심 주제 제시 및 타겟 시청자 공감 요인' },
          { time: '05:40', label: '분야별 차별화 요소 및 하이라이트 구간' },
          { time: '08:20', label: '요약 및 시청자 후속 반응 피드백' }
        ],
        tags: [keyword, '대세분석', '트렌드오버뷰', '인기요인', '성과지표']
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
          name: '분야별 점유율',
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

  return (
    <div className="space-y-6">
      {/* Top Banner and Country Filter */}
      <div className="border-b border-zinc-800 pb-6 flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50 flex items-center gap-2">
              <TrendingUp className="text-blue-500" size={28} />
              분야별 트렌드 오버뷰
            </h1>
            <p className="text-zinc-400 text-sm mt-1">음악, 게임, 엔터테인먼트, 스포츠 등 카테고리별 성과와 대세 분포를 한눈에 모니터링합니다.</p>
          </div>
          
          {/* Global Country selector */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1 rounded-lg self-start md:self-auto text-xs">
            <span className="text-zinc-500 px-2 flex items-center gap-1"><Globe size={14} /> 국가:</span>
            {YOUTUBE_COUNTRIES.map((c) => (
              <button
                key={c.code}
                onClick={() => handleCountryChange(c.code)}
                className={`px-2.5 py-1 rounded font-semibold transition-all duration-200 cursor-pointer
                  ${country === c.code 
                    ? 'bg-blue-500/10 text-blue-500 shadow-sm border border-blue-500/20' 
                    : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                  }
                `}
              >
                {c.code}
              </button>
            ))}
          </div>
        </div>

        {/* Multi-Select Category Filters (Max 7) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">비교 분석 카테고리 선택 (최대 7개)</span>
            <span className="text-xs text-blue-400 font-semibold font-mono">{selectedCategories.length}/7 선택됨</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(CATEGORY_MAP).map((catId) => {
              const catObj = CATEGORY_MAP[catId];
              const isSelected = selectedCategories.includes(catId);
              const isMaxSelected = selectedCategories.length >= 7;
              const disabled = !isSelected && isMaxSelected;
              return (
                <button
                  key={catId}
                  disabled={disabled}
                  onClick={() => {
                    if (isSelected) {
                      if (selectedCategories.length > 1) {
                        setSelectedCategories(selectedCategories.filter(id => id !== catId));
                      }
                    } else {
                      if (selectedCategories.length < 7) {
                        setSelectedCategories([...selectedCategories, catId]);
                      }
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5
                    ${isSelected
                      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold shadow-sm'
                      : disabled
                        ? 'bg-zinc-950/20 border-zinc-900 text-zinc-600 cursor-not-allowed opacity-50'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }
                  `}
                >
                  {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>}
                  {catObj.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {videos.apiError && (
        <div className="bg-amber-900/20 border border-amber-800/30 text-amber-300 rounded-lg p-4 text-sm">
          ⚠️ API 할당량 제한 또는 네트워크 오류로 인해 시뮬레이션 데이터를 분석하여 오버뷰를 제공하고 있습니다. (사유: {videos.apiError})
        </div>
      )}

      {loading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-zinc-400 font-mono">실시간 분야별 지표를 분석하는 중...</p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
              <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block">최다 등록 분야 (대세)</span>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-zinc-100">{stats.topCategory.name}</span>
                <span className="text-xs text-zinc-400 font-mono">({stats.topCategory.count}개 영상)</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 font-mono">100대 트렌드 중 최대 비중</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
              <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block">평균 조회수 최고 분야</span>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-zinc-100">{stats.topViewsCategory.name}</span>
                <span className="text-xs text-zinc-400 font-mono">({formatNumber(stats.topViewsCategory.views)})</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 font-mono">카테고리별 평균 조회 랭킹 1위</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
              <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block">참여율(ER) 최고 분야</span>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-zinc-100">{stats.topEngagementCategory.name}</span>
                <span className="text-xs text-zinc-400 font-mono">({stats.topEngagementCategory.rate}%)</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 font-mono">구독자 참여도/반응 1위</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
              <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block">분석 대상 영상</span>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-zinc-100">{stats.totalAnalyzed}개</span>
                <span className="text-xs text-blue-400 font-mono font-bold">{country} 지역구</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 font-mono">실시간 트렌드 데이터 수집</p>
            </div>
          </div>

          {/* Main Charts Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Share Donut */}
            <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">인기 급상승 카테고리 점유율</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">실시간 인기 동영상 100개 중 분야별 비율</p>
              </div>
              <div className="h-64 mt-4">
                {isClient && <ReactECharts option={getShareOption()} style={{ height: '100%', width: '100%' }} />}
              </div>
            </div>

            {/* Performance Comparison (Bar/Line Chart) */}
            <div className="lg:col-span-2 bg-[#0c0c0f] border border-zinc-800 rounded-xl p-6 shadow-sm">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">분야별 평균 성과 (조회수 vs 참여율)</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">각 카테고리에 속한 영상들의 평균 조회 지표와 시청자 참여율 비교</p>
              </div>
              <div className="h-64 mt-4">
                {isClient && <ReactECharts option={getPerformanceOption()} style={{ height: '100%', width: '100%' }} />}
              </div>
            </div>
          </div>

          {/* Table & Drawer layout split */}
          <div className="flex flex-col xl:flex-row gap-6 items-start">
            {/* Top Videos per Category List */}
            <div className={`
              w-full bg-[#0c0c0f] border border-zinc-800 rounded-xl overflow-hidden transition-all duration-300
              ${selectedVideo ? 'xl:w-2/3' : 'xl:w-full'}
            `}>
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/10">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <Sparkles className="text-blue-500" size={18} />
                    주요 분야별 실시간 1위 비디오 (하이라이트)
                  </h3>
                  <p className="text-zinc-500 text-xs mt-1">각 카테고리 내에서 조회수 성과가 가장 압도적인 원픽(One Pick) 동영상들입니다.</p>
                </div>
              </div>

              {topVideosPerCategory.length === 0 ? (
                <div className="p-20 text-center text-zinc-500">조회된 분야별 하이라이트 영상이 없습니다.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-zinc-950/20">
                  {topVideosPerCategory.map((video) => {
                    const isSelected = selectedVideo?.id === video.id;
                    const CatIcon = video.icon || Music;
                    return (
                      <div 
                        key={video.id}
                        onClick={() => handleVideoClick(video)}
                        className={`
                          bg-zinc-900/40 border rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/70 flex flex-col justify-between
                          ${isSelected ? 'border-blue-500 bg-blue-500/5 shadow-md' : 'border-zinc-800/80'}
                        `}
                      >
                        {/* Upper Card Block */}
                        <div>
                          {/* Image Thumbnail with category badge overlay */}
                          <div className="relative aspect-video w-full overflow-hidden border-b border-zinc-850">
                            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform duration-300 hover:scale-102" />
                            <span 
                              className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-md flex items-center gap-1"
                              style={{ backgroundColor: video.color }}
                            >
                              <CatIcon size={12} />
                              {video.categoryName} 1위
                            </span>
                          </div>

                          <div className="p-4 space-y-2">
                            <h4 className="font-bold text-sm text-zinc-100 line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">
                              {video.title}
                            </h4>
                            <span className="text-xs text-zinc-500 block font-mono">
                              {video.channelTitle}
                            </span>
                          </div>
                        </div>

                        {/* Metrics Bar */}
                        <div className="px-4 py-3 bg-zinc-950/40 border-t border-zinc-850/80 flex items-center justify-between text-xs text-zinc-400 font-mono">
                          <span className="flex items-center gap-1"><Eye size={13} /> {formatNumber(video.views)}</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold
                            ${video.engagementRate > 5 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-zinc-800 text-zinc-400'
                            }
                          `}>
                            ER {video.engagementRate}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Video Detail Side Panel */}
            {selectedVideo && (
              <div className="w-full xl:w-1/3 bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg relative animate-fade-in self-stretch flex flex-col justify-between">
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
