import React, { useState, useEffect } from 'react';
import { 
  Key, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  Eye, 
  EyeOff, 
  Trash2,
  AlertCircle,
  Globe
} from 'lucide-react';
import { getApiKey, setApiKey, verifyApiKey, getCountry, setCountry } from '../utils/youtubeService';
import { YOUTUBE_COUNTRIES } from '../utils/mockData';

export default function SettingsView() {
  const [apiKey, setApiKeyState] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, success, error
  const [apiConnected, setApiConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('KR');

  useEffect(() => {
    setSelectedCountry(getCountry());
    const key = getApiKey();
    if (key) {
      setApiKeyState(key);
      setApiConnected(true);
    }
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setVerifying(true);
    setStatus('idle');
    setErrorMessage('');

    const isValid = await verifyApiKey(apiKey.trim());
    if (isValid) {
      setApiKey(apiKey.trim());
      setApiConnected(true);
      setStatus('success');
    } else {
      setStatus('error');
      setErrorMessage('API 키 검증에 실패했습니다. 키 값이 올바른지 혹은 할당량이 남아있는지 확인해주세요.');
    }
    setVerifying(false);
  };

  const handleDelete = () => {
    setApiKey('');
    setApiKeyState('');
    setApiConnected(false);
    setStatus('idle');
  };

  const handleCountryChange = (e) => {
    const code = e.target.value;
    setSelectedCountry(code);
    setCountry(code);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50 font-sans">설정</h1>
        <p className="text-zinc-400 text-sm mt-1">유튜브 API 연동 및 웹앱 환경 설정을 관리합니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: API Setup Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Key className="text-blue-500" size={20} />
                YouTube Data API v3 연동
              </h3>
              <p className="text-zinc-500 text-xs mt-0.5">본인의 YouTube API Key를 연동하여 실시간 라이브 데이터를 불러옵니다.</p>
            </div>

            {/* Connection Status Badge */}
            <div className={`p-4 rounded-lg flex items-center gap-3 border
              ${apiConnected 
                ? 'bg-emerald-950/15 border-emerald-900/30 text-emerald-400' 
                : 'bg-zinc-900 border-zinc-850 text-zinc-400'
              }
            `}>
              {apiConnected ? (
                <>
                  <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
                  <div className="text-sm font-sans">
                    <span className="font-bold">API 연결 활성화됨</span>
                    <p className="text-[11px] text-emerald-500/80 mt-0.5">실시간 유튜브 라이브 채널 데이터를 가져오는 중입니다.</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle size={20} className="text-zinc-500 flex-shrink-0" />
                  <div className="text-sm font-sans">
                    <span className="font-bold">시뮬레이션 모드 활성화됨 (데모)</span>
                    <p className="text-[11px] text-zinc-500/80 mt-0.5">API 키가 제공되지 않아 시뮬레이션 데이터를 임시로 노출 중입니다.</p>
                  </div>
                </>
              )}
            </div>

            {/* Save/Edit Form */}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 block">YouTube API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => setApiKeyState(e.target.value)}
                    disabled={apiConnected && apiKey === getApiKey()}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Status Alert Messages */}
              {status === 'success' && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <CheckCircle size={14} /> API 키 검증 및 저장이 완료되었습니다!
                </div>
              )}

              {status === 'error' && (
                <div className="bg-rose-500/5 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <XCircle size={14} /> {errorMessage}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 justify-end">
                {apiConnected && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-400 rounded-lg px-4 py-2 font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Trash2 size={14} /> 키 연동 해제
                  </button>
                )}
                {(!apiConnected || apiKey !== getApiKey()) && (
                  <button
                    type="submit"
                    disabled={verifying || !apiKey.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold text-xs transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {verifying ? '검증 중...' : '검증 및 저장'}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Global Country Settings Card */}
          <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Globe className="text-blue-500" size={20} />
                글로벌 국가 설정 (Region Setting)
              </h3>
              <p className="text-zinc-500 text-xs mt-0.5">대시보드 전반에 표시되는 급상승 영상 및 교육 영상 데이터의 기본 필터 국가를 지정합니다.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 block">대상 국가 선택</label>
              <select
                value={selectedCountry}
                onChange={handleCountryChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-200 cursor-pointer"
              >
                {YOUTUBE_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Guide Guide Card */}
        <div className="lg:col-span-1">
          <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <HelpCircle className="text-zinc-500" size={16} />
              API 키 발급 가이드
            </h3>
            
            <div className="space-y-3 text-xs text-zinc-400 font-sans leading-relaxed">
              <p>유튜브 실시간 분석 데이터를 연동하기 위해 Google Cloud API Key를 생성해야 합니다.</p>
              <ol className="list-decimal pl-4 space-y-2 font-mono">
                <li>
                  <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                    Google Cloud 콘솔
                  </a>
                  에 로그인합니다.
                </li>
                <li>새로운 프로젝트를 생성합니다.</li>
                <li><strong>"API 및 서비스" &gt; "라이브러리"</strong>로 이동하여 <strong>"YouTube Data API v3"</strong>를 검색하고 활성화합니다.</li>
                <li><strong>"API 및 서비스" &gt; "사용자 인증 정보"</strong> 탭에서 <strong>"+ 사용자 인증 정보 만들기" &gt; "API 키"</strong>를 클릭합니다.</li>
                <li>발급된 API 키를 복사하여 연동합니다.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
