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
  BookOpen
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
  
  // Detail Panel & Comments state
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoadedFor, setCommentsLoadedFor] = useState(null);
  
  // Table pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    setCountryState(getCountry());
  }, []);

  useEffect(() => {
    loadData();
    setSelectedVideo(null);
    setComments([]);
    setCommentsLoadedFor(null);
    setCurrentPage(1);
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
      setComments([]);
      setCommentsLoadedFor(null);
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

  // Calculate Sentiment summary for Comments
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

  // Pagination
  const totalPages = Math.ceil(videos.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVideos = videos.slice(indexOfFirstItem, indexOfLastItem);

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

      {/* API Warn notifications */}
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
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/10">
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <BookOpen className="text-blue-500" size={18} />
              인기 순위 리스트 (최대 30위)
            </h3>
            <span className="text-xs text-zinc-500 font-mono">Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, videos.length)} of {videos.length}</span>
          </div>

          {loading ? (
            <div className="p-20 text-center text-zinc-500 font-mono">로딩 중...</div>
          ) : videos.length === 0 ? (
            <div className="p-20 text-center text-zinc-500">필터 키워드에 해당하는 교육용 영상이 현재 국가 리스트에 없습니다.</div>
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

        {/* Video Detail & Comments Side Panel */}
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

              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">영상 상세 및 댓글 분석</h3>
              <img src={selectedVideo.thumbnail} alt={selectedVideo.title} className="w-full aspect-video object-cover rounded-lg border border-zinc-800 bg-zinc-950 mb-4" />
              <h4 className="text-base font-bold text-zinc-100 leading-snug">{selectedVideo.title}</h4>
              <p className="text-xs text-zinc-500 font-mono mt-1">Channel: {selectedVideo.channelTitle}</p>

              {/* Views & ER Stats */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-2.5">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">조회수</span>
                  <span className="text-sm font-bold text-zinc-200 font-mono mt-0.5 block">{selectedVideo.views.toLocaleString()}</span>
                </div>
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-2.5">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">평균 참여율</span>
                  <span className="text-sm font-bold text-zinc-200 font-mono mt-0.5 block">{selectedVideo.engagementRate}%</span>
                </div>
              </div>

              {/* Comments load block */}
              <div className="mt-6 border-t border-zinc-850 pt-5">
                {commentsLoadedFor === selectedVideo.id ? (
                  // Comments Loaded
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-400">댓글 여론 분석 ({comments.length}개)</span>
                      <button 
                        onClick={handleLoadComments} 
                        className="text-[10px] text-blue-500 hover:underline font-semibold"
                      >
                        새로고침
                      </button>
                    </div>

                    {/* ECharts Sentiment Donut */}
                    <div className="h-40 bg-zinc-950 border border-zinc-800 rounded-lg p-2 flex items-center justify-center">
                      <ReactECharts option={getSentimentOption()} style={{ height: '100%', width: '100%' }} />
                      <div className="flex flex-col gap-1 text-[11px] pl-2 border-l border-zinc-800">
                        <span className="text-emerald-400 font-semibold">긍정: {sentimentStats.positive}%</span>
                        <span className="text-zinc-400">중립: {sentimentStats.neutral}%</span>
                        <span className="text-rose-400 font-semibold">부정: {sentimentStats.negative}%</span>
                      </div>
                    </div>

                    {/* Comment feed list */}
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
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
                  // Load comments button
                  <button
                    onClick={handleLoadComments}
                    disabled={loadingComments}
                    className="w-full bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 text-blue-500 rounded-lg py-4 font-semibold text-xs transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
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
