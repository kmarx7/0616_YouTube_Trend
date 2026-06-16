// Enhanced YouTube Service for TubePulse Next.js App
// Bridges YouTube Data API v3 and Mock Data Engine with Country and Category Support

import { 
  getMockTrendingTop100, 
  getMockEducationTop30, 
  getMockChannelData, 
  generateMockComments,
  getMockKeywordSearch
} from './mockData';

const KEY_STORAGE = 'tubepulse_api_key';
const COUNTRY_STORAGE = 'tubepulse_country';

export const getApiKey = () => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(KEY_STORAGE) || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';
};

export const setApiKey = (key) => {
  if (typeof window === 'undefined') return;
  if (key) {
    localStorage.setItem(KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(KEY_STORAGE);
  }
};

export const getCountry = () => {
  if (typeof window === 'undefined') return 'KR';
  return localStorage.getItem(COUNTRY_STORAGE) || 'KR';
};

export const setCountry = (code) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COUNTRY_STORAGE, code);
};

// Basic keyword list for client-side sentiment analysis of Korean comments
const POSITIVE_KEYWORDS = ['좋다', '좋아', '유익', '감사', '고맙', '최고', '대박', '꿀팁', '재밌', '재미있', '도움', '알찬', '퀄리티', '추천', '사랑', '멋지', '역시', '구독', '좋아요'];
const NEGATIVE_KEYWORDS = ['아쉽', '아쉬움', '지루', '노잼', '뻔한', '뻔하', '낚시', '별로', '실망', '소리가', '안들', '안들려', '발음', '말이', '광고', '스킵', '어렵', '불편', '알바', '아깝'];

export const analyzeSentiment = (text) => {
  if (!text) return 'neutral';
  const lowercaseText = text.toLowerCase();
  
  let score = 0;
  POSITIVE_KEYWORDS.forEach(kw => {
    if (lowercaseText.includes(kw)) score += 1;
  });
  NEGATIVE_KEYWORDS.forEach(kw => {
    if (lowercaseText.includes(kw)) score -= 1;
  });

  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
};

// Verify the YouTube API Key by making a simple request
export const verifyApiKey = async (apiKey) => {
  if (!apiKey) return false;
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=youtube&type=video&key=${apiKey}`
    );
    return res.ok;
  } catch (e) {
    console.error('API Verification error:', e);
    return false;
  }
};

// Fetch Top 100 Trending Videos
export const fetchTrendingVideos = async (categoryId = 'all') => {
  const apiKey = getApiKey();
  const country = getCountry();
  const isCustomCategory = categoryId !== 'all' && isNaN(Number(categoryId));

  if (!apiKey) {
    return getMockTrendingTop100(country, categoryId);
  }

  // If it's a custom keyword-based category, we fetch via keyword search since mostPopular doesn't support custom categories
  if (isCustomCategory) {
    const categoryKeywords = {
      beauty: '뷰티 메이크업 패션 OOTD',
      cooking: '요리 레시피 쿡방 맛집',
      travel: '여행 캠핑 세계여행 브이로그',
      tech: '스마트폰 테크 리뷰 IT기기',
      finance: '재테크 주식 투자 부동산',
      selfdev: '자기계발 생산성 동기부여',
      pets: '강아지 고양이 반려동물',
      media: '영화 리뷰 드라마 요약',
      health: '피트니스 다이어트 홈트',
      kids: '장난감 육아 어린이',
      culture: '미술 전시회 예술 클래식 뮤지컬'
    };
    const keyword = categoryKeywords[categoryId] || categoryId;
    try {
      const results = await fetchVideosByKeyword(keyword);
      return results.map(v => ({ ...v, categoryId }));
    } catch (e) {
      console.error('Custom category search fetch error:', e);
      return getMockTrendingTop100(country, categoryId);
    }
  }

  try {
    let videos = [];
    const maxResults = 50; // Max allowed per request by YouTube API
    const categoryFilter = categoryId !== 'all' ? `&videoCategoryId=${categoryId}` : '';

    // Page 1 (Top 50)
    let url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${country}&maxResults=${maxResults}${categoryFilter}&key=${apiKey}`;
    let res = await fetch(url);
    if (!res.ok) throw new Error(`Trending fetch failed: ${res.statusText}`);
    let data = await res.json();
    
    if (data.items) {
      videos = [...data.items];
    }

    // Page 2 (Next 50, if nextPageToken exists)
    if (data.nextPageToken) {
      let urlPage2 = `${url}&pageToken=${data.nextPageToken}`;
      let res2 = await fetch(urlPage2);
      if (res2.ok) {
        let data2 = await res2.json();
        if (data2.items) {
          videos = [...videos, ...data2.items];
        }
      }
    }

    // Map to normalized data structure
    return videos.map((item, idx) => {
      const views = parseInt(item.statistics?.viewCount) || 0;
      const likes = parseInt(item.statistics?.likeCount) || 0;
      const comments = parseInt(item.statistics?.commentCount) || 0;
      
      let durationSec = 600;
      try {
        const matches = item.contentDetails?.duration?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (matches) {
          const hours = parseInt(matches[1] || 0);
          const minutes = parseInt(matches[2] || 0);
          const seconds = parseInt(matches[3] || 0);
          durationSec = (hours * 3600) + (minutes * 60) + seconds;
        }
      } catch (e) {}

      return {
        id: item.id,
        rank: idx + 1,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.high?.url || '',
        publishedAt: item.snippet.publishedAt,
        views,
        likes,
        comments,
        duration: durationSec,
        categoryId: item.snippet.categoryId,
        tags: item.snippet.tags || [],
        engagementRate: views > 0 ? parseFloat((((likes + comments) / views) * 100).toFixed(2)) : 0
      };
    });
  } catch (e) {
    console.error('API Trending fetch failed, falling back to mock data', e);
    // Return mock data with an API error flag attached
    const mockData = getMockTrendingTop100(country, categoryId);
    mockData.apiError = e.message;
    return mockData;
  }
};

