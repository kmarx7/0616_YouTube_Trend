import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Users, Eye, Video, Hash, Image as ImageIcon, ChevronRight, BarChart2, Star, Network, HelpCircle } from 'lucide-react';
import { fetchChannelData } from '../utils/youtubeService';

export default function CompetitorsView() {
  const [query1, setQuery1] = useState('IT_Tech_Reviewer');
  const [query2, setQuery2] = useState('Tech_Review_Master');
  const [input1, setInput1] = useState('IT_Tech_Reviewer');
  const [input2, setInput2] = useState('Tech_Review_Master');

  const [loading, setLoading] = useState(true);
  const [data1, setData1] = useState(null);
  const [data2, setData2] = useState(null);
  const [error, setError] = useState(null);
  
  // Tab within competitors view: 'matrix' vs 'network' (Force Graph)
  const [subTab, setSubTab] = useState('matrix');

  // Hydration safety check for ECharts
  const [isClient, setIsClient] = useState(false);

  // Favorites state synced with localStorage
  const [favorites, setFavorites] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tubepulse_favorite_channels');
      return saved ? JSON.parse(saved) : ['IT_Tech_Reviewer', 'Tech_Review_Master', '가성비_정보통', '리얼_리뷰어_X'];
    }
    return ['IT_Tech_Reviewer', 'Tech_Review_Master', '가성비_정보통', '리얼_리뷰어_X'];
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [result1, result2] = await Promise.all([
        fetchChannelData(query1),
        fetchChannelData(query2)
      ]);
      setData1(result1);
      setData2(result2);
    } catch (err) {
      setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    loadData();
  }, [query1, query2]);

  const handleCompare = () => {
    if (!input1.trim() || !input2.trim()) return;
    setQuery1(input1.trim());
    setQuery2(input2.trim());
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Toggle favorite channel
  const toggleFavorite = (channelName) => {
    const cleanName = channelName.trim();
    if (!cleanName) return;

    setFavorites(prev => {
      const updated = prev.includes(cleanName)
        ? prev.filter(f => f !== cleanName)
        : [...prev, cleanName];
      localStorage.setItem('tubepulse_favorite_channels', JSON.stringify(updated));
      return updated;
    });
  };

  // Quick load favorite to Ch1 or Ch2
  const handleQuickLoad = (channelName, target) => {
    if (target === 1) {
      setInput1(channelName);
      setQuery1(channelName);
    } else {
      setInput2(channelName);
      setQuery2(channelName);
    }
  };

  // Smart auto quick load (fills empty slots first)
  const handleQuickLoadAuto = (channelName) => {
    if (!input1.trim()) {
      setInput1(channelName);
      setQuery1(channelName);
    } else if (!input2.trim()) {
      setInput2(channelName);
      setQuery2(channelName);
    } else {
      setInput1(channelName);
      setQuery1(channelName);
    }
  };

  // Helper function to extract or mock thumbnail design strategy for a channel
  const getThumbnailStrategy = (channelData, query) => {
    const seed = channelData?.channelInfo?.title || query || 'default';
    const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    return {
      dominantColors: hash % 2 === 0 
        ? ['#EF4444', '#000000', '#FFFFFF'] 
        : ['#3B82F6', '#1F2937', '#F3F4F6', '#F59E0B'].slice(0, 3),
      hasFace: hash % 3 !== 0,
      textType: hash % 3 === 0 ? '고대비 노란 글씨' : (hash % 3 === 1 ? '흰색 깔끔 자막' : '텍스트 없음'),
      styleTags: hash % 2 === 0 ? ['인물 중심', '자극적 자막', '고대비'] : ['제품 클로즈업', '미니멀', '깔끔함'],
      tags: channelData?.tagsUsage ? channelData.tagsUsage.map(t => t.text) : ['테크', '리뷰', 'IT꿀팁']
    };
  };

  // ECharts Force Graph Option for Tag Association Network (Feature #3)
  const getForceGraphOption = () => {
    if (!data1 || !data2) return {};

    const tags1 = data1.tagsUsage ? data1.tagsUsage.map(t => t.text) : [];
    const tags2 = data2.tagsUsage ? data2.tagsUsage.map(t => t.text) : [];

    // Combine all unique tags
    const allTagsSet = new Set([...tags1, ...tags2]);
    const allTags = Array.from(allTagsSet);

    const title1 = data1.channelInfo.title;
    const title2 = data2.channelInfo.title;

    // Generate nodes
    const nodes = allTags.map((tag) => {
      const isCh1 = tags1.includes(tag);
      const isCh2 = tags2.includes(tag);
      
      let category = 2; // Common
      let symbolSize = 34;
      if (isCh1 && !isCh2) {
        category = 0; // Channel 1 only
        symbolSize = 28;
      } else if (!isCh1 && isCh2) {
        category = 1; // Channel 2 only
        symbolSize = 28;
      } else if (isCh1 && isCh2) {
        category = 2; // Common
        symbolSize = 38;
      }

      return {
        id: tag,
        name: tag,
        symbolSize: symbolSize,
        value: symbolSize * 2,
        category: category,
        label: {
          show: true,
          position: 'inside',
          formatter: tag,
          fontSize: symbolSize > 30 ? 10 : 8,
          fontWeight: symbolSize > 30 ? 'bold' : 'normal',
          color: '#ffffff'
        }
      };
    });

    // Generate link edges
    const links = [];
    const addLinksForChannel = (tagsList) => {
      for (let i = 0; i < tagsList.length; i++) {
        for (let j = i + 1; j < tagsList.length; j++) {
          const source = tagsList[i];
          const target = tagsList[j];
          
          const exists = links.some(l => 
            (l.source === source && l.target === target) || 
            (l.source === target && l.target === source)
          );
          
          if (!exists) {
            links.push({
              source: source,
              target: target,
              lineStyle: {
                width: 1.5,
                opacity: 0.4
              }
            });
          } else {
            // Boost line style for overlapping nodes
            const linkIdx = links.findIndex(l => 
              (l.source === source && l.target === target) || 
              (l.source === target && l.target === source)
            );
            if (linkIdx !== -1) {
              links[linkIdx].lineStyle.width = 3.0;
              links[linkIdx].lineStyle.opacity = 0.7;
            }
          }
        }
      }
    };

    addLinksForChannel(tags1);
    addLinksForChannel(tags2);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          if (params.dataType === 'node') {
            const cat = params.data.category;
            let origin = '';
            if (cat === 0) origin = `${title1} 전용 태그`;
            else if (cat === 1) origin = `${title2} 전용 태그`;
            else origin = '두 채널 공통 태그';
            return `${params.name} (${origin})`;
          }
          return `${params.data.source} ↔ ${params.data.target}`;
        },
        backgroundColor: '#0c0c0f',
        borderColor: '#1e1e24',
        textStyle: { color: '#fafafa' }
      },
      legend: {
        show: true,
        textStyle: { color: '#a1a1aa' },
        bottom: 10,
        data: [
          { name: `${title1} 전용` },
          { name: `${title2} 전용` },
          { name: '공통 태그' }
        ]
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          data: nodes,
          links: links,
          categories: [
            { name: `${title1} 전용`, itemStyle: { color: '#2563eb' } }, // Blue
            { name: `${title2} 전용`, itemStyle: { color: '#10b981' } }, // Emerald
            { name: '공통 태그', itemStyle: { color: '#f59e0b' } }  // Amber
          ],
          roam: true,
          draggable: true,
          force: {
            repulsion: 220,
            edgeLength: 90,
            gravity: 0.08
          },
          lineStyle: {
            color: '#2e3039',
            curveness: 0.1
          }
        }
      ]
    };
  };

  const renderChannelDetails = (channelData, query, colorTheme) => {
    const { channelInfo, videos } = channelData;
    const strategy = getThumbnailStrategy(channelData, query);
    
    const themeStyles = colorTheme === 'blue' 
      ? {
          text: 'text-blue-400',
          border: 'border-blue-500/20',
          bg: 'bg-blue-500/5',
          tagBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          badge: 'bg-blue-600',
          badgeText: 'CH 1'
        }
      : {
          text: 'text-emerald-400',
          border: 'border-emerald-500/20',
          bg: 'bg-emerald-500/5',
          tagBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          badge: 'bg-emerald-600',
          badgeText: 'CH 2'
        };

    return (
      <div className="space-y-6">
        {/* Core Channel Info Card */}
        <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <img src={channelInfo.profileImage} alt={channelInfo.title} className={`w-12 h-12 rounded-full border-2 ${themeStyles.border} object-cover`} />
              <span className={`absolute -top-1 -left-1 ${themeStyles.badge} text-[9px] font-extrabold text-white px-1.5 py-0.5 rounded shadow`}>
                {themeStyles.badgeText}
              </span>
            </div>
            <div>
              <h4 className={`text-base font-bold ${themeStyles.text}`}>{channelInfo.title}</h4>
              <p className="text-zinc-500 text-xs line-clamp-1">{channelInfo.description}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-zinc-800/80 pt-4">
            <div className="space-y-0.5">
              <span className="text-zinc-500 block">구독자</span>
              <span className="text-zinc-200 font-mono font-bold text-sm">{formatNumber(channelInfo.subscribers)}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-zinc-500 block">누적 조회수</span>
              <span className="text-zinc-200 font-mono font-bold text-sm">{formatNumber(channelInfo.views)}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-zinc-500 block">평균 조회수</span>
              <span className="text-zinc-200 font-mono font-bold text-sm">{formatNumber(Math.floor(channelInfo.views / (channelInfo.videos || 1)))}</span>
            </div>
          </div>
        </div>

        {/* Tag Strategy Card */}
        <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
            <Hash className={themeStyles.text} size={16} />
            핵심 태그 분석
          </h3>
          <p className="text-zinc-500 text-xs mb-4">채널 유입 및 최상위 시청 노출에 기여하는 핵심 태그 키워드 세트입니다.</p>
          <div className="flex flex-wrap gap-2">
            {strategy.tags.map((tag) => (
              <span 
                key={tag}
                className={`inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-semibold`}
              >
                <span className={`${themeStyles.text} font-mono`}>#</span>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Thumbnail Strategy Analysis Card */}
        <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-2">
              <ImageIcon className={themeStyles.text} size={16} />
              썸네일 디자인 전략 분석
            </h3>
            <p className="text-zinc-500 text-xs">최신 업로드 비디오들의 시각 디자인 특징과 비주얼 벤치마킹 요소입니다.</p>
          </div>

          {/* Design features grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-b border-zinc-800/60 py-4 font-sans text-xs">
            <div className="space-y-1">
              <span className="text-zinc-500 uppercase tracking-wider block">주요 배색 (Dominant Colors)</span>
              <div className="flex gap-2 items-center pt-1.5">
                {strategy.dominantColors.map(color => (
                  <div 
                    key={color} 
                    className="w-5 h-5 rounded-full border border-zinc-800 shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                <span className="text-[10px] text-zinc-500 font-mono ml-1">Palette</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-zinc-500 uppercase tracking-wider block">인물 얼굴 포함 (Face)</span>
              <span className={`inline-flex items-center gap-1.5 font-semibold mt-1.5 text-sm
                ${strategy.hasFace ? 'text-emerald-400' : 'text-zinc-400'}
              `}>
                <Star size={14} className={strategy.hasFace ? 'fill-emerald-400 text-emerald-400' : ''} />
                {strategy.hasFace ? '얼굴 노출' : '제품 단독'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-zinc-500 uppercase tracking-wider block">타이포그래피 스타일</span>
              <span className="font-semibold text-zinc-200 mt-1.5 text-sm block">
                {strategy.textType}
              </span>
            </div>
          </div>

          {/* Visual style tags */}
          <div className="space-y-2">
            <span className="text-zinc-500 uppercase tracking-wider block text-xs">비주얼 스타일 태그</span>
            <div className="flex flex-wrap gap-1.5">
              {strategy.styleTags.map(tag => (
                <span key={tag} className={`${themeStyles.tagBg} px-2 py-0.5 rounded text-[10px] border font-medium`}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Thumbnail Grid Gallery */}
          <div className="space-y-3">
            <span className="text-zinc-500 uppercase tracking-wider block text-xs">최신 영상 썸네일</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {videos.slice(0, 4).map((vid) => (
                <div key={vid.id} className="group relative bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-sm hover:border-zinc-700 transition-colors">
                  <img src={vid.thumbnail} alt={vid.title} className="w-full aspect-video object-cover group-hover:scale-102 transition-transform duration-300" />
                  <div className="p-3">
                    <span className="font-semibold text-xs text-zinc-200 line-clamp-1 block group-hover:text-blue-400 transition-colors">{vid.title}</span>
                    <div className="flex justify-between items-center mt-2 text-[10px] text-zinc-500 font-mono">
                      <span>조회: {formatNumber(vid.views)}</span>
                      <span>ER: {((vid.likes + vid.comments) / (vid.views || 1) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-zinc-400 font-mono">경쟁 비교 데이터를 분석하는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !data1 || !data2) {
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

  return (
    <div className="space-y-6">
      {/* Header and Sub-Tab Toggle */}
      <div className="border-b border-zinc-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50 font-sans">경쟁 채널 비교 분석</h1>
          <p className="text-zinc-400 text-sm mt-1">내가 선택한 두 채널의 퍼포먼스 지표, 태그 키워드, 그리고 썸네일 디자인 전략을 1:1로 직접 벤치마킹합니다.</p>
        </div>

        {/* Matrix vs Force Graph Switcher */}
        <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800/80 self-start md:self-auto font-sans">
          <button
            onClick={() => setSubTab('matrix')}
            className={`
              px-3.5 py-1.5 rounded text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5
              ${subTab === 'matrix' 
                ? 'bg-blue-500/10 text-blue-500 shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200'
              }
            `}
          >
            <BarChart2 size={14} />
            비교 매트릭스 & 상세
          </button>
          <button
            onClick={() => setSubTab('network')}
            className={`
              px-3.5 py-1.5 rounded text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5
              ${subTab === 'network' 
                ? 'bg-blue-500/10 text-blue-500 shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200'
              }
            `}
          >
            <Network size={14} />
            태그 네트워크 분석망
          </button>
        </div>
      </div>

      {/* 2 Search Inputs Block & Favorites */}
      <div className="bg-[#0c0c0f]/80 backdrop-blur-md border border-zinc-800/80 rounded-xl p-5 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Channel 1 Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between pl-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                비교 채널 1
              </label>
              <button 
                onClick={() => toggleFavorite(input1)} 
                className="text-zinc-500 hover:text-yellow-400 active:scale-95 transition-all cursor-pointer"
                title="채널 1 즐겨찾기 토글"
              >
                <Star size={14} className={favorites.includes(input1.trim()) ? "fill-yellow-400 text-yellow-400" : ""} />
              </button>
            </div>
            <input
              type="text"
              value={input1}
              onChange={(e) => setInput1(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
              placeholder="채널명 또는 핸들명 입력"
              className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-750 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg py-2.5 px-4 text-sm text-zinc-200 placeholder-zinc-650 transition-all font-sans outline-none"
            />
          </div>
          
          {/* Channel 2 Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between pl-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                비교 채널 2
              </label>
              <button 
                onClick={() => toggleFavorite(input2)} 
                className="text-zinc-500 hover:text-yellow-400 active:scale-95 transition-all cursor-pointer"
                title="채널 2 즐겨찾기 토글"
              >
                <Star size={14} className={favorites.includes(input2.trim()) ? "fill-yellow-400 text-yellow-400" : ""} />
              </button>
            </div>
            <input
              type="text"
              value={input2}
              onChange={(e) => setInput2(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
              placeholder="채널명 또는 핸들명 입력"
              className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-750 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2.5 px-4 text-sm text-zinc-200 placeholder-zinc-650 transition-all font-sans outline-none"
            />
          </div>
        </div>

        {/* Favorite Channels Quick Load Section */}
        {favorites.length > 0 && (
          <div className="border-t border-zinc-800/60 pt-3.5 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block flex items-center gap-1.5">
              <Star size={11} className="fill-yellow-500/20 text-yellow-500" />
              즐겨찾기 채널 퀵 로드 (CH1 / CH2에 즉시 적용)
            </span>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {favorites.map((fav) => (
                <div 
                  key={fav}
                  className="inline-flex items-center gap-1.5 bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-750 rounded-lg px-2.5 py-1.5 transition-colors shadow-sm"
                >
                  <span 
                    onClick={() => handleQuickLoadAuto(fav)}
                    className="text-xs text-zinc-300 font-semibold cursor-pointer hover:text-white"
                    title="클릭 시 빈 입력창 또는 CH1에 자동 입력"
                  >
                    {fav}
                  </span>
                  <div className="flex gap-1 border-l border-zinc-800 pl-2 ml-1">
                    <button
                      onClick={() => handleQuickLoad(fav, 1)}
                      className="text-[9px] font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                      title="채널 1로 지정"
                    >
                      CH1
                    </button>
                    <button
                      onClick={() => handleQuickLoad(fav, 2)}
                      className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                      title="채널 2로 지정"
                    >
                      CH2
                    </button>
                    <button
                      onClick={() => toggleFavorite(fav)}
                      className="text-zinc-500 hover:text-red-400 px-0.5 text-xs transition-colors cursor-pointer"
                      title="즐겨찾기 삭제"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-end pt-1">
          <button
            onClick={handleCompare}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-750 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <BarChart2 size={14} />
            선택 채널 비교 실행
          </button>
        </div>
      </div>

      {subTab === 'matrix' ? (
        <>
          {/* Comparison Matrix Table */}
          <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <BarChart2 className="text-blue-500" size={18} />
                채널 퍼포먼스 비교 매트릭스
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">Performance Matrix</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 text-xs font-semibold">
                    <th className="p-4 pl-6">분석 대상 채널</th>
                    <th className="p-4">구독자 수</th>
                    <th className="p-4">누적 조회수</th>
                    <th className="p-4">영상 개수</th>
                    <th className="p-4 pr-6">영상당 평균 조회수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 text-sm text-zinc-300">
                  {/* Channel 1 */}
                  <tr className="bg-blue-500/5 hover:bg-blue-500/10 transition-colors font-medium">
                    <td className="p-4 pl-6 flex items-center gap-3">
                      <div className="relative">
                        <img src={data1.channelInfo.profileImage} alt={data1.channelInfo.title} className="w-9 h-9 rounded-full border border-blue-500/30 object-cover" />
                        <span className="absolute -top-1 -left-1 bg-blue-500 text-[8px] font-bold text-white px-1 py-0.25 rounded">CH 1</span>
                      </div>
                      <span className="font-bold text-blue-400">{data1.channelInfo.title}</span>
                    </td>
                    <td className="p-4 font-mono font-semibold">{formatNumber(data1.channelInfo.subscribers)}</td>
                    <td className="p-4 font-mono">{formatNumber(data1.channelInfo.views)}</td>
                    <td className="p-4 font-mono">{data1.channelInfo.videos}</td>
                    <td className="p-4 font-mono text-zinc-400">{formatNumber(Math.floor(data1.channelInfo.views / (data1.channelInfo.videos || 1)))}</td>
                  </tr>
                  
                  {/* Channel 2 */}
                  <tr className="bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors font-medium">
                    <td className="p-4 pl-6 flex items-center gap-3">
                      <div className="relative">
                        <img src={data2.channelInfo.profileImage} alt={data2.channelInfo.title} className="w-9 h-9 rounded-full border border-emerald-500/30 object-cover" />
                        <span className="absolute -top-1 -left-1 bg-emerald-500 text-[8px] font-bold text-white px-1 py-0.25 rounded">CH 2</span>
                      </div>
                      <span className="font-bold text-emerald-400">{data2.channelInfo.title}</span>
                    </td>
                    <td className="p-4 font-mono font-semibold">{formatNumber(data2.channelInfo.subscribers)}</td>
                    <td className="p-4 font-mono">{formatNumber(data2.channelInfo.views)}</td>
                    <td className="p-4 font-mono">{data2.channelInfo.videos}</td>
                    <td className="p-4 font-mono text-zinc-400">{formatNumber(Math.floor(data2.channelInfo.views / (data2.channelInfo.videos || 1)))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 1:1 Side-by-Side Detail Analysis Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: Channel 1 Details */}
            {renderChannelDetails(data1, query1, 'blue')}
            
            {/* Column 2: Channel 2 Details */}
            {renderChannelDetails(data2, query2, 'emerald')}
          </div>
        </>
      ) : (
        /* Force Graph View */
        <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Network className="text-blue-500" size={20} />
              태그 네트워크 연관 분석망
            </h3>
            <p className="text-zinc-400 text-xs mt-0.5">상위 노출 비디오들 사이에서 동시 다발적으로 매칭되어 출현하는 메인 태그들의 가중치 관계 그래프입니다. (드래그 가능)</p>
          </div>
          <div className="h-[550px] w-full bg-zinc-950/40 rounded-xl border border-zinc-900 relative">
            {isClient && <ReactECharts option={getForceGraphOption()} style={{ height: '100%', width: '100%' }} />}
          </div>
        </div>
      )}
    </div>
  );
}
