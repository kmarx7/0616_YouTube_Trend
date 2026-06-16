// Enhanced Mock data engine for TubePulse Next.js app
// Generates realistic YouTube analytics data based on search queries, categories, and countries

const randomRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Mock database of video categories
export const YOUTUBE_CATEGORIES = [
  { id: 'all', name: '전체' },
  { id: '10', name: '음악 (Music)' },
  { id: '20', name: '게임 (Gaming)' },
  { id: '24', name: '엔터테인먼트 (Entertainment)' },
  { id: '28', name: '과학기술 (Science & Tech)' },
  { id: '27', name: '교육 (Education)' },
  { id: '17', name: '스포츠 (Sports)' }
];

// Mock database of countries
export const YOUTUBE_COUNTRIES = [
  { code: 'KR', name: '대한민국 (South Korea)' },
  { code: 'US', name: '미국 (United States)' },
  { code: 'JP', name: '일본 (Japan)' },
  { code: 'GB', name: '영국 (United Kingdom)' },
  { code: 'DE', name: '독일 (Germany)' }
];

// Helper to generate comments based on title/keyword
export const generateMockComments = (videoId, title) => {
  const cleanTitle = title ? title.split('[')[0].split('(')[0].trim() : '이 영상';
  const positives = [
    `진짜 유익한 영상이네요! "${cleanTitle}" 관련해서 정말 많은 도움이 되었습니다.`,
    `와, 퀄리티 대단합니다... 설명도 너무 깔끔해서 스킵 없이 다 봤네요.`,
    `구독 누르고 갑니다! 앞으로도 이런 유익한 콘텐츠 많이 올려주세요.`,
    `이 분야 설명 중 가장 직관적이고 이해가 잘 되네요. 감사합니다!`,
    `썸네일 보고 홀린 듯 들어왔는데 내용이 너무 꽉 차있어서 감동입니다.`
  ];
  const neutrals = [
    `무난하게 볼만하네요. 내용 정리가 잘 되어 있습니다.`,
    `영상 길이가 조금 길어서 요약본이나 타임스탬프가 있으면 더 좋을 것 같아요.`,
    `기본적인 내용 위주라 초보자분들이 보기에 적합한 듯합니다.`,
    `한번쯤 생각해볼 만한 주제네요. 잘 봤습니다.`,
    `정리는 잘 되어 있는데 조금 더 심도 깊은 분석이 있으면 좋겠어요.`
  ];
  const negatives = [
    `내용이 생각보다 뻔하네요... 자극적인 썸네일에 비해 얻어가는 건 별로 없어요.`,
    `배경음이 너무 커서 설명 소리가 잘 안 들립니다. 오디오 확인 좀 해주세요.`,
    `말투가 너무 느리고 서론이 너무 길어서 루즈해집니다.`,
    `기대한 것만큼의 정보는 아닌 것 같네요. 아쉽습니다.`,
    `요즘 너무 비슷한 래퍼토리가 많아서 굳이 이 영상이어야 할 이유를 모르겠네요.`
  ];

  const authors = ['김철수', '이영희', 'JohnDoe', 'Tanaka', 'Smith', '박민수', '최지우', '강현우', '유진', '조이'];
  
  const comments = [];
  for (let i = 0; i < 25; i++) {
    const roll = Math.random();
    let sentiment, text;
    if (roll < 0.6) {
      sentiment = 'positive';
      text = positives[randomRange(0, positives.length - 1)];
    } else if (roll < 0.85) {
      sentiment = 'neutral';
      text = neutrals[randomRange(0, neutrals.length - 1)];
    } else {
      sentiment = 'negative';
      text = negatives[randomRange(0, negatives.length - 1)];
    }
    
    const name = authors[randomRange(0, authors.length - 1)] + randomRange(10, 99);
    comments.push({
      id: `${videoId}_comment_${i}`,
      author: name,
      authorProfileImageUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
      text,
      sentiment,
      likes: randomRange(0, 800),
      publishedAt: new Date(Date.now() - i * 4 * 60 * 60 * 1000).toISOString()
    });
  }

  return comments.sort((a, b) => b.likes - a.likes);
};