// Fetch Top 30 Education Videos (Category 27)
export const fetchEducationVideos = async (subCategory = 'all') => {
  const apiKey = getApiKey();
  const country = getCountry();

  if (!apiKey) {
    return getMockEducationTop30(country, subCategory);
  }

  try {
    // Category 27 is Education in YouTube API
    let url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${country}&videoCategoryId=27&maxResults=30&key=${apiKey}`;
    let res = await fetch(url);
    if (!res.ok) throw new Error(`Education fetch failed: ${res.statusText}`);
    let data = await res.json();

    let videos = data.items || [];
    
    // Map to normalized data structure
    let mapped = videos.map((item, idx) => {
      const views = parseInt(item.statistics?.viewCount) || 0;
      const likes = parseInt(item.statistics?.likeCount) || 0;
      const comments = parseInt(item.statistics?.commentCount) || 0;

      return {
        id: item.id,
        rank: idx + 1,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.high?.url || '',
        publishedAt: item.snippet.publishedAt,
        views,
        likes,
        comments,
        duration: 900,
        subCategory: 'all', // Can't easily determine subcategory from YouTube API, we default to all or parse keyword
        engagementRate: views > 0 ? parseFloat((((likes + comments) / views) * 100).toFixed(2)) : 0
      };
    });

    // If a subcategory filter is chosen, do a client-side keyword filter
    if (subCategory !== 'all') {
      const keywords = {
        programming: ['코딩', '프로그래밍', 'react', 'python', 'code', 'coding', 'js', 'next.js', '개발', '자바스크립트'],
        science: ['과학', '우주', '물리', '양자', 'science', 'universe', 'physics'],
        language: ['영어', '회화', 'japanese', 'english', '말하기', '단어'],
        finance: ['주식', '재테크', '경제', '금리', '투자', 'finance', 'economy']
      };
      
      const filterWords = keywords[subCategory] || [];
      mapped = mapped.filter(v => {
        const titleLower = v.title.toLowerCase();
        return filterWords.some(w => titleLower.includes(w));
      });

      // If filter results in too few videos, augment with mock education videos of that subcategory
      if (mapped.length < 5) {
        const mocks = getMockEducationTop30(country, subCategory);
        mapped = [...mapped, ...mocks.slice(mapped.length)].map((v, idx) => ({ ...v, rank: idx + 1 }));
      } else {
        mapped = mapped.map((v, idx) => ({ ...v, rank: idx + 1 }));
      }
    }

    return mapped;
  } catch (e) {
    console.error('API Education fetch failed, falling back to mock data', e);
    const mockData = getMockEducationTop30(country, subCategory);
    mockData.apiError = e.message;
    return mockData;
  }
};

// Fetch Video Comments (for Sentiment Analyzer drawer)
export const fetchComments = async (videoId, videoTitle) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return generateMockComments(videoId, videoTitle);
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=30&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Comments fetch failed: ${res.statusText}`);
    const data = await res.json();

    const items = data.items || [];
    return items.map((item) => {
      const snippet = item.snippet.topLevelComment.snippet;
      const text = snippet.textDisplay;
      return {
        id: item.id,
        author: snippet.authorDisplayName,
        authorProfileImageUrl: snippet.authorProfileImageUrl,
        text,
        sentiment: analyzeSentiment(text),
        likes: snippet.likeCount || 0,
        publishedAt: snippet.publishedAt
      };
    });
  } catch (e) {
    console.warn('API Comments fetch failed, falling back to mock comments', e);
    return generateMockComments(videoId, videoTitle);
  }
};

