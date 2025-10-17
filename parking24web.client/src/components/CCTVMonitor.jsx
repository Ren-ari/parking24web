import { useState, useEffect, useRef, memo, useCallback } from 'react';
import Hls from 'hls.js';
import siteConfig from '../../config/sokcho1Config';
import { useTheme } from '../contexts/ThemeContext';

// 위치 이름 매핑 (채널 번호 기준)
const getLocationName = (channelNumber) => {
    const locations = {
        1: 'ch1',
        2: 'ch2',
        3: 'ch3',
        4: 'ch4',
        5: 'ch5'
    };
    return locations[channelNumber] || '';
};

// 썸네일 카드 컴포넌트
const ThumbnailCard = memo(({ channel, isActive, onClick, theme }) => (
    <div
        className={`cursor-pointer border-2 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-lg ${
            isActive 
                ? 'border-orange-500' 
                : theme === 'space' 
                    ? 'border-purple-500/30 bg-gradient-to-br from-gray-800/80 to-gray-900/80' 
                    : 'border-gray-300 bg-white'
        }`}
        onClick={onClick}
        style={{
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            ...(isActive && {
                boxShadow: '0 0 15px rgba(255, 165, 0, 0.9), 0 0 30px rgba(255, 140, 0, 0.6), 0 0 45px rgba(255, 140, 0, 0.4)',
            }),
        }}
    >
        <img
            src={`/thumbnails/ch${channel.number}.jpg`}
            alt={channel.name}
            className="w-full h-24 object-cover"
            loading="lazy"
            onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/svg%3E';
            }}
        />
        <div className={`p-2 text-center text-sm font-bold ${
            theme === 'space' 
                ? 'bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 text-purple-200' 
                : 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white'
        }`}
        style={{
            textShadow: theme === 'space' 
                ? '0 0 10px rgba(196, 181, 253, 0.5), 0 0 20px rgba(147, 51, 234, 0.3)' 
                : '0 1px 2px rgba(0, 0, 0, 0.2)'
        }}>
            {channel.number}번 - {getLocationName(channel.number)}
        </div>
    </div>
));