// Generates Top 100 Trending Videos
export const getMockTrendingTop100 = (country, categoryId) => {
  const cName = country || 'KR';
  const catId = categoryId || 'all';

  // Specific content by country
  const countryPrefixes = {
    KR: { title: '한국 인기 급상승', suffix: '대박', channels: ['K-Tech', '핫이슈', '이슈포커스', '테크튜브'] },
    US: { title: 'US Trending Now', suffix: 'Viral', channels: ['US Tech', 'WorldNews', 'ByteSize', 'TechLab'] },
    JP: { title: '日本のトレンド', suffix: '話題', channels: ['日本テック', 'トレンドTV', 'エンタメch', '日常ログ'] },
    GB: { title: 'UK Top Trend', suffix: 'Must Watch', channels: ['UK Reviewer', 'DailyBeats', 'FocalPoint', 'Pulse'] },
    DE: { title: 'DE Trend Video', suffix: 'Aktuell', channels: ['DeutschTech', 'TagesInfo', 'WissenNetz', 'Fokus'] }
  };

  const pref = countryPrefixes[cName] || countryPrefixes.KR;

  const videoTemplates = [
    { title: `[${pref.suffix}] 2026년 하반기 업계 뒤흔들 미친 신제품 언박싱`, cat: '28', duration: 720 },
    { title: `드디어 출시된 세계 최초 기술, 과연 돈값 할까?`, cat: '28', duration: 900 },
    { title: `최근 난리난 역대급 콜라보 라이브 공연 교차편집`, cat: '10', duration: 320 },
    { title: `빌보드 차트 휩쓸어버린 신곡 1시간 연속 재생`, cat: '10', duration: 3600 },
    { title: `랭크게임 1위 달성! 사기적인 메타 빌드 전격 공개`, cat: '20', duration: 1200 },
    { title: `프로게이머가 분석한 이번 패치노트 핵심 총정리`, cat: '20', duration: 540 },
    { title: `실제 촬영 중 터져나온 방송사고급 돌발상황 모음`, cat: '24', duration: 420 },
    { title: `조회수 폭발한 역대급 몰래카메라 레전드 ㅋㅋㅋ`, cat: '24', duration: 680 },
    { title: `프리미어리그 득점왕 활약상 단독 카메라 하이라이트`, cat: '17', duration: 480 },
    { title: `이주의 레전드 명경기 끝장 승부 요약본`, cat: '17', duration: 840 },
    { title: `10분 만에 마스터하는 핵심 물리학 기초 이론`, cat: '27', duration: 600 },
    { title: `비전공자도 단숨에 이해하는 컴퓨터 구조 입문 특강`, cat: '27', duration: 750 }
  ];

  // Map to 100 items by repeating or generating dynamically
  const videos = Array.from({ length: 100 }).map((_, idx) => {
    const template = videoTemplates[idx % videoTemplates.length];
    
    // Check if category filter matches
    let category = template.cat;
    let title = `${pref.title} #${idx + 1} - ${template.title}`;

    const views = randomRange(50000, 3000000) - (idx * 25000);
    const viewsClean = Math.max(views, 12000);
    const likes = Math.floor(viewsClean * (randomRange(2, 8) / 100));
    const commentsCount = Math.floor(viewsClean * (randomRange(1, 5) / 1000));
    const publishedAt = new Date(Date.now() - idx * 30 * 60 * 1000).toISOString();

    return {
      id: `trend_100_vid_${cName}_${catId}_${idx}`,
      rank: idx + 1,
      title,
      channelTitle: pref.channels[idx % pref.channels.length],
      thumbnail: `https://picsum.photos/seed/trend_${cName}_${idx}/640/360`,
      publishedAt,
      views: viewsClean,
      likes,
      comments: commentsCount,
      duration: template.duration,
      categoryId: category,
      engagementRate: parseFloat(((likes + commentsCount) / viewsClean * 100).toFixed(2))
    };
  });

  // Filter if not 'all'
  if (catId !== 'all') {
    return videos.filter(v => v.categoryId === catId).map((v, i) => ({ ...v, rank: i + 1 }));
  }

  return videos;
};

