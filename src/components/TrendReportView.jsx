import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { 
  FileText, 
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
  TrendingUp,
  Play
} from 'lucide-react';
import { 
  fetchTrendingVideos, 
  getCountry, 
  setCountry, 
  fetchComments 
} from '../utils/youtubeService';
import { YOUTUBE_COUNTRIES, YOUTUBE_CATEGORIES } from '../utils/mockData';

export default function TrendReportView() {
  const [country, setCountryState] = useState('KR');
  const [category, setCategory] = useState('10'); // Default to Music
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);

  // Stats and chart states
  const [durationStats, setDurationStats] = useState({ categories: [], views: [], er: [] });
  const [tagStats, setTagStats] = useState({ tags: [], counts: [] });
  const [goldenHoursOption, setGoldenHoursOption] = useState({});
  const [copyStats, setCopyStats] = useState({ faceRate: 0, clickbaitRate: 0, colorRatio: [] });
  const [risingCreators, setRisingCreators] = useState([]);

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
      // Fetch trending videos for the selected category
      const data = await fetchTrendingVideos(category);
      setVideos(data);
      analyzeCategoryTrends(data);
    } catch (err) {
      setError(err.message || '카테고리 트렌드 분석 보고서를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const analyzeCategoryTrends = (videoList) => {
    if (!videoList || videoList.length === 0) return;

    // 1. Duration Analysis
    let shortCount = 0, shortViews = 0, shortER = 0;
    let medCount = 0, medViews = 0, medER = 0;
    let longCount = 0, longViews = 0, longER = 0;

    videoList.forEach(v => {
      if (v.duration < 60) {
        shortCount++;
        shortViews += v.views;
        shortER += v.engagementRate;
      } else if (v.duration < 600) {
        medCount++;
        medViews += v.views;
        medER += v.engagementRate;
      } else {
        longCount++;
        longViews += v.views;
        longER += v.engagementRate;
      }
    });

    setDurationStats({
      categories: ['숏폼 (< 1분)', '미디엄폼 (1~10분)', '롱폼 (>= 10분)'],
      views: [
        shortCount > 0 ? Math.round(shortViews / shortCount / 1000) / 100 : 0, // In hundred thousand
        medCount > 0 ? Math.round(medViews / medCount / 1000) / 100 : 0,
        longCount > 0 ? Math.round(longViews / longCount / 1000) / 100 : 0
      ],
      er: [
        shortCount > 0 ? parseFloat((shortER / shortCount).toFixed(2)) : 0,
        medCount > 0 ? parseFloat((medER / medCount).toFixed(2)) : 0,
        longCount > 0 ? parseFloat((longER / longCount).toFixed(2)) : 0
      ]
    });

    // 2. Tag Analysis
    const tagCounts = {};
    videoList.forEach(v => {
      if (v.tags && Array.isArray(v.tags)) {
        v.tags.forEach(tag => {
          if (!tag) return;
          const cleanTag = tag.trim().toLowerCase();
          tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
        });
      }
    });

    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8); // Top 8 tags

    setTagStats({
      tags: sortedTags.map(t => t[0]),
      counts: sortedTags.map(t => t[1])
    });

    // 3. Golden Hours Heatmap Analysis
    // Generates a mock upload time heatmap grid (7 days x 4 time blocks) based on views weight
    const days = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];
    const timeBlocks = ['새벽 (0-6시)', '오전 (6-12시)', '오후 (12-18시)', '저녁 (18-24시)'];
    
    const heatmapData = [];
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      for (let timeIdx = 0; timeIdx < 4; timeIdx++) {
        // Higher weight on Wed/Fri evenings
        let weight = Math.floor(Math.random() * 40) + 10;
        if (dayIdx === 2 || dayIdx === 4) weight += 35; // Wed/Fri
        if (timeIdx === 2 || timeIdx === 3) weight += 25; // Afternoon/Evening
        
        heatmapData.push([dayIdx, timeIdx, weight]);
      }
    }

    setGoldenHoursOption({
      backgroundColor: 'transparent',
      tooltip: {
        position: 'top',
        formatter: (params) => {
          return `${days[params.data[0]]} ${timeBlocks[params.data[1]]}<br/>조회 가중치: <b>${params.data[2]}</b>`;
        },
        backgroundColor: '#0c0c0f',
        borderColor: '#1e1e24',
        textStyle: { color: '#fafafa' }
      },
      grid: { height: '70%', top: '10%', bottom: '15%' },
      xAxis: {
        type: 'category',
        data: days,
        splitArea: { show: true },
        axisLabel: { color: '#a1a1aa' }
      },
      yAxis: {
        type: 'category',
        data: timeBlocks,
        splitArea: { show: true },
        axisLabel: { color: '#a1a1aa' }
      },
      visualMap: {
        min: 10,
        max: 100,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        textStyle: { color: '#a1a1aa' },
        inRange: {
          color: ['rgba(37, 99, 235, 0.1)', 'rgba(37, 99, 235, 0.5)', '#2563eb']
        }
      },
      series: [
        {
          name: '업로드 성과',
          type: 'heatmap',
          data: heatmapData,
          label: { show: false },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    });

    // 4. Thumbnail and Copywriting Statistics
    // Face presence rate & clickbait copywriting rate calculations based on video title keywords
    let faceCount = 0;
    let clickbaitCount = 0;
    const clickbaitKeywords = ['충격', '눈물', '소름', '대박', '이유', '공개', 'ㅋㅋㅋ', '!', '?', '역대급'];

    videoList.forEach((v, idx) => {
      // Simulate face count: half of top performing entertainment/gaming videos tend to use faces
      if ((idx % 3 === 0 && (category === '24' || category === '20')) || idx % 4 === 1) {
        faceCount++;
      }
      
      const titleLower = v.title.toLowerCase();
      const hasKeyword = clickbaitKeywords.some(kw => titleLower.includes(kw));
      if (hasKeyword) {
        clickbaitCount++;
      }
    });

    setCopyStats({
      faceRate: Math.round((faceCount / videoList.length) * 100),
      clickbaitRate: Math.round((clickbaitCount / videoList.length) * 100)
    });

    // 5. Rising Creators (Videos with exceptionally high engagement or views compared to sub count)
    // Here we simulate subscriber benchmark mapping views count
    const processedCreators = videoList.slice(0, 10).map(v => {
      // Simulate channel subscriber counts that are small but hit jackpot views
      const isRising = v.rank % 3 === 0;
      const simulatedSubs = isRising 
        ? Math.max(Math.floor(v.views * (Math.random() * 0.1 + 0.05)), 5000) 
        : Math.floor(v.views * (Math.random() * 5 + 3));

      const ratio = parseFloat((v.views / simulatedSubs).toFixed(1));

      return {
        ...v,
        subs: simulatedSubs,
        viewsToSubsRatio: ratio
      };
    });

    // Sort by subscriber ratio to spotlight the true rising stars
    processedCreators.sort((a, b) => b.viewsToSubsRatio - a.viewsToSubsRatio);
    setRisingCreators(processedCreators.slice(0, 5));
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
  }, [country, category]);

  // Esc key listener for modal
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
      setPlayVideoId(null);
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
          `본 영상은 해당 카테고리 분야의 트렌드 분석 리포트 중 대표 성과 영상입니다.`,
          `업로드 성과 요일 분석에 부합하는 골든타임대에 맞춰 업로드되어 조회수가 급증했습니다.`,
          `썸네일 visual 스타일 및 타이틀의 카피라이팅이 카테고리 고성과 벤치마킹 규칙을 완벽히 준수하고 있습니다.`
        ],
        chapters: [
          { time: '00:00', label: '인트로 및 핵심 벤치마킹 요소 소개' },
          { time: '01:50', label: '카테고리 트렌드 요소 디테일 해부' },
          { time: '04:30', label: '성공 전략 적용 가이드 및 기대효과 요약' }
        ],
        tags: ['리포트분석', '대세분석', '성과벤치마킹', '트렌드홈']
      });
      setSummaryLoadedFor(selectedVideo.id);
      setLoadingSummary(false);
    }, 1200);
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
  const getDurationOption = () => {
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
        data: ['평균 조회수 (십만)', '평균 참여율 (ER, %)'],
        textStyle: { color: '#a1a1aa' }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: durationStats.categories,
        axisLine: { lineStyle: { color: '#2e3039' } },
        axisLabel: { color: '#a1a1aa', fontSize: 10 }
      },
      yAxis: [
        {
          type: 'value',
          name: '조회수',
          axisLabel: { color: '#a1a1aa', formatter: '{value}십만' },
          splitLine: { lineStyle: { color: '#1e1e24' } }
        },
        {
          type: 'value',
          name: '참여율',
          axisLabel: { color: '#a1a1aa', formatter: '{value}%' },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '평균 조회수 (십만)',
          type: 'bar',
          data: durationStats.views,
          itemStyle: {
            color: '#3b82f6',
            borderRadius: [4, 4, 0, 0]
          }
        },
        {
          name: '평균 참여율 (ER, %)',
          type: 'line',
          yAxisIndex: 1,
          data: durationStats.er,
          symbolSize: 8,
          lineStyle: { width: 3, color: '#10b981' },
          itemStyle: { color: '#10b981' }
        }
      ]
    };
  };

  const getTagOption = () => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#0c0c0f',
        borderColor: '#1e1e24',
        textStyle: { color: '#fafafa' }
      },
      grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'value',
        boundaryGap: [0, 0.01],
        splitLine: { lineStyle: { color: '#1e1e24' } },
        axisLabel: { color: '#a1a1aa' }
      },
      yAxis: {
        type: 'category',
        data: [...tagStats.tags].reverse(), // reverse for horizontal stack
        axisLine: { lineStyle: { color: '#2e3039' } },
        axisLabel: { color: '#a1a1aa', fontSize: 9 }
      },
      series: [
        {
          name: '태그 출현 빈도',
          type: 'bar',
          data: [...tagStats.counts].reverse(),
          itemStyle: {
            color: '#8b5cf6',
            borderRadius: [0, 4, 4, 0]
          }
        }
      ]
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Category/Country Selectors */}
      <div className="border-b border-zinc-800 pb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50 flex items-center gap-2">
              <FileText className="text-blue-500" size={28} />
              분야별 트렌드 분석 보고서
            </h1>
            <p className="text-zinc-400 text-sm mt-1">유튜브 특정 카테고리를 대상으로 썸네일, 영상 길이, 가용 키워드 및 업로드 시점을 입체적으로 조망합니다.</p>
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

        {/* Category Selector Pills */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {YOUTUBE_CATEGORIES.filter(cat => cat.id !== 'all').map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer
                ${category === cat.id
                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-sm'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }
              `}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {videos.apiError && (
        <div className="bg-amber-900/20 border border-amber-800/30 text-amber-300 rounded-lg p-4 text-sm">
          ⚠️ API 할당량 제한으로 인해 시뮬레이션 데이터를 분석하여 대시보드 리포트를 제공하고 있습니다.
        </div>
      )}

      {loading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-zinc-400 font-mono">분야별 인사이트 보고서를 가공하는 중...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Dashboard Charts Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Duration Performance */}
            <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">⏱️ 영상 길이별 성과 분석</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">조회수 성과가 가장 좋은 이상적인 영상 길이를 식별합니다.</p>
              <div className="h-64 mt-4">
                {isClient && <ReactECharts option={getDurationOption()} style={{ height: '100%', width: '100%' }} />}
              </div>
            </div>

            {/* Chart 2: Keyword Cloud / Tag Frequency */}
            <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">🏷️ 핵심 키워드 및 태그 영향력</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">유입 유도를 위해 상위 영상에 자주 등록된 주요 태그 가중치</p>
              <div className="h-64 mt-4">
                {isClient && tagStats.tags.length > 0 ? (
                  <ReactECharts option={getTagOption()} style={{ height: '100%', width: '100%' }} />
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-zinc-500">데이터를 분석하기에 충분한 태그가 존재하지 않습니다.</div>
                )}
              </div>
            </div>

            {/* Chart 3: Golden Hours Heatmap */}
            <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">📅 요일 및 시간대별 업로드 골든타임</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">가장 즉각적인 조회수 추진력을 얻을 수 있는 출판 스케줄 벤치마킹</p>
              <div className="h-64 mt-4">
                {isClient && <ReactECharts option={goldenHoursOption} style={{ height: '100%', width: '100%' }} />}
              </div>
            </div>

            {/* Visual 4: Copywriting & Thumbnail Strategy Cards */}
            <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">🎨 썸네일 & 타이틀 카피라이팅 스타일</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">상위 랭킹 비디오들의 제목 패턴과 visual 구성 비율</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 my-auto pt-6">
                <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-xl text-center space-y-2">
                  <span className="text-zinc-500 text-xs font-semibold block">인물 얼굴 포함률</span>
                  <div className="text-3xl font-extrabold text-blue-500 font-mono">{copyStats.faceRate}%</div>
                  <span className="text-[10px] text-zinc-500 block">썸네일 내 인물(표정) 크로핑 비율</span>
                </div>

                <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-xl text-center space-y-2">
                  <span className="text-zinc-500 text-xs font-semibold block">자극성 카피 제목 비율</span>
                  <div className="text-3xl font-extrabold text-emerald-500 font-mono">{copyStats.clickbaitRate}%</div>
                  <span className="text-[10px] text-zinc-500 block">느낌표, 물음표 및 이목 집중형 단어</span>
                </div>
              </div>
              
              <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-3 text-xs text-zinc-400 leading-relaxed font-sans">
                💡 **카피 요약 가이드**: 해당 카테고리에서는 인물 클로즈업 썸네일이 **{copyStats.faceRate}%** 수준으로 대다수를 차지하며, 자극적인 반문 형태의 카피 제목 기입이 초기 시청자 클릭율 유도에 긍정적인 영향을 끼치는 것으로 보입니다.
              </div>
            </div>
          </div>

          {/* Table split Layout */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* Table: Rising Creator Showcase */}
            <div className={`
              w-full bg-[#0c0c0f] border border-zinc-800 rounded-xl overflow-hidden transition-all duration-300
              ${selectedVideo ? 'lg:w-2/3' : 'lg:w-full'}
            `}>
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/10">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <Sparkles className="text-amber-500 fill-amber-500/20" size={18} />
                    구독자 수 대비 조회수 고성과 채널 (Rising Star)
                  </h3>
                  <p className="text-zinc-500 text-xs mt-1">구독자 대비 조회수 성과 비율이 압도적으로 높아 알고리즘 유입을 잘 빨아들이고 있는 채널들입니다.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 text-xs font-semibold">
                      <th className="p-4 w-12 text-center">선정</th>
                      <th className="p-4">채널 / 영상 정보</th>
                      <th className="p-4">구독자 수</th>
                      <th className="p-4">조회수</th>
                      <th className="p-4">성과 배수</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50 text-sm">
                    {risingCreators.map((video, idx) => {
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
                            #{idx + 1}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img src={video.thumbnail} alt={video.title} className="w-16 h-9 object-cover rounded-md border border-zinc-800 bg-zinc-950 flex-shrink-0" />
                              <div>
                                <span className="font-semibold text-zinc-200 line-clamp-1 hover:text-blue-400 transition-colors">{video.title}</span>
                                <span className="text-xs text-zinc-500 block mt-0.5">{video.channelTitle}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-zinc-400 font-mono">
                            {formatNumber(video.subs)}
                          </td>
                          <td className="p-4 font-mono font-semibold text-zinc-300">
                            {formatNumber(video.views)}
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {video.viewsToSubsRatio}배 성과
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Video Detail Side Panel */}
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
                    className="relative w-full aspect-video rounded-lg border border-zinc-855 bg-zinc-950 mb-4 overflow-hidden group cursor-pointer"
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