const CCTVMonitor = () => {
    const { theme } = useTheme();
    const [isConnected, setIsConnected] = useState(false);
    const [statusMessage, setStatusMessage] = useState('연결 대기 중');
    const [currentChannel, setCurrentChannel] = useState(33);
    const [isStreaming, setIsStreaming] = useState(false);
    const [showThumbnails, setShowThumbnails] = useState(true);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);

    // 연결 정보 (설정 파일에서 가져오기)
    const connectionInfo = siteConfig.cctvConfig?.defaultConnection || {
        ipAddress: '',
        port: 8080,
        rtspPort: 5000,
        username: 'admin',
        password: ''
    };

    const videoRef = useRef(null);
    const hlsRef = useRef(null);

    // API 기본 URL
    const apiBaseUrl = '';

    // 윈도우 리사이즈 감지
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 썸네일 패널 위치 조정을 위한 useEffect
    useEffect(() => {
        const updatePanelPosition = () => {
            const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
            
            const leftPanel = document.querySelector('.cctv-thumbnail-panel-left');
            const rightPanel = document.querySelector('.cctv-thumbnail-panel-right');
            
            if (leftPanel && rightPanel) {
                // 화면 크기에 따라 스크롤 감도와 기본 위치 조정
                const width = window.innerWidth;
                let scrollSensitivity = 1.0;
                let basePosition = 35; // PC 기본
                
                if (width >= 768 && width < 1200) {
                    // 작은 태블릿
                    scrollSensitivity = 0.5;
                    basePosition = 45;
                } else if (width >= 1200 && width <= 1400) {
                    // 큰 태블릿
                    scrollSensitivity = 0.5;
                    basePosition = 35;
                }
                
                const scrollOffset = scrollY * scrollSensitivity;
                
                leftPanel.style.top = `calc(${basePosition}% + ${scrollOffset}px)`;
                rightPanel.style.top = `calc(${basePosition}% + ${scrollOffset}px)`;
            }
        };

        // 즉시 실행
        updatePanelPosition();
        
        // 스크롤 이벤트 리스너
        const handleScroll = () => {
            updatePanelPosition();
        };

        // 다양한 이벤트에 등록
        window.addEventListener('scroll', handleScroll, { passive: true });
        document.addEventListener('scroll', handleScroll, { passive: true });
        document.body.addEventListener('scroll', handleScroll, { passive: true });
        
        // 마우스 휠 이벤트도 추가
        window.addEventListener('wheel', handleScroll, { passive: true });
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('scroll', handleScroll);
            document.body.removeEventListener('scroll', handleScroll);
            window.removeEventListener('wheel', handleScroll);
        };
    }, [showThumbnails]);

    // 상태 체크
    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 3000);
        
        return () => clearInterval(interval);
    }, []);

    // 언마운트 시 정리
    useEffect(() => {
        return () => {
            // HLS 정리
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
            // 연결 해제는 서버에 요청 (비동기 처리는 하지 않음)
            if (isStreaming) {
                fetch(`${apiBaseUrl}/api/cctv/hls/stop/${currentChannel}`, {
                    method: 'POST'
                }).catch(err => console.error('정리 중 오류:', err));
            }
        };
    }, [isStreaming, currentChannel]);

    const checkStatus = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/cctv/status`);
            const data = await response.json();
            setIsConnected(data.isConnected);
            setStatusMessage(data.statusMessage);
            setCurrentChannel(data.currentChannel);
        } catch (error) {
            console.error('상태 체크 실패:', error);
        }
    };

    const handleConnect = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/cctv/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(connectionInfo)
            });

            const result = await response.json();
            if (result.success) {
                setStatusMessage('연결 성공');
                await checkStatus();
            } else {
                setStatusMessage(`연결 실패: ${result.message}`);
            }
        } catch (error) {
            setStatusMessage(`연결 오류: ${error.message}`);
        }
    };

    const handleDisconnect = async () => {
        try {
            // HLS 중지
            if (isStreaming) {
                await stopStream();
            }

            const response = await fetch(`${apiBaseUrl}/api/cctv/disconnect`, {
                method: 'POST'
            });

            const result = await response.json();
            if (result.success) {
                setStatusMessage('연결 해제됨');
                await checkStatus();
            }
        } catch (error) {
            setStatusMessage(`연결 해제 오류: ${error.message}`);
        }
    };

    const handleChannelChange = useCallback(async (channelNumber) => {
        if (!isConnected) {
            alert('먼저 CCTV에 연결하세요');
            return;
        }

        setCurrentChannel(channelNumber);

        // 기존 스트리밍 중지
        if (isStreaming) {
            await stopStream();
        }

        // 새 채널 시작
        await startStream(channelNumber);
    }, [isConnected, isStreaming]);

    const startStream = async (channel = currentChannel) => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/cctv/hls/start/${channel}?stream=sub`, {
                method: 'POST'
            });

            const result = await response.json();
            if (result.success) {
                setIsStreaming(true);
                // 1.5초 대기 후 재생 (세그먼트 생성 대기)
                setTimeout(() => {
                    playHLS(channel);
                }, 1500);
            } else {
                alert('스트리밍 시작 실패');
            }
        } catch (error) {
            console.error('스트리밍 시작 오류:', error);
        }
    };

    const stopStream = async () => {
        try {
            // HLS 정리
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }

            // 서버에 중지 요청
            await fetch(`${apiBaseUrl}/api/cctv/hls/stop/${currentChannel}`, {
                method: 'POST'
            });

            setIsStreaming(false);
        } catch (error) {
            console.error('스트리밍 중지 오류:', error);
        }
    };

    const playHLS = (channel) => {
        if (!videoRef.current) return;

        // 기존 HLS 정리
        if (hlsRef.current) {
            hlsRef.current.destroy();
        }

        const videoUrl = `${apiBaseUrl}/api/cctv/hls/playlist/${channel}`;

        if (Hls.isSupported()) {
            const hls = new Hls({
                maxBufferLength: 3,
                maxMaxBufferLength: 5,
                liveSyncDuration: 1,
                liveMaxLatencyDuration: 3,
                highBufferWatchdogPeriod: 2
            });

            hls.loadSource(videoUrl);
            hls.attachMedia(videoRef.current);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoRef.current.play().catch(err => {
                    console.log('자동 재생 실패 (사용자 인터랙션 필요):', err);
                });
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS 오류:', data);
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log('네트워크 오류, 재시도 중...');
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log('미디어 오류, 복구 시도 중...');
                            hls.recoverMediaError();
                            break;
                        default:
                            console.log('복구 불가능한 오류');
                            hls.destroy();
                            break;
                    }
                }
            });

            hlsRef.current = hls;
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
            videoRef.current.src = videoUrl;
            videoRef.current.play();
        }
    };

    // 채널 목록 (설정 파일에서 가져오기)
    const channels = siteConfig.cctvConfig?.channels || [];

    return (
        <>
            <style jsx>{`
                .cctv-thumbnail-panel-left {
                    position: fixed;
                    top: 35%;
                    left: -300px;
                    width: 300px;
                    height: 70vh;
                    transform: translateY(-50%);
                    background: ${theme === 'space' 
                        ? 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(15, 15, 15, 0.9) 100%)' 
                        : '#f8fafc'};
                    border: 1px solid ${theme === 'space' ? 'rgba(40, 40, 40, 0.3)' : '#e2e8f0'};
                    box-shadow: 5px 0 20px ${theme === 'space' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
                    transition: left 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55), top 0.3s ease-out;
                    z-index: 1000;
                    overflow-y: auto;
                    padding: 20px;
                    border-radius: 0 20px 20px 0;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    backdrop-filter: blur(25px);
                    -webkit-backdrop-filter: blur(25px);
                }

                .cctv-thumbnail-panel-left::-webkit-scrollbar {
                    display: none;
                }

                .cctv-thumbnail-panel-left.show {
                    left: 0;
                    animation: slideInLeft 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }

                .cctv-thumbnail-panel-right {
                    position: fixed;
                    top: 35%;
                    right: -300px;
                    width: 300px;
                    height: 70vh;
                    transform: translateY(-50%);
                    background: ${theme === 'space' 
                        ? 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(15, 15, 15, 0.9) 100%)' 
                        : '#f8fafc'};
                    border: 1px solid ${theme === 'space' ? 'rgba(40, 40, 40, 0.3)' : '#e2e8f0'};
                    box-shadow: -5px 0 20px ${theme === 'space' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
                    transition: right 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55), top 0.3s ease-out;
                    z-index: 1000;
                    overflow-y: auto;
                    padding: 20px;
                    border-radius: 20px 0 0 20px;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    backdrop-filter: blur(25px);
                    -webkit-backdrop-filter: blur(25px);
                }

                .cctv-thumbnail-panel-right::-webkit-scrollbar {
                    display: none;
                }

                .cctv-thumbnail-panel-right.show {
                    right: 0;
                    animation: slideInRight 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }

                @keyframes slideInLeft {
                    0% {
                        left: -300px;
                        opacity: 0;
                        transform: translateY(-50%) scale(0.9) rotateY(-15deg);
                    }
                    50% {
                        left: -50px;
                        opacity: 0.7;
                        transform: translateY(-50%) scale(1.02) rotateY(-5deg);
                    }
                    100% {
                        left: 0;
                        opacity: 1;
                        transform: translateY(-50%) scale(1) rotateY(0deg);
                    }
                }

                @keyframes slideInRight {
                    0% {
                        right: -300px;
                        opacity: 0;
                        transform: translateY(-50%) scale(0.9) rotateY(15deg);
                    }
                    50% {
                        right: -50px;
                        opacity: 0.7;
                        transform: translateY(-50%) scale(1.02) rotateY(5deg);
                    }
                    100% {
                        right: 0;
                        opacity: 1;
                        transform: translateY(-50%) scale(1) rotateY(0deg);
                    }
                }

                @media (max-width: 767px) {
                    .cctv-thumbnail-panel-left,
                    .cctv-thumbnail-panel-right {
                        display: none;
                    }
                }
            `}</style>

            <div className="p-4 space-y-4">
                {/* 헤더 */}
                <div className={`rounded-lg shadow-lg p-4 ${
                    theme === 'space' 
                        ? 'bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900' 
                        : 'bg-gradient-to-r from-blue-600 to-blue-700'
                }`}
                style={{
                    backdropFilter: 'blur(25px)',
                    WebkitBackdropFilter: 'blur(25px)',
                }}>
                    <div className="mt-2 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-white text-sm font-medium">CCTV</span>
                            </div>
                            <span className="text-white text-sm">{statusMessage.replace('하이크비전 연결 성공', '').trim()}</span>
                        </div>
                        <div>
                            {!isConnected && (
                                <button
                                    onClick={handleConnect}
                                    className={`px-4 py-1 rounded-full text-sm font-semibold transition ${
                                        theme === 'space'
                                            ? 'bg-purple-200 text-purple-900 hover:bg-purple-300'
                                            : 'bg-white text-blue-600 hover:bg-blue-50'
                                    }`}
                                >
                                    연결하기
                                </button>
                            )}
                            {isConnected && (
                                <button
                                    onClick={handleDisconnect}
                                    className="px-4 py-1 rounded-full text-gray-800 font-bold hover:scale-105 transition"
                                    style={theme === 'space' 
                                        ? { 
                                            background: 'linear-gradient(145deg, #e5e7eb 0%, #9ca3af 100%)', 
                                            border: '1px solid rgba(156, 163, 175, 0.8)', 
                                            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.7), 0 6px 16px rgba(0,0,0,0.25)', 
                                            fontSize: '0.75rem' 
                                        } 
                                        : { 
                                            background: 'rgba(255, 255, 255, 0.9)', 
                                            border: '1px solid rgba(255, 255, 255, 0.3)', 
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', 
                                            fontSize: '0.75rem' 
                                        }
                                    }
                                >
                                    연결 해제
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 메인 컨텐츠 - 가운데 영상만 */}
                {isConnected && (
                    <>
                        <div className="flex justify-center">
                            {/* 비디오 플레이어 */}
                            <div className="w-full bg-black rounded-lg shadow overflow-hidden" style={{ maxWidth: '95vw' }}>
                            <video
                                ref={videoRef}
                                controls
                                autoPlay
                                muted
                                className="w-full"
                                style={{ 
                                    maxHeight: windowWidth >= 1280 ? '85vh' : '30vh', 
                                    minHeight: windowWidth >= 1280 ? '70vh' : '30vh' 
                                }}
                            >
                                브라우저가 비디오를 지원하지 않습니다.
                            </video>
                            </div>
                        </div>
                        
                        {/* 모바일/태블릿용 썸네일 그리드 (영상 하단) */}
                        <div className="block xl:hidden mt-4">
                            <div className="grid grid-cols-4 gap-3 max-w-4xl mx-auto">
                                {channels.map(ch => (
                                    <ThumbnailCard
                                        key={ch.number}
                                        channel={ch}
                                        isActive={currentChannel === ch.number}
                                        onClick={() => handleChannelChange(ch.number)}
                                        theme={theme}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* 좌측 썸네일 패널 (1,2,3,4) - PC만 */}
            {isConnected && showThumbnails && (
                <div className={`cctv-thumbnail-panel-left show hidden xl:block`}>
                    <div className="flex flex-col gap-7">
                        {channels.slice(0, 4).map(ch => (
                            <ThumbnailCard
                                key={ch.number}
                                channel={ch}
                                isActive={currentChannel === ch.number}
                                onClick={() => handleChannelChange(ch.number)}
                                theme={theme}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* 우측 썸네일 패널 (5,6,7,8) - PC만 */}
            {isConnected && showThumbnails && (
                <div className={`cctv-thumbnail-panel-right show hidden xl:block`}>
                    <div className="flex flex-col gap-7">
                        {channels.slice(4, 8).map(ch => (
                            <ThumbnailCard
                                key={ch.number}
                                channel={ch}
                                isActive={currentChannel === ch.number}
                                onClick={() => handleChannelChange(ch.number)}
                                theme={theme}
                            />
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

export default CCTVMonitor;