// Generates Top 30 Education Videos (Category 27)
export const getMockEducationTop30 = (country, subCategory) => {
  const cName = country || 'KR';
  const sub = subCategory || 'all'; // all, programming, science, language, finance

  const templates = [
    { title: '처음부터 배우는 파이썬 기초 프로그래밍 완벽 정복', sub: 'programming', views: 850000 },
    { title: 'Next.js App Router 15분 만에 핵심 개념 끝내기', sub: 'programming', views: 320000 },
    { title: 'React 19에 추가된 신기능 실전 활용 꿀팁', sub: 'programming', views: 250000 },
    { title: '우주 팽창의 비밀과 아인슈타인 상대성이론 해설', sub: 'science', views: 980000 },
    { title: '양자역학이 도대체 뭔지 초등학생도 이해하게 설명해드림', sub: 'science', views: 1200000 },
    { title: '뇌 과학이 증명한 공부 집중력 200% 올리는 법', sub: 'science', views: 540000 },
    { title: '미국 현지인들이 매일 쓰는 진짜 영어 회화 50문장', sub: 'language', views: 650000 },
    { title: '하루 10분으로 영어 귀 뚫는 쉐도잉 훈련법', sub: 'language', views: 420000 },
    { title: '외우지 않고 자동으로 트이는 영어 원리 강의', sub: 'language', views: 720000 },
    { title: '2026년 금리 변동 시나리오와 필수 경제/재테크 상식', sub: 'finance', views: 880000 },
    { title: '주식 초보자가 반드시 피해야 할 재무제표 보는 법', sub: 'finance', views: 460000 },
    { title: '인플레이션과 자산 방어 전략 - 경제학 쉽게 이해하기', sub: 'finance', views: 390000 }
  ];

  const channels = {
    KR: ['테크마스터 교육', '지식의 창', '글로벌 랭귀지', '머니트렌드', '사이언스랩'],
    US: ['EduLearn', 'ScienceBox', 'TalkNative', 'Finance101', 'DevClassroom'],
    JP: ['学べるIT', '教養TV', '英会話ch', '経済アカデミー', '科学の不思議']
  };

  const activeChannels = channels[cName] || channels.KR;

  const videos = Array.from({ length: 30 }).map((_, idx) => {
    const template = templates[idx % templates.length];
    const channelTitle = activeChannels[idx % activeChannels.length];

    const mult = cName === 'US' ? 2.5 : (cName === 'JP' ? 1.4 : 1.0);
    const views = Math.floor(template.views * mult) - (idx * 5000);
    const viewsClean = Math.max(views, 20000);
    const likes = Math.floor(viewsClean * (randomRange(4, 9) / 100)); // Education tends to have higher likes ratio
    const commentsCount = Math.floor(viewsClean * (randomRange(2, 6) / 1000));
    const publishedAt = new Date(Date.now() - idx * 2 * 24 * 60 * 60 * 1000).toISOString();

    return {
      id: `edu_30_vid_${cName}_${sub}_${idx}`,
      rank: idx + 1,
      title: `[교육] ${template.title}`,
      channelTitle,
      thumbnail: `https://picsum.photos/seed/edu_${cName}_${idx}/640/360`,
      publishedAt,
      views: viewsClean,
      likes,
      comments: commentsCount,
      duration: randomRange(450, 1800),
      subCategory: template.sub,
      engagementRate: parseFloat(((likes + commentsCount) / viewsClean * 100).toFixed(2))
    };
  });

  if (sub !== 'all') {
    return videos.filter(v => v.subCategory === sub).map((v, i) => ({ ...v, rank: i + 1 }));
  }

  return videos;
};

