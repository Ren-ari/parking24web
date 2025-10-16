import { useState, useEffect, useRef, memo, useCallback } from 'react';
import Hls from 'hls.js';
import siteConfig from '../../config/sokcho1Config';

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
const ThumbnailCard = memo(({ channel, isActive, onClick }) => (
    <div
        className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg ${isActive ? 'border-green-500 shadow-lg shadow-green-500/50' : 'border-transparent'
            }`}
        onClick={onClick}
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
        <div className="bg-white p-2 text-center text-sm font-medium">
            {channel.number}번 - {getLocationName(channel.number)}
        </div>
    </div>
));

const CCTVMonitor = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [statusMessage, setStatusMessage] = useState('연결 대기 중');
    const [currentChannel, setCurrentChannel] = useState(33);
    const [isStreaming, setIsStreaming] = useState(false);

    // 연결 정보 (설정 파일에서 가져오기)
    const [connectionInfo, setConnectionInfo] = useState(
        siteConfig.cctvConfig?.defaultConnection || {
            ipAddress: '',
            port: 8080,
            rtspPort: 8888,
            username: 'admin',
            password: ''
        }
    );

    const videoRef = useRef(null);
    const hlsRef = useRef(null);

    // API 기본 URL
    const apiBaseUrl = '';

    // 연결 상태 체크
    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    // HLS 정리 + FFmpeg 프로세스 정리
    useEffect(() => {
        return () => {
            // 컴포넌트 언마운트시 (탭 이동, 브라우저 닫기 등)
            if (isStreaming) {
                stopStream(); // 기존 stopStream 함수 재활용
            }
        };
    }, [isStreaming]);

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
        <div className="p-4 space-y-4">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow-lg p-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    📹 CCTV 모니터링
                </h2>
                <div className="mt-2 flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${isConnected ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                        }`}>
                        {isConnected ? '● 연결됨' : '○ 연결 안됨'}
                    </span>
                    <span className="text-white text-sm">{statusMessage}</span>
                </div>
            </div>

            {/* 썸네일 그리드 */}
            {isConnected && (
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-5 gap-3">
                        {channels.map(ch => (
                            <ThumbnailCard
                                key={ch.number}
                                channel={ch}
                                isActive={currentChannel === ch.number}
                                onClick={() => handleChannelChange(ch.number)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* 연결 설정 - 접을 수 있게 */}
            <details className="bg-white rounded-lg shadow">
                <summary className="cursor-pointer font-semibold p-4 hover:bg-gray-50 rounded-lg">
                    ⚙️ 연결 설정
                </summary>
                <div className="p-4 pt-0">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">IP 주소</label>
                            <input
                                type="text"
                                value={connectionInfo.ipAddress}
                                onChange={(e) => setConnectionInfo({ ...connectionInfo, ipAddress: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                                disabled={isConnected}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">HTTP 포트</label>
                            <input
                                type="number"
                                value={connectionInfo.port}
                                onChange={(e) => setConnectionInfo({ ...connectionInfo, port: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border rounded"
                                disabled={isConnected}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">RTSP 포트</label>
                            <input
                                type="number"
                                value={connectionInfo.rtspPort}
                                onChange={(e) => setConnectionInfo({ ...connectionInfo, rtspPort: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border rounded"
                                disabled={isConnected}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">사용자명</label>
                            <input
                                type="text"
                                value={connectionInfo.username}
                                onChange={(e) => setConnectionInfo({ ...connectionInfo, username: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                                disabled={isConnected}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">비밀번호</label>
                            <input
                                type="password"
                                value={connectionInfo.password}
                                onChange={(e) => setConnectionInfo({ ...connectionInfo, password: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                                disabled={isConnected}
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        {!isConnected ? (
                            <button
                                onClick={handleConnect}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                연결
                            </button>
                        ) : (
                            <button
                                onClick={handleDisconnect}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                연결 해제
                            </button>
                        )}
                    </div>
                </div>
            </details>

            {/* 비디오 플레이어 */}
            {isConnected && (
                <div className="bg-black rounded-lg shadow overflow-hidden">
                    <video
                        ref={videoRef}
                        controls
                        autoPlay
                        muted
                        className="w-full"
                        style={{ maxHeight: '600px' }}
                    >
                        브라우저가 비디오를 지원하지 않습니다.
                    </video>
                    <div className="bg-gray-800 text-white p-2 text-sm">
                        현재 채널: {currentChannel}번 - {getLocationName(currentChannel)} |
                        {isStreaming ? ' 🔴 스트리밍 중' : ' ⚪ 대기 중'}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CCTVMonitor;