// Channel details fetcher (augmented)
export const fetchChannelData = async (query) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return getMockChannelData(query);
  }

  try {
    let channelId = query;
    const isId = query.startsWith('UC') && query.length === 24;

    if (!isId) {
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(query)}&type=channel&key=${apiKey}`
      );
      if (!searchRes.ok) throw new Error('Channel search failed');
      const searchData = await searchRes.json();
      if (!searchData.items || searchData.items.length === 0) {
        throw new Error('No channel found matching query');
      }
      channelId = searchData.items[0].id.channelId;
    }

    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${apiKey}`
    );
    if (!channelRes.ok) throw new Error('Channel details fetch failed');
    const channelData = await channelRes.json();
    if (!channelData.items || channelData.items.length === 0) {
      throw new Error('Channel details empty');
    }

    const ch = channelData.items[0];
    const cleanChannelInfo = {
      id: ch.id,
      title: ch.snippet.title,
      description: ch.snippet.description,
      profileImage: ch.snippet.thumbnails?.default?.url || ch.snippet.thumbnails?.high?.url || '',
      bannerImage: ch.brandingSettings?.image?.bannerExternalUrl || '',
      subscribers: parseInt(ch.statistics.subscriberCount) || 0,
      views: parseInt(ch.statistics.viewCount) || 0,
      videos: parseInt(ch.statistics.videoCount) || 0,
    };

    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=10&order=date&type=video&key=${apiKey}`
    );
    if (!videosRes.ok) throw new Error('Latest videos fetch failed');
    const videosData = await videosRes.json();
    
    let cleanVideos = [];
    if (videosData.items && videosData.items.length > 0) {
      const videoIds = videosData.items.map(item => item.id.videoId).join(',');
      const videoStatsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=${videoIds}&key=${apiKey}`
      );
      if (videoStatsRes.ok) {
        const videoStatsData = await videoStatsRes.json();
        cleanVideos = videoStatsData.items.map(item => {
          const views = parseInt(item.statistics.viewCount) || 0;
          const likes = parseInt(item.statistics.likeCount) || 0;
          const commentsCount = parseInt(item.statistics.commentCount) || 0;
          
          return {
            id: item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.high?.url || '',
            publishedAt: item.snippet.publishedAt,
            views,
            likes,
            comments: commentsCount,
            duration: 600,
            engagementRate: views > 0 ? parseFloat((((likes + commentsCount) / views) * 100).toFixed(2)) : 0
          };
        });
      }
    }

    const mockAugment = getMockChannelData(cleanChannelInfo.title);
    return {
      channelInfo: cleanChannelInfo,
      subscriberTrend: mockAugment.subscriberTrend,
      videos: cleanVideos.length > 0 ? cleanVideos : mockAugment.videos,
      categories: mockAugment.categories,
      tagsUsage: mockAugment.tagsUsage,
      uploadTimeStats: mockAugment.uploadTimeStats,
      competitors: mockAugment.competitors,
      comments: mockAugment.comments,
      sentimentSummary: mockAugment.sentimentSummary,
      sentimentKeywords: mockAugment.sentimentKeywords
    };
  } catch (e) {
    console.error('Real API failed, falling back to mock data', e);
    return {
      ...getMockChannelData(query),
      apiError: e.message
    };
  }
};

// Fetch Videos globally by keyword
export const fetchVideosByKeyword = async (query) => {
  const apiKey = getApiKey();
  const country = getCountry();

  if (!apiKey) {
    return getMockKeywordSearch(query, country);
  }

  try {
    // 1. Search endpoint to get Video IDs
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=50&q=${encodeURIComponent(query)}&type=video&regionCode=${country}&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) throw new Error(`Keyword Search failed: ${searchRes.statusText}`);
    const searchData = await searchRes.json();

    const items = searchData.items || [];
    if (items.length === 0) return [];

    const videoIds = items.map(item => item.id.videoId).filter(Boolean).join(',');
    if (!videoIds) return [];

    // 2. Videos endpoint to resolve detailed statistics (views, likes, category, duration)
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${apiKey}`;
    const videosRes = await fetch(videosUrl);
    if (!videosRes.ok) throw new Error(`Videos detail fetch failed: ${videosRes.statusText}`);
    const videosData = await videosRes.json();

    const detailItems = videosData.items || [];
    
    // Map to normalized data structure
    return detailItems.map((item, idx) => {
      const views = parseInt(item.statistics?.viewCount) || 0;
      const likes = parseInt(item.statistics?.likeCount) || 0;
      const commentsCount = parseInt(item.statistics?.commentCount) || 0;
      
      let durationSec = 600;
      try {
        const matches = item.contentDetails?.duration?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (matches) {
          const hours = parseInt(matches[1] || 0);
          const minutes = parseInt(matches[2] || 0);
          const seconds = parseInt(matches[3] || 0);
          durationSec = (hours * 3600) + (minutes * 60) + seconds;
        }
      } catch (e) {}

      return {
        id: item.id,
        rank: idx + 1,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.high?.url || '',
        publishedAt: item.snippet.publishedAt,
        views,
        likes,
        comments: commentsCount,
        duration: durationSec,
        categoryId: item.snippet.categoryId,
        tags: item.snippet.tags || [],
        engagementRate: views > 0 ? parseFloat((((likes + commentsCount) / views) * 100).toFixed(2)) : 0
      };
    });
  } catch (e) {
    console.error('API keyword search failed, falling back to mock data', e);
    const mockData = getMockKeywordSearch(query, country);
    mockData.apiError = e.message;
    return mockData;
  }
};