// Original Channel Analyzer Mock Data mapping
export const getMockChannelData = (channelNameOrUrl) => {
  const cleanName = channelNameOrUrl ? channelNameOrUrl.replace(/[@https://www.youtube.com/c/]/g, '').split('/')[0] : 'IT_Tech_Reviewer';
  const keyword = cleanName;

  const subscriberCount = randomRange(350000, 1800000);
  const viewCount = subscriberCount * randomRange(45, 120);
  const videoCount = randomRange(120, 850);
  
  const videoTitles = [
    `2026년 하반기 ${keyword} 절대 사지 마세요 (대안 추천)`,
    `내가 3주간 써보고 느낀 솔직한 장단점 분석`,
    `드디어 출시! 진짜 쓸만한지 상세하게 뜯어봤습니다`,
    `${keyword} 입문자를 위한 10분 마스터 가이드`,
    `가성비 끝판왕으로 소문난 신제품 광고 아님 (리얼 리뷰)`,
    `전문가가 알려주는 숨겨진 꿀기능 탑 5`,
    `아이폰 갤럭시 전격 비교! 당신의 선택은?`,
    `대학생/직장인 맞춤형 추천 및 최종 등급 매기기`,
    `100만원대 제품 중 가장 만족도 높았던 모델 공개`,
    `광고주 눈물 흘리는 솔직 깐깐 솔직 리뷰`
  ];

  const videos = videoTitles.map((title, idx) => {
    const views = randomRange(50000, 950000);
    const likes = Math.floor(views * (randomRange(2, 6) / 100));
    const commentsCount = Math.floor(views * (randomRange(1, 8) / 1000));
    const publishedAt = new Date(Date.now() - idx * 5 * 24 * 60 * 60 * 1000).toISOString();
    const durationSec = idx === 4 || idx === 8 ? randomRange(30, 59) : randomRange(360, 1200);

    return {
      id: `vid_${idx}`,
      title,
      description: `유튜브 채널 ${keyword}의 최신 영상입니다. 이번 영상에서는 많은 분들이 궁금해하셨던 정보를 낱낱이 분석합니다. #유튜브 #분석 #${keyword}`,
      thumbnail: `https://picsum.photos/seed/${idx + keyword}/640/360`,
      publishedAt,
      views,
      likes,
      comments: commentsCount,
      duration: durationSec,
      engagementRate: parseFloat(((likes + commentsCount) / views * 100).toFixed(2))
    };
  });

  const competitorNames = [
    `${keyword}_Plus`,
    `테크_마스터_TV`,
    `리얼_리뷰어_X`,
    `가성비_정보통`
  ];

  const competitors = competitorNames.map((compName, idx) => {
    const compSubs = subscriberCount * (0.6 + idx * 0.25);
    const compViews = compSubs * randomRange(30, 90);
    const compVideos = randomRange(100, 600);
    
    const tags = ['테크', keyword, '가성비', '비교리뷰', 'IT꿀팁', '언박싱', '내돈내산', '스마트폰', '사용후기', '추천템'];
    const compTags = tags.filter(() => Math.random() > 0.4).slice(0, 6);

    const compVids = Array.from({ length: 5 }).map((_, vIdx) => {
      const cViews = randomRange(40000, 800000);
      return {
        id: `comp_${idx}_vid_${vIdx}`,
        title: `[${compName}] ${keyword} 필수 가이드 및 솔직 리뷰 #${vIdx + 1}`,
        thumbnail: `https://picsum.photos/seed/${compName}_${vIdx}/640/360`,
        views: cViews,
        likes: Math.floor(cViews * 0.03),
        comments: Math.floor(cViews * 0.003),
        publishedAt: new Date(Date.now() - vIdx * 5 * 24 * 60 * 60 * 1000).toISOString(),
        tags: compTags
      };
    });

    return {
      channelId: `comp_ch_${idx}`,
      channelName: compName,
      profileImage: `https://api.dicebear.com/7.x/identicon/svg?seed=${compName}`,
      subscribers: Math.floor(compSubs),
      totalViews: Math.floor(compViews),
      videoCount: compVideos,
      averageViews: Math.floor(compViews / compVideos),
      tags: compTags,
      latestVideos: compVids,
      thumbnailStrategy: {
        dominantColors: ['#FF0000', '#000000', '#FFFFFF', '#FFD700'].slice(0, randomRange(2, 3)),
        hasFace: idx % 2 === 0,
        textType: idx % 3 === 0 ? '고대비 노란 글씨' : (idx % 3 === 1 ? '흰색 깔끔 자막' : '텍스트 없음'),
        styleTags: idx % 2 === 0 ? ['인물 중심', '자극적 자막', '고대비'] : ['제품 클로즈업', '미니멀', '깔끔함']
      }
    };
  });

  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  let currentSubs = subscriberCount - 200000;
  const subscriberTrend = months.map(month => {
    const growth = randomRange(10000, 40000);
    currentSubs += growth;
    return { month, subscribers: currentSubs, growth };
  });

  const categories = [
    { name: '리뷰/언박싱', count: Math.floor(videoCount * 0.4) },
    { name: '비교 분석', count: Math.floor(videoCount * 0.25) },
    { name: '꿀팁/사용기', count: Math.floor(videoCount * 0.2) },
    { name: '기타/일상', count: Math.floor(videoCount * 0.15) }
  ];

  const tagsUsage = [
    { text: keyword, value: randomRange(80, 100) },
    { text: '테크', value: randomRange(70, 90) },
    { text: '리뷰', value: randomRange(60, 80) },
    { text: '비교', value: randomRange(50, 70) },
    { text: 'IT', value: randomRange(50, 70) }
  ];

  const uploadTimeStats = {
    days: [
      { name: '월', count: randomRange(10, 40) },
      { name: '화', count: randomRange(15, 35) },
      { name: '수', count: randomRange(30, 60) },
      { name: '목', count: randomRange(10, 30) },
      { name: '금', count: randomRange(40, 70) },
      { name: '토', count: randomRange(5, 20) },
      { name: '일', count: randomRange(20, 45) }
    ],
    hours: [
      { name: '오전 (06~12시)', count: randomRange(5, 25) },
      { name: '오후 (12~18시)', count: randomRange(40, 85) },
      { name: '저녁 (18~24시)', count: randomRange(60, 120) },
      { name: '심야 (00~06시)', count: randomRange(2, 10) }
    ]
  };

  const commentSentiment = generateMockComments(`ch_main_${keyword}`, videoTitles[0]);
  const positiveCount = commentSentiment.filter(c => c.sentiment === 'positive').length;
  const neutralCount = commentSentiment.filter(c => c.sentiment === 'neutral').length;
  const negativeCount = commentSentiment.filter(c => c.sentiment === 'negative').length;
  const total = commentSentiment.length || 1;

  return {
    channelInfo: {
      id: `ch_id_${keyword}`,
      title: cleanName.toUpperCase(),
      description: `공식 ${cleanName} 분석 채널 대시보드입니다. 최신 테크 정보와 알찬 비교 분석 리뷰를 업로드합니다.`,
      profileImage: `https://api.dicebear.com/7.x/initials/svg?seed=${cleanName}`,
      bannerImage: 'https://picsum.photos/seed/banner/1200/300',
      subscribers: subscriberCount,
      views: viewCount,
      videos: videoCount,
    },
    subscriberTrend,
    videos,
    categories,
    tagsUsage,
    uploadTimeStats,
    competitors,
    comments: commentSentiment,
    sentimentSummary: {
      positive: parseFloat(((positiveCount / total) * 100).toFixed(1)),
      neutral: parseFloat(((neutralCount / total) * 100).toFixed(1)),
      negative: parseFloat(((negativeCount / total) * 100).toFixed(1))
    },
    sentimentKeywords: {
      positive: ['유익해요', '설명 최고', '도움받았습니다', '깔끔편집', '추천합니당'],
      negative: ['조금 아쉽', '썸네일 낚시', '지루하네요', '뻔한 내용', '오디오 볼륨']
    }
  };
};

export const getMockKeywordSearch = (query, country) => {
  const cName = country || 'KR';
  const keyword = query || '유튜브';

  const channels = {
    KR: ['테크가이드', '뉴스토픽', '엔터웨이브', '게임연구소', '머니머니', '공부방'],
    US: ['TechPulse', 'NewsFlash', 'EntZone', 'GamingLab', 'FinancePro', 'StudyHub'],
    JP: ['テックTV', '速報ニュース', 'エンタメ広場', 'ゲーム実況ch', 'マネーch', '勉強ナビ'],
    GB: ['TechSpot', 'DailyNews', 'Showbiz', 'GameOn', 'WealthWise', 'LearnFast'],
    DE: ['TechWelle', 'BlitzNews', 'ShowTime', 'SpielZone', 'FinanzNetz', 'LernEcke']
  };

  const activeChannels = channels[cName] || channels.KR;

  const categories = ['10', '20', '24', '27', '28', '17'];
  const categoryNames = {
    '10': '음악',
    '20': '게임',
    '24': '엔터테인먼트',
    '27': '교육',
    '28': '과학기술',
    '17': '스포츠'
  };

  const templates = [
    { title: `실시간 핫한 "${keyword}" 트렌드와 현상 분석`, cat: '24' },
    { title: `최초 공개! "${keyword}" 충격적인 실제 현장 리뷰`, cat: '28' },
    { title: `많은 사람들이 모르는 "${keyword}"의 유용한 꿀팁 Top 5`, cat: '27' },
    { title: `드디어 탄생한 "${keyword}" 역대급 플레이 모음집`, cat: '20' },
    { title: `중독성 장난 아닌 "${keyword}" 관련 노동요 연속 듣기`, cat: '10' },
    { title: `전설적인 선수가 극찬한 "${keyword}" 레전드 활약`, cat: '17' }
  ];

  const videos = Array.from({ length: 50 }).map((_, idx) => {
    const template = templates[idx % templates.length];
    const category = template.cat;
    const title = `[${categoryNames[category]}] ${template.title.replace(keyword, keyword + ' #' + (idx + 1))}`;

    const views = randomRange(50000, 2500000) - (idx * 20000);
    const viewsClean = Math.max(views, 15000);
    const likes = Math.floor(viewsClean * (randomRange(3, 9) / 100));
    const commentsCount = Math.floor(viewsClean * (randomRange(2, 6) / 1000));
    const publishedAt = new Date(Date.now() - idx * 2 * 60 * 60 * 1000).toISOString();

    return {
      id: `search_vid_${cName}_${idx}`,
      rank: idx + 1,
      title,
      channelTitle: activeChannels[idx % activeChannels.length],
      thumbnail: `https://picsum.photos/seed/search_${cName}_${idx}/640/360`,
      publishedAt,
      views: viewsClean,
      likes,
      comments: commentsCount,
      duration: randomRange(180, 1500),
      categoryId: category,
      engagementRate: parseFloat(((likes + commentsCount) / viewsClean * 100).toFixed(2))
    };
  });

  return videos;
};
