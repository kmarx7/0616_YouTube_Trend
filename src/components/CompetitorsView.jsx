import React, { useState, useEffect } from 'react';
import { Users, Eye, Video, Hash, Image as ImageIcon, ChevronRight, BarChart2, Star } from 'lucide-react';
import { fetchChannelData } from '../utils/youtubeService';

export default function CompetitorsView() {
  const [query, setQuery] = useState('IT_Tech_Reviewer');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeCompetitorIdx, setActiveCompetitorIdx] = useState(0);

  const loadData = async () => {
    setLoading(true);
    setError(null);
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
    loadData();
  }, [query]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-zinc-400 font-mono">경쟁 분석 데이터를 로드하는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center p-6">
        <div className="max-w-md text-center bg-zinc-900 border border-zinc-800 rounded-xl p-8">
          <h3 className="text-xl font-bold text-zinc-100 mb-2">오류가 발생했습니다</h3>
          <p className="text-zinc-400 mb-6">{error || '데이터가 존재하지 않습니다.'}</p>
          <button 
            onClick={() => loadData()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 font-medium transition-colors cursor-pointer"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const { channelInfo, competitors } = data;
  const activeCompetitor = competitors[activeCompetitorIdx] || competitors[0];

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50 font-sans">경쟁 채널 분석</h1>
        <p className="text-zinc-400 text-sm mt-1">경쟁사들의 최신 퍼포먼스 지표, 핵심 태그 키워드, 그리고 썸네일 시각 디자인 전략을 벤치마킹합니다.</p>
      </div>

      {/* Competitor Comparison Matrix */}
      <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <BarChart2 className="text-blue-500" size={20} />
            경쟁 채널 비교 매트릭스
          </h3>
          <span className="text-xs text-zinc-500 font-mono">Performance Matrix</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 text-xs font-semibold">
                <th className="p-4">채널명</th>
                <th className="p-4">구독자 수</th>
                <th className="p-4">누적 조회수</th>
                <th className="p-4">영상 개수</th>
                <th className="p-4">영상당 평균 조회수</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-sm text-zinc-300">
              {/* Primary/User Channel */}
              <tr className="bg-blue-500/5 hover:bg-blue-500/10 transition-colors font-medium border-b border-blue-900/20">
                <td className="p-4 flex items-center gap-3">
                  <div className="relative">
                    <img src={channelInfo.profileImage} alt={channelInfo.title} className="w-9 h-9 rounded-full border border-blue-500/30 object-cover" />
                    <span className="absolute -top-1 -left-1 bg-blue-500 text-[8px] font-bold text-white px-1 py-0.25 rounded">MY</span>
                  </div>
                  <span className="font-bold text-blue-400">{channelInfo.title}</span>
                </td>
                <td className="p-4 font-mono font-semibold">{formatNumber(channelInfo.subscribers)}</td>
                <td className="p-4 font-mono">{formatNumber(channelInfo.views)}</td>
                <td className="p-4 font-mono">{channelInfo.videos}</td>
                <td className="p-4 font-mono text-zinc-400">{formatNumber(Math.floor(channelInfo.views / (channelInfo.videos || 1)))}</td>
              </tr>
              {/* Competitors */}
              {competitors.map((comp, idx) => (
                <tr 
                  key={comp.channelId} 
                  onClick={() => setActiveCompetitorIdx(idx)}
                  className={`
                    hover:bg-zinc-800/30 cursor-pointer transition-colors
                    ${activeCompetitorIdx === idx ? 'bg-zinc-800/20' : ''}
                  `}
                >
                  <td className="p-4 flex items-center gap-3">
                    <img src={comp.profileImage} alt={comp.channelName} className="w-9 h-9 rounded-full border border-zinc-850 object-cover" />
                    <span className="font-semibold text-zinc-200">{comp.channelName}</span>
                  </td>
                  <td className="p-4 font-mono">{formatNumber(comp.subscribers)}</td>
                  <td className="p-4 font-mono">{formatNumber(comp.totalViews)}</td>
                  <td className="p-4 font-mono">{comp.videoCount}</td>
                  <td className="p-4 font-mono text-zinc-400">{formatNumber(comp.averageViews)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Analysis Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left selector */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 pl-1">상세 분석 채널 선택</h3>
          <div className="space-y-2">
            {competitors.map((comp, idx) => {
              const isActive = activeCompetitorIdx === idx;
              return (
                <button
                  key={comp.channelId}
                  onClick={() => setActiveCompetitorIdx(idx)}
                  className={`
                    w-full text-left flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer
                    ${isActive 
                      ? 'bg-zinc-900 border-zinc-700 text-zinc-100 shadow-sm' 
                      : 'bg-[#0c0c0f] border-zinc-800/60 text-zinc-400 hover:border-zinc-800 hover:text-zinc-200'
                    }
                  `}
                >
                  <img src={comp.profileImage} alt={comp.channelName} className="w-10 h-10 rounded-full border border-zinc-800 object-cover" />
                  <div className="flex-grow">
                    <span className="font-bold block text-sm">{comp.channelName}</span>
                    <span className="text-xs text-zinc-500 font-mono mt-0.5 block">{formatNumber(comp.subscribers)} 구독자</span>
                  </div>
                  <ChevronRight size={16} className={isActive ? 'text-blue-500' : 'text-zinc-600'} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right competitor detail analytics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tag Strategy Card */}
          <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
              <Hash className="text-blue-500" size={16} />
              "{activeCompetitor.channelName}" 핵심 태그 분석
            </h3>
            <p className="text-zinc-500 text-xs mb-4">해당 채널이 타겟 시청자를 유입하기 위해 주로 노출시키는 태그 키워드 세트입니다.</p>
            <div className="flex flex-wrap gap-2">
              {activeCompetitor.tags.map((tag) => (
                <span 
                  key={tag}
                  className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-semibold"
                >
                  <span className="text-blue-500 font-mono">#</span>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Thumbnail Strategy Analysis Card */}
          <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-2">
                <ImageIcon className="text-blue-500" size={16} />
                썸네일 디자인 전략 분석
              </h3>
              <p className="text-zinc-500 text-xs">최신 업로드 영상들의 시각적 구성 특징과 효과를 벤치마킹합니다.</p>
            </div>

            {/* Design features grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-b border-zinc-800/60 py-4 font-sans text-xs">
              <div className="space-y-1">
                <span className="text-zinc-500 uppercase tracking-wider block">주요 배색 (Dominant Colors)</span>
                <div className="flex gap-2 items-center pt-1.5">
                  {activeCompetitor.thumbnailStrategy.dominantColors.map(color => (
                    <div 
                      key={color} 
                      className="w-5 h-5 rounded-full border border-zinc-800 shadow-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                  <span className="text-[10px] text-zinc-500 font-mono ml-1">Color Palette</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-500 uppercase tracking-wider block">인물 포함 여부 (Face Presence)</span>
                <span className={`inline-flex items-center gap-1.5 font-semibold mt-1.5 text-sm
                  ${activeCompetitor.thumbnailStrategy.hasFace ? 'text-emerald-400' : 'text-zinc-400'}
                `}>
                  <Star size={14} className={activeCompetitor.thumbnailStrategy.hasFace ? 'fill-emerald-400 text-emerald-400' : ''} />
                  {activeCompetitor.thumbnailStrategy.hasFace ? '인물 얼굴 포함 (클로즈업)' : '제품 단독 노출 (미니멀)'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-500 uppercase tracking-wider block">자막 텍스트 스타일 (Typography)</span>
                <span className="font-semibold text-zinc-200 mt-1.5 text-sm block">
                  {activeCompetitor.thumbnailStrategy.textType}
                </span>
              </div>
            </div>

            {/* Visual style tags */}
            <div className="space-y-2">
              <span className="text-zinc-500 uppercase tracking-wider block text-xs">비주얼 스타일 태그</span>
              <div className="flex flex-wrap gap-1.5">
                {activeCompetitor.thumbnailStrategy.styleTags.map(tag => (
                  <span key={tag} className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded text-[10px] border border-blue-500/20 font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Thumbnail Grid Gallery */}
            <div className="space-y-3">
              <span className="text-zinc-500 uppercase tracking-wider block text-xs">최신 영상 썸네일 그리드</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {activeCompetitor.latestVideos.map((vid) => (
                  <div key={vid.id} className="group relative bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-sm hover:border-zinc-700 transition-colors">
                    <img src={vid.thumbnail} alt={vid.title} className="w-full aspect-video object-cover group-hover:scale-102 transition-transform duration-300" />
                    <div className="p-3">
                      <span className="font-semibold text-xs text-zinc-200 line-clamp-1 block group-hover:text-blue-400 transition-colors">{vid.title}</span>
                      <div className="flex justify-between items-center mt-2 text-[10px] text-zinc-500 font-mono">
                        <span>조회수: {formatNumber(vid.views)}</span>
                        <span>ER: {((vid.likes + vid.comments) / (vid.views || 1) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
