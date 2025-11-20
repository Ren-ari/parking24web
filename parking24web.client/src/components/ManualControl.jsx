import React, { useState, useEffect, useMemo, useCallback } from 'react';
import siteConfig from '../../config/sokcho2Config.js';
// SignalR 서비스 import
import signalRService from '../services/signalrService.js';
import { useTheme } from '../contexts/ThemeContext';
import './ManualControl.css';

// ============================================
// HoldButton 컴포넌트 (버튼 중복 제거)
// ============================================
const HoldButton = ({ commandName, label, onPress, disabled, busy, theme, className = '' }) => {
    const handleRelease = useCallback(() => {
        onPress(commandName, 0);
    }, [commandName, onPress]);

    const handlePress = useCallback(() => {
        onPress(commandName, 1);
    }, [commandName, onPress]);

    return (
        <button
            onMouseDown={handlePress}
            onMouseUp={handleRelease}
            onMouseLeave={handleRelease}
            onTouchStart={handlePress}
            onTouchEnd={handleRelease}
            disabled={disabled || busy}
            className={`learn-more ${className} ${theme === 'space' ? 'space-theme' : ''} ${(disabled || busy) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {label} {busy && '⏳'}
        </button>
    );
};

// ============================================
// ValueCard 컴포넌트 (엔코더/카운터 카드)
// ============================================
const ValueCard = ({ label, value, theme, cardBgStyle, cardValueBgStyle, labelColorClass, valueColorClass }) => (
    <div className="p-2 sm:p-3 rounded-2xl transition-all duration-700 ease-out transform relative overflow-hidden"
        style={{
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            ...cardBgStyle
        }}>
        <div className={`absolute inset-0 rounded-2xl ${
            theme === 'space' 
                ? 'bg-gradient-to-br from-purple-500/8 to-purple-600/8' 
                : 'bg-gradient-to-br from-blue-500/8 to-indigo-500/8'
        }`}></div>
        <label className={`block text-xs font-medium mb-1 relative z-10 text-center ${labelColorClass}`}>{label}</label>
        <div className={`rounded-2xl px-2 sm:px-3 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10 text-center ${valueColorClass}`} 
            style={cardValueBgStyle}>
            {value || 0}
        </div>
    </div>
);

// ============================================
// useMediaQuery 훅
// ============================================
const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        setMatches(media.matches);
        
        const listener = (e) => setMatches(e.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [query]);

    return matches;
};

const ManualControl = ({ isPLCConnected, isAuthenticated, sensorData, isMobileMenuOpen }) => {

    const [_isEmergencyMode, setIsEmergencyMode] = useState(false);
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState('page1');
    const [showSensors, setShowSensors] = useState(true);
    const [sensorStates, setSensorStates] = useState({});
    const [_scrollY, setScrollY] = useState(0);
    const isMobile = useMediaQuery('(max-width: 768px)');


    // 리소스별 마지막 명령 상태 (commandId, sequence 포함)
    const [lastCommands, setLastCommands] = useState({});

    // 리소스별 전송 중 상태
    const [pendingResources, setPendingResources] = useState(new Set());

    // 통계 (디버그용)
    const [commandStats, setCommandStats] = useState({
        success: 0,
        failed: 0,
        timeout: 0
    });

    // 명령별 중복 제거 윈도우 (ms)
    const DEDUP_WINDOW = {
        liftUp: 200,
        liftDown: 200,
        moveLeft: 150,
        moveRight: 150,
        turnLeft: 300,
        turnRight: 300,
        doorOpen: 100,
        doorClose: 100,
        lockingOn: 100,
        lockingOff: 100,
        errorReset: 0,
        remoteControl: 0,
        homeReturn: 0
    };

    const currentConfig = siteConfig;

    // ============================================
    // 🔥 핵심 로직: 버전 비교 (commandId + sequence)
    // ============================================
    const isNewer = (response, resourceKey) => {
        const prev = lastCommands[resourceKey];
        if (!prev) return true;

        // 시퀀스 비교
        if (response.sequence > prev.sequence) return true;
        if (response.sequence < prev.sequence) return false;

        // 시퀀스 같으면 commandId 비교 (중복 응답 허용)
        return response.commandId === prev.commandId;
    };

    // ============================================
    // 🔥 핵심 로직: 명령 전송 (중복 제거 + 안전성 강화)
    // ============================================
    const sendCommand = async (commandName, value) => {
        const resourceKey = signalRService.getResourceKey(commandName);
        const lastCmd = lastCommands[resourceKey];

        // ============================================
        // 1. 해제(0) 명령은 즉시 실행 (pending 무시)
        // ============================================
        if (value === 0) {
            console.log(`[즉시 실행] ${commandName}=0 (해제 명령)`);

            try {
                const commandId = signalRService.generateCommandId();

                const result = await signalRService.sendConfigCommand(
                    commandName,
                    0,
                    { commandId, resourceKey, immediate: true }
                );

                // 성공 시 상태 업데이트 (sequence 관계없이 0은 항상 반영)
                if (result.success) {
                    setLastCommands(prev => ({
                        ...prev,
                        [resourceKey]: {
                            name: commandName,
                            value: 0,
                            timestamp: result.timestamp,
                            commandId: result.commandId,
                            sequence: result.sequence
                        }
                    }));
                    setCommandStats(prev => ({ ...prev, success: prev.success + 1 }));
                }

            } catch (error) {
                console.error(`[즉시 실행 실패] ${commandName}=0:`, error);
                setCommandStats(prev => ({ ...prev, failed: prev.failed + 1 }));
            }

            return; // 여기서 종료
        }

        // ============================================
        // 2. 중복 체크 (명령별 윈도우)
        // ============================================
        const dedupWindow = DEDUP_WINDOW[commandName] || 100;
        if (lastCmd?.name === commandName &&
            lastCmd?.value === value &&
            Date.now() - lastCmd.timestamp < dedupWindow) {
            console.log(`[중복 무시] ${commandName}=${value} (${dedupWindow}ms 윈도우)`);
            return;
        }

        // ============================================
        // 3. 리소스 사용 중 체크 (락)
        // ============================================
        if (pendingResources.has(resourceKey)) {
            console.warn(`[락] 리소스 사용 중: ${resourceKey}`);
            return;
        }

        // 락 획득
        setPendingResources(prev => new Set(prev).add(resourceKey));

        const commandId = signalRService.generateCommandId();
        console.log(`[시작] ${commandName}=${value} [${commandId}]`);

        try {
            // ============================================
            // 4. 타임아웃 설정 (3초)
            // ============================================
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), 3000)
            );

            // ============================================
            // 5. Promise.race (타임아웃 vs 실제 요청)
            // ============================================
            const result = await Promise.race([
                signalRService.sendConfigCommand(
                    commandName,
                    value,
                    { commandId, resourceKey }
                ),
                timeoutPromise
            ]);

            // ============================================
            // 6. 성공 응답 처리 (버전 체크)
            // ============================================
            if (!result.success) {
                throw new Error(result.message || '명령 실패');
            }

            // 버전(sequence + commandId) 비교
            if (isNewer(result, resourceKey)) {
                setLastCommands(prev => ({
                    ...prev,
                    [resourceKey]: {
                        name: commandName,
                        value: value,
                        timestamp: result.timestamp,
                        commandId: result.commandId,
                        sequence: result.sequence
                    }
                }));
                console.log(`[성공] ${commandName}=${value} [seq:${result.sequence}]`);
                setCommandStats(prev => ({ ...prev, success: prev.success + 1 }));
            } else {
                console.warn(`[구버전] 늦은 응답 무시: ${commandName} [seq:${result.sequence}]`);
            }

        } catch (error) {
            // ============================================
            // 7. 에러 처리
            // ============================================
            if (error.message === 'TIMEOUT') {
                console.error(`[타임아웃] ${commandName}=${value}`);
                setCommandStats(prev => ({ ...prev, timeout: prev.timeout + 1 }));
            } else {
                console.error(`[실패] ${commandName}=${value}:`, error);
                setCommandStats(prev => ({ ...prev, failed: prev.failed + 1 }));
            }

        } finally {
            // ============================================
            // 8. 락 해제 (무조건 실행)
            // ============================================
            setPendingResources(prev => {
                const next = new Set(prev);
                next.delete(resourceKey);
                return next;
            });
            console.log(`[종료] ${commandName} 락 해제`);
        }
    };

    // ============================================
    // 리소스 사용 중 여부 체크
    // ============================================
    const isResourceBusy = (commandName) => {
        const resourceKey = signalRService.getResourceKey(commandName);
        return pendingResources.has(resourceKey);
    };

    // 센서 패널 위치 조정을 위한 useEffect
    useEffect(() => {
        const updatePanelPosition = () => {
            const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
            setScrollY(scrollY);

            console.log('현재 스크롤 위치:', scrollY);

            // 센서 패널들의 위치를 스크롤에 따라 조정
            const leftPanel = document.querySelector('.sensor-panel-left');
            const rightPanel = document.querySelector('.sensor-panel-right');

            if (leftPanel && rightPanel) {
                // 화면 크기에 따라 스크롤 감도와 기본 위치 조정
                const width = window.innerWidth;
                let scrollSensitivity = 1.0;
                let basePosition = 35; // PC 기본

                if (width >= 768 && width < 1200) {
                    // 작은 태블릿
                    scrollSensitivity = 0.5;
                    basePosition = 50;
                } else if (width >= 1200 && width <= 1400) {
                    // 큰 태블릿
                    scrollSensitivity = 0.5;
                    basePosition = 40;
                }

                const scrollOffset = scrollY * scrollSensitivity;

                leftPanel.style.top = `calc(${basePosition}% + ${scrollOffset}px)`;
                rightPanel.style.top = `calc(${basePosition}% + ${scrollOffset}px)`;

                console.log('패널 위치 조정 완료:', scrollOffset, '감도:', scrollSensitivity, '기본위치:', basePosition);
            } else {
                console.log('패널을 찾을 수 없음');
            }
        };

        // 즉시 실행
        updatePanelPosition();

        // 스크롤 이벤트 리스너
        const handleScroll = () => {
            console.log('스크롤 이벤트 감지됨!');
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
    }, [showSensors]);

    // 태블릿 모드에서 햄버거 메뉴가 열리면 센서 패널 숨기기
    useEffect(() => {
        if (isMobileMenuOpen !== undefined) {
            setShowSensors(!isMobileMenuOpen);
        }
    }, [isMobileMenuOpen]);

    // 센서 상태 업데이트 (config 기반)
    const updateSensorStates = () => {
        if (!sensorData || !sensorData.rawData) return;

        const newStates = {};

        // currentConfig의 센서 매핑을 기반으로 센서 상태 업데이트
        Object.entries(currentConfig.sensorMapping).forEach(([, configData]) => {
            const { address, sensors } = configData;

            if (address < sensorData.rawData.length) {
                const wordValue = sensorData.rawData[address];

                // 각 비트별 센서 상태 확인
                Object.entries(sensors).forEach(([bitIndex, sensorInfo]) => {
                    const bitValue = (wordValue >> parseInt(bitIndex)) & 1;
                    const sensorKey = sensorInfo.name.replace(/[^a-zA-Z0-9]/g, '_'); // 안전한 키로 변환

                    newStates[sensorKey] = {
                        value: bitValue === 1,
                        address: `C${address}`,
                        bitIndex: parseInt(bitIndex),
                        wordIndex: address,
                        name: sensorInfo.name,
                        description: sensorInfo.description,
                        category: sensorInfo.category
                    };
                });
            }
        });

        setSensorStates(newStates);
    };

    // 센서 상태를 확인하는 헬퍼 함수
    const getSensorValue = (sensorKey) => {
        const transformedKey = sensorKey.replace(/[^a-zA-Z0-9]/g, '_');
        const sensor = sensorStates[transformedKey];
        return sensor ? sensor.value : false;
    };

    // 센서 코드와 비트 정보를 표시하는 헬퍼 함수
    const getSensorCode = (sensorKey) => {
        const transformedKey = sensorKey.replace(/[^a-zA-Z0-9]/g, '_');
        const sensor = sensorStates[transformedKey];
        if (sensor) {
            return `C${sensor.wordIndex}.${sensor.bitIndex}`;
        }
        return 'C--.--';
    };

    // config에서 센서 키 추출하는 헬퍼 함수
    const getSensorKeysFromConfig = (pageKey, sensorType = 'input') => {
        const pageConfig = currentConfig.manualControlSensors[pageKey];
        if (!pageConfig) return [];

        const sensorKeys = [];

        // input 센서와 output 센서를 구분해서 처리
        Object.entries(pageConfig).forEach(([key, value]) => {
            // output 센서들 (MC, BK, INV 등이 포함된 키들)
            const outputSensorPatterns = ['MC', 'BK', 'INV', '유도등', '부저', '입고중', '대기중', '출고중', 'FAN', '외장턴'];
            const isOutputSensor = outputSensorPatterns.some(pattern => key.includes(pattern) || value.includes(pattern));

            if (sensorType === 'input' && !isOutputSensor) {
                sensorKeys.push(value);
            } else if (sensorType === 'output' && isOutputSensor) {
                sensorKeys.push(value);
            }
        });

        return sensorKeys;
    };

    // 센서 아이템을 동적으로 렌더링하는 함수
    const renderSensorItem = (sensorKey) => {
        const transformedKey = sensorKey.replace(/[^a-zA-Z0-9]/g, '_');
        const _sensor = sensorStates[transformedKey];
        const isActive = getSensorValue(sensorKey);
        const sensorCode = getSensorCode(sensorKey);

        // 센서 이름을 표시용으로 정리 (P*** 부분 제거)
        const displayName = sensorKey.replace(/^P\d+_/, '');

        return (
            <div
                key={sensorKey}
                className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${isActive ? 'active' : 'inactive'}`}
            >
                <div className="sensor-code">{sensorCode}</div>
                <div className="sensor-name">{displayName}</div>
            </div>
        );
    };

    // 센서 패널을 동적으로 렌더링하는 함수
    const renderLeftSensorPanel = () => {
        const inputSensors = getSensorKeysFromConfig(activeTab, 'input');
        return (
            <div>
                {inputSensors.map(sensorKey => renderSensorItem(sensorKey))}
            </div>
        );
    };

    const renderRightSensorPanel = () => {
        const outputSensors = getSensorKeysFromConfig(activeTab, 'output');
        return (
            <div>
                {outputSensors.map(sensorKey => renderSensorItem(sensorKey))}
            </div>
        );
    };

    // sensorData가 변경될 때마다 센서 상태 업데이트
    useEffect(() => {
        updateSensorStates();
    }, [sensorData, currentConfig]);


    // 비상정지 핸들러 (특별 처리)
    const handleEmergencyStop = async () => {
        try {
            setIsEmergencyMode(true);
            // await signalRService.emergencyStop();
            console.log('비상정지 실행');
            setTimeout(() => setIsEmergencyMode(false), 5000);
        } catch (error) {
            console.error('비상정지 실행 실패:', error);
            setIsEmergencyMode(false);
        }
    };

    const isDisabled = !isPLCConnected || !isAuthenticated;

    // ============================================
    // 스타일 메모이제이션 (성능 최적화)
    // ============================================
    const cardBgStyle = useMemo(() => {
        return theme === 'space' ? {
            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)',
            border: '1px solid rgba(147, 51, 234, 0.2)',
            boxShadow: '0 4px 16px 0 rgba(147, 51, 234, 0.1)'
        } : {
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.15)'
        };
    }, [theme]);

    const cardValueBgStyle = useMemo(() => ({
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 2px 8px 0 rgba(31, 38, 135, 0.15)'
    }), []);

    const labelColorClass = theme === 'space' ? 'text-white' : 'text-blue-700';
    const valueColorClass = theme === 'space' ? 'text-purple-800' : 'text-purple-900';
    const mainBorderClass = `border-2 ${theme === 'space' ? 'border-purple-500/30' : 'border-white/20'}`;

    const mainBgStyle = useMemo(() => ({
        background: theme === 'space' ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(25px)',
        WebkitBackdropFilter: 'blur(25px)',
    }), [theme]);

    return (
        <>
            {/* ============================================ */}
            {/* 디버그용 통계 표시 (개발 환경에서만) */}
            {/* ============================================ */}
            {process.env.NODE_ENV === 'development' && (
                <div style={{
                    position: 'fixed',
                    top: 10,
                    right: 10,
                    background: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '10px',
                    fontSize: '12px',
                    borderRadius: '5px',
                    zIndex: 9999
                }}>
                    <div>✅ 성공: {commandStats.success}</div>
                    <div>❌ 실패: {commandStats.failed}</div>
                    <div>⏱️ 타임아웃: {commandStats.timeout}</div>
                    <div>🔒 사용중: {Array.from(pendingResources).join(', ')}</div>
                </div>
            )}



            <div className={`rounded-2xl shadow-lg p-3 md:p-4 overflow-hidden ${mainBorderClass}`} style={mainBgStyle}>
                {/* 제어 불가 알림 */}
                {isDisabled && (
                    <div className="flex justify-end mb-4">
                        <div className="bg-red-100 border border-red-300 px-3 py-2 rounded-2xl shadow-md">
                            <span className="text-red-700 font-semibold text-sm">🚫 제어 불가</span>
                        </div>
                    </div>
                )}

                {/* 엔코더값/카운터값 표시 */}
                <div className="mb-6 md:mb-8">
                    <div className="grid grid-cols-2 gap-4 max-w-md lg:max-w-2xl mx-auto">
                        <ValueCard 
                            label="엔코더값"
                            value={sensorData?.rawData?.[currentConfig.dataAddresses.encoderValue]}
                            theme={theme}
                            cardBgStyle={cardBgStyle}
                            cardValueBgStyle={cardValueBgStyle}
                            labelColorClass={labelColorClass}
                            valueColorClass={valueColorClass}
                        />
                        <ValueCard 
                            label="카운터값"
                            value={sensorData?.rawData?.[currentConfig.liftPositions.counter]}
                            theme={theme}
                            cardBgStyle={cardBgStyle}
                            cardValueBgStyle={cardValueBgStyle}
                            labelColorClass={labelColorClass}
                            valueColorClass={valueColorClass}
                        />
                    </div>
                </div>

                {/* 공용 버튼들 */}
                <div className="mb-12 md:mb-20">
                    <div className="flex flex-wrap gap-4 justify-center common-buttons-grid">
                        <HoldButton commandName="errorReset" label="에러 리셋" onPress={sendCommand} 
                            disabled={isDisabled} busy={isResourceBusy("errorReset")} theme={theme} className="common-button" />
                        <HoldButton commandName="remoteControl" label="원격 제어" onPress={sendCommand} 
                            disabled={isDisabled} busy={isResourceBusy("remoteControl")} theme={theme} className="common-button" />
                        <HoldButton commandName="homeReturn" label="홈 복귀" onPress={sendCommand} 
                            disabled={isDisabled} busy={isResourceBusy("homeReturn")} theme={theme} className="common-button" />
                        <HoldButton commandName="paletteChange" label="파레트 교체" onPress={sendCommand} 
                            disabled={isDisabled} busy={isResourceBusy("paletteChange")} theme={theme} className="common-button" />
                        <button
                            onMouseDown={handleEmergencyStop}
                            disabled={isDisabled}
                            className={`learn-more emergency-button ${theme === 'space' ? 'space-theme' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            비상정지
                        </button>
                    </div>
                </div>

                {/* 탭 컨텐츠 */}
                <div className="tab-content">
                    {/* 1페이지: 도어/턴테이블 */}
                    {activeTab === 'page1' && (
                        <div>
                            <div className="page1-layout" style={{ gridTemplateRows: '1fr 1fr 1fr' }}>
                                {/* 턴테이블 제어 */}
                                <div className="turn-table-section">
                                    <div className="door-vertical">
                                        <HoldButton commandName="turnLeft" label="좌회전" onPress={sendCommand} 
                                            disabled={isDisabled} busy={isResourceBusy("turnLeft")} theme={theme} />
                                        <HoldButton commandName="turnRight" label="우회전" onPress={sendCommand} 
                                            disabled={isDisabled} busy={isResourceBusy("turnRight")} theme={theme} />
                                    </div>
                                </div>

                                {/* 도어 제어 */}
                                <div className="door-section">
                                    <div className="door-vertical">
                                        <HoldButton commandName="doorOpen" label="도어 열림" onPress={sendCommand} 
                                            disabled={isDisabled} busy={isResourceBusy("doorOpen")} theme={theme} />
                                        <HoldButton commandName="doorClose" label="도어 닫힘" onPress={sendCommand} 
                                            disabled={isDisabled} busy={isResourceBusy("doorClose")} theme={theme} />
                                    </div>
                                </div>

                                {/* 락킹 제어 */}
                                <div className="door-section">
                                    <div className="door-vertical">
                                        <HoldButton commandName="lockingOn" label="락킹 잠김" onPress={sendCommand} 
                                            disabled={isDisabled} busy={isResourceBusy("lockingOn")} theme={theme} />
                                        <HoldButton commandName="lockingOff" label="락킹 해제" onPress={sendCommand} 
                                            disabled={isDisabled} busy={isResourceBusy("lockingOff")} theme={theme} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2페이지: 승강/횡행 제어 */}
                    {activeTab === 'page2' && (
                        <div className="space-y-6">
                            <div className="flex flex-col gap-6 md:gap-8 justify-center items-center">
                                <HoldButton commandName="liftUp" label="상승" onPress={sendCommand} 
                                    disabled={isDisabled} busy={isResourceBusy("liftUp")} theme={theme} />

                                <div className="flex gap-6 md:gap-8 justify-center items-center">
                                    <HoldButton commandName="moveLeft" label="좌행" onPress={sendCommand} 
                                        disabled={isDisabled} busy={isResourceBusy("moveLeft")} theme={theme} />
                                    <HoldButton commandName="moveRight" label="우행" onPress={sendCommand} 
                                        disabled={isDisabled} busy={isResourceBusy("moveRight")} theme={theme} />
                                </div>

                                <HoldButton commandName="liftDown" label="하강" onPress={sendCommand} 
                                    disabled={isDisabled} busy={isResourceBusy("liftDown")} theme={theme} />
                            </div>
                        </div>
                    )}

                    {/* 3페이지: 횡행/락킹 */}
                    {activeTab === 'page3' && (
                        <div className="flex justify-center items-center md:min-h-[200px]">
                            {/* 락킹 버튼은 도어/턴테이블 탭에 표시 */}
                        </div>
                    )}
                </div>

                {/* 탭 네비게이션 */}
                <div className="tab-navigation" style={{ marginTop: isMobile ? '40px' : '120px' }}>
                    <button
                        onClick={() => { setActiveTab('page1'); setShowSensors(true); }}
                        className={`tab-button ${theme === 'space' ? 'space-theme' : ''} ${activeTab === 'page1' ? 'active' : ''}`}
                    >
                        도어/턴테이블
                    </button>
                    <button
                        onClick={() => { setActiveTab('page2'); setShowSensors(true); }}
                        className={`tab-button ${theme === 'space' ? 'space-theme' : ''} ${activeTab === 'page2' ? 'active' : ''}`}
                    >
                        승강 제어
                    </button>
                    <button
                        onClick={() => { setActiveTab('page3'); setShowSensors(true); }}
                        className={`tab-button ${theme === 'space' ? 'space-theme' : ''} ${activeTab === 'page3' ? 'active' : ''}`}
                    >
                        횡행/락킹
                    </button>
                </div>
            </div>

            {/* 센서 패널 */}
            {showSensors && (
                <>
                    <div className={`sensor-panel-left show ${theme === 'space' ? 'space-theme' : ''}`}>
                        {renderLeftSensorPanel()}
                    </div>

                    <div className={`sensor-panel-right show ${theme === 'space' ? 'space-theme' : ''}`}>
                        {renderRightSensorPanel()}
                    </div>
                </>
            )}
        </>
    );
};

export default ManualControl;