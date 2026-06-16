import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { 
  GraduationCap, 
  Eye, 
  ThumbsUp, 
  MessageSquare, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Globe,
  Tag,
  Clock,
  X,
  MessageCircle,
  TrendingUp,
  Smile,
  Frown,
  BookOpen,
  Sparkles,
  ListRestart,
  Search
} from 'lucide-react';
import { 
  fetchEducationVideos, 
  getCountry, 
  setCountry, 
  fetchComments 
} from '../utils/youtubeService';
import { YOUTUBE_COUNTRIES } from '../utils/mockData';

const EDUCATION_SUB_CATEGORIES = [
  { id: 'all', name: '전체 교육' },
  { id: 'programming', name: '프로그래밍/IT' },
  { id: 'science', name: '기초과학/우주' },
  { id: 'language', name: '어학/외국어' },
  { id: 'finance', name: '경제/재테크' }
];

export default function EducationView() {
  const [country, setCountryState] = useState('KR');
  const [subCategory, setSubCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);
  
  // Search within category list
  const [searchTerm, setSearchTerm] = useState('');
  
  // Detail Panel & Comments state
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [drawerTab, setDrawerTab] = useState('info'); // info, summary, comments
  
  // Comments Analysis state
  const [loadingComments, setLoadingComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoadedFor, setCommentsLoadedFor] = useState(null);

  // AI Script Summary state (Feature #1)
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoadedFor, setSummaryLoadedFor] = useState(null);
  
  // Table pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Hydration safety check
  const [isClient, setIsClient] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEducationVideos(subCategory);
      setVideos(data);
    } catch (err) {
      setError(err.message || '교육 동영상을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
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
    setCurrentPage(1);
    setSearchTerm(''); // Reset search on category/country change
  }, [country, subCategory]);

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

  // Mock AI summary data generator (Feature #1)
  const handleLoadSummary = () => {
    if (!selectedVideo) return;
    setLoadingSummary(true);
    setTimeout(() => {
      const keyword = selectedVideo.title.split(']')[1]?.trim().substring(0, 8) || '교육 강좌';
      setSummaryData({
        lineSummary: [
          `본 영상은 "${keyword}"에 관한 필수 핵심 개념을 다룬 교육/지식 콘텐츠입니다.`,
          `체계적인 자료 화면과 쉬운 예시를 들어 학습자의 내용 장악도(평균 만족도 92%)가 아주 높습니다.`,
          `필기 노트 및 코드 스크립트가 잘 정리되어 있어, 예제 실습용으로 최적의 교육 자료입니다.`
        ],
        chapters: [
          { time: '00:00', label: '단원 도입 및 핵심 학습 용어 개념 정리' },
          { time: '02:30', label: '실제 사례/코드 기반 응용 방식 직접 데모' },
          { time: '06:15', label: '자주 범하는 문법 오류 및 극복 솔루션' },
          { time: '09:40', label: '단원 형성 요약 문제 및 숙제 안내' },
          { time: '13:20', label: '학습 마스터를 위한 다음 심화 코스 추천' }
        ],
        tags: [keyword, '지식나눔', '핵심요약', '무료강의', '교육학습']
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

  // Local Search Filter
  const filteredVideos = videos.filter(video => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return video.title.toLowerCase().includes(term) || video.channelTitle.toLowerCase().includes(term);
  });

  // Pagination
  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVideos = filteredVideos.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6">
      {/* Top Banner and Filter Row */}
      <div className="border-b border-zinc-800 pb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50 flex items-center gap-2">
              <GraduationCap className="text-blue-500" size={28} />
              교육 분야 인기 영상 TOP 30
            </h1>
            <p className="text-zinc-400 text-sm mt-1">유튜브 교육 카테고리(Category ID: 27)에서 가장 인기 있는 교육 및 지식 콘텐츠를 분석합니다.</p>
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

        {/* Sub Category Pills */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {EDUCATION_SUB_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSubCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer
                ${subCategory === cat.id
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
          ⚠️ API 할당량 제한 또는 네트워크 오류로 인해 시뮬레이션 데이터를 제공하고 있습니다. (사유: {videos.apiError})
        </div>
      )}

      {/* Main layout split */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Top 30 Video Table */}
        <div className={`
          w-full bg-[#0c0c0f] border border-zinc-800 rounded-xl overflow-hidden transition-all duration-300
          ${selectedVideo ? 'lg:w-2/3' : 'lg:w-full'}
        `}>
          <div className="p-6 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/10">
            <div>
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <BookOpen className="text-blue-500" size={18} />
                인기 순위 리스트 (최대 30위)
              </h3>
              <span className="text-xs text-zinc-500 font-mono">Showing {filteredVideos.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, filteredVideos.length)} of {filteredVideos.length}</span>
            </div>

            {/* Local Search Input within Category */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
              <input
                type="text"
                placeholder="현재 목록 내 검색 (제목, 채널)..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset page on type
                }}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-200"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-20 text-center text-zinc-500 font-mono">로딩 중...</div>
          ) : filteredVideos.length === 0 ? (
            <div className="p-20 text-center text-zinc-500">검색어 및 카테고리에 해당하는 교육용 영상이 현재 국가 리스트에 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 text-xs font-semibold">
                    <th className="p-4 w-16 text-center">순위</th>
                    <th className="p-4">영상 정보</th>
                    <th className="p-4">업로드</th>
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
                        <td className="p-4 text-center font-mono font-bold text-lg text-blue-500/80">
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
                            ${video.engagementRate > 6 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : (video.engagementRate > 4 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-zinc-800 text-zinc-400')
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
                className="p-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Video Detail & Comments/Summary Side Panel */}
        {selectedVideo && (
          <div className="w-full lg:w-1/3 bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg relative animate-fade-in self-stretch flex flex-col justify-between">
            <div>
              {/* Close Button */}
              <button 
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X size={18} />
              </button>

              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">영상 상세 분석</h3>
              <img src={selectedVideo.thumbnail} alt={selectedVideo.title} className="w-full aspect-video object-cover rounded-lg border border-zinc-800 bg-zinc-950 mb-4" />
              <h4 className="text-base font-bold text-zinc-100 leading-snug">{selectedVideo.title}</h4>
              <p className="text-xs text-zinc-500 font-mono mt-1 mb-4">Channel: {selectedVideo.channelTitle}</p>

              {/* Drawer Tabs (Features Integration) */}
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

              {/* Tab 2: AI Script Summary (Feature #1) */}
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
    </div>
  );
}
