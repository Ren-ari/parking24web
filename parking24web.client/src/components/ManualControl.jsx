import React, { useState, useEffect, useCallback } from 'react';
import siteConfig from '../../config/gapEulMyeongGaConfig';
// SignalR 서비스 import
import signalRService from '../services/signalrService';
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

const ManualControl = ({ isPLCConnected, isAuthenticated, sensorData, isMobileMenuOpen }) => {

    const [_activeCommand, setActiveCommand] = useState(null);
    const [_isEmergencyMode, setIsEmergencyMode] = useState(false);
    const { theme, isSpaceTheme, isDarkTheme, isOceanTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('page1');
    const [showSensors, setShowSensors] = useState(true);
    const [sensorStates, setSensorStates] = useState({});
    const [scrollY, setScrollY] = useState(0);

    // 리소스별 마지막 명령 상태 (commandId, sequence 포함)
    const [lastCommands, setLastCommands] = useState({});

    // 리소스별 전송 중 상태
    const [pendingResources, setPendingResources] = useState(new Set());
    const currentConfig = siteConfig;
    const startAddressOffset = currentConfig.plcConfig?.startAddress || 0;

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
                // 리프트 탭(page1)일 때만 35%, 나머지는 30%
                let basePosition = activeTab === 'page1' ? 40 : 30;
                
                if (width >= 768 && width < 1200) {
                    // 작은 태블릿
                    scrollSensitivity = 0.5;
                    basePosition = activeTab === 'page1' ? 45 : 53;
                } else if (width >= 1200 && width <= 1400) {
                    // 큰 태블릿
                    scrollSensitivity = 0.5;
                    basePosition = 43;
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
    }, [showSensors, activeTab]);

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
        const startAddressOffset = currentConfig.plcConfig?.startAddress || 0;

        // currentConfig의 센서 매핑을 기반으로 센서 상태 업데이트
        Object.entries(currentConfig.sensorMapping).forEach(([ , configData]) => {
            const { address, sensors } = configData;
            const bufferIndex = address - startAddressOffset;

            if (bufferIndex >= 0 && bufferIndex < sensorData.rawData.length) {
                const wordValue = sensorData.rawData[bufferIndex];
                const actualAddress = address;

                // 각 비트별 센서 상태 확인
                Object.entries(sensors).forEach(([bitIndex, sensorInfo]) => {
                    const bitValue = (wordValue >> parseInt(bitIndex)) & 1;
                    const sensorKey = sensorInfo.name.replace(/[^a-zA-Z0-9]/g, '_'); // 안전한 키로 변환

                    newStates[sensorKey] = {
                        value: bitValue === 1,
                        address: `${currentConfig.plcConfig?.deviceType || 'P'}${actualAddress}`,
                        bitIndex: parseInt(bitIndex),
                        wordIndex: bufferIndex,
                        actualAddress: actualAddress,
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
            const actualAddress = sensor.actualAddress !== undefined ? sensor.actualAddress : (sensor.wordIndex + (currentConfig.plcConfig?.startAddress || 0));
            return `${currentConfig.plcConfig?.deviceType || 'P'}${actualAddress}.${sensor.bitIndex}`;
        }
        return `${currentConfig.plcConfig?.deviceType || 'P'}--.--`;
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
        const transformedKey = sensorKey.replace(/[^a-zA-Z0-9.]/g, '_');
        const _sensor = sensorStates[transformedKey];
        const isActive = getSensorValue(sensorKey);
        const sensorCode = getSensorCode(sensorKey);

        // 센서 이름을 표시용으로 정리 (P*** 부분 제거)
        const displayName = sensorKey.replace(/^P[A-F0-9]+\.[A-F0-9]*_/, '');

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
        homeReturn: 0,
        paletteChange: 0
    };

    // ============================================
    // 🔥 핵심 로직: 명령 전송 (중복 제거 + 안전성 강화)
    // ============================================
    const sendCommand = async (commandName, value) => {
        // 리소스 키 생성 (commandName을 그대로 사용)
        const resourceKey = commandName;
        const lastCmd = lastCommands[resourceKey];

        // ============================================
        // 1. 해제(0) 명령은 즉시 실행 (pending 무시)
        // ============================================
        if (value === 0) {
            console.log(`[즉시 실행] ${commandName}=0 (해제 명령)`);
            try {
                const commandId = Date.now().toString();
                await signalRService.sendConfigCommand(commandName, 0);

                // 성공 시 상태 업데이트
                setLastCommands(prev => ({
                    ...prev,
                    [resourceKey]: {
                        name: commandName,
                        value: 0,
                        timestamp: Date.now(),
                        commandId: commandId,
                        sequence: Date.now()
                    }
                }));
            } catch (error) {
                console.error(`[즉시 실행 실패] ${commandName}=0:`, error);
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
        const commandId = Date.now().toString();
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
            await Promise.race([
                signalRService.sendConfigCommand(commandName, value),
                timeoutPromise
            ]);

            // ============================================
            // 6. 성공 응답 처리
            // ============================================
            const timestamp = Date.now();
            setLastCommands(prev => ({
                ...prev,
                [resourceKey]: {
                    name: commandName,
                    value: value,
                    timestamp: timestamp,
                    commandId: commandId,
                    sequence: timestamp
                }
            }));
            console.log(`[성공] ${commandName}=${value}`);
        } catch (error) {
            // ============================================
            // 7. 에러 처리
            // ============================================
            if (error.message === 'TIMEOUT') {
                console.error(`[타임아웃] ${commandName}=${value}`);
            } else {
                console.error(`[실패] ${commandName}=${value}:`, error);
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
        return pendingResources.has(commandName);
    };

    // 비상정지 처리
    const handleEmergencyStop = async () => {
        try {
            setIsEmergencyMode(true);
            await signalRService.emergencyStop();
            console.log('비상정지 실행');

            // 비상정지는 5초간 활성 표시
            setTimeout(() => setIsEmergencyMode(false), 5000);
        } catch (error) {
            console.error('비상정지 실행 실패:', error);
            setIsEmergencyMode(false);
        }
    };

    // 승강 제어
    const handleLiftUp = () => executeCommand('liftUp', () => signalRService.liftUp());
    const handleLiftDown = () => executeCommand('liftDown', () => signalRService.liftDown());

    // 횡행 제어  
    const handleMoveLeft = () => executeCommand('moveLeft', () => signalRService.moveLeft());
    const handleMoveRight = () => executeCommand('moveRight', () => signalRService.moveRight());

    // 턴테이블 제어
    const handleTurnLeft = () => executeCommand('turnLeft', () => signalRService.turnLeft());
    const handleTurnRight = () => executeCommand('turnRight', () => signalRService.turnRight());

    // 도어 제어
    const handleDoorOpen = () => executeCommand('doorOpen', () => signalRService.doorOpen());
    const handleDoorClose = () => executeCommand('doorClose', () => signalRService.doorClose());

    // 락킹 제어
    const handleLockingOn = () => executeCommand('lockingOn', () => signalRService.lockingOn());
    const handleLockingOff = () => executeCommand('lockingOff', () => signalRService.lockingOff());

    // 시스템 제어
    const handleErrorReset = () => executeCommand('errorReset', () => signalRService.errorReset());
    const handleRemoteControl = () => executeCommand('remoteControl', () => signalRService.remoteControl());
    const handleHomeReturn = () => executeCommand('homeReturn', () => signalRService.homeReturn());
    const handlePaletteChange = () => executeCommand('paletteChange', () => signalRService.paletteChange());

    const isDisabled = !isPLCConnected || !isAuthenticated;

    // 테마에 따른 카드 배경 스타일
    const getCardBackgroundStyle = () => {
        switch (theme) {
            case 'space':
                return {
                    background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)', // 보라색 계열
                    border: '1px solid rgba(147, 51, 234, 0.2)',
                    boxShadow: '0 4px 16px 0 rgba(147, 51, 234, 0.1)'
                };
            default:
                return {
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.15)'
                };
        }
    };

    // 테마에 따른 카드 값 배경 스타일
    const getCardValueBackgroundStyle = () => {
        switch (theme) {
            case 'space':
                return {
                    background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)',
                    border: '1px solid rgba(147, 51, 234, 0.3)',
                    boxShadow: '0 2px 8px 0 rgba(147, 51, 234, 0.1)'
                };
            case 'dark':
                return {
                    background: 'linear-gradient(135deg, rgba(75, 85, 99, 0.2) 0%, rgba(55, 65, 81, 0.1) 100%)',
                    border: '1px solid rgba(75, 85, 99, 0.3)',
                    boxShadow: '0 2px 8px 0 rgba(75, 85, 99, 0.1)'
                };
            case 'ocean':
                return {
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(29, 78, 216, 0.1) 100%)',
                    border: '1px solid rgba(37, 99, 235, 0.3)',
                    boxShadow: '0 2px 8px 0 rgba(37, 99, 235, 0.1)'
                };
            default:
                return {
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 2px 8px 0 rgba(31, 38, 135, 0.15)'
                };
        }
    };

    // 테마에 따른 카드 라벨 색상 클래스
    const getCardLabelColorClass = () => {
        switch (theme) {
            case 'space':
            case 'dark':
            case 'ocean':
                return 'text-white';
            default:
                return 'text-blue-700';
        }
    };

    // 테마에 따른 카드 값 색상 클래스
    const getCardValueColorClass = () => {
        switch (theme) {
            case 'space':
            case 'dark':
            case 'ocean':
                return 'text-purple-800';
            default:
                return 'text-purple-900';
        }
    };

    return (
        <>
            {/* 스타일은 ManualControl.css 파일로 분리되었습니다 */}

            <div className={`rounded-2xl shadow-lg p-3 md:p-4 overflow-hidden border-2 ${theme === 'space' ? 'border-purple-500/30' : theme === 'dark' ? 'border-gray-600/30' : theme === 'ocean' ? 'border-blue-500/30' : 'border-white/20'}`} style={{
                background: theme === 'space' ? 'rgba(20, 20, 20, 0.95)' : theme === 'dark' ? 'rgba(20, 20, 20, 0.95)' : theme === 'ocean' ? 'rgba(0, 20, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
            }}>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-4 space-y-2 md:space-y-0">
                    <div className="hidden md:block"></div>
                    <div className="flex items-center flex-wrap gap-3 justify-end">
                        {isDisabled && (
                            <div className="bg-red-100 border border-red-300 px-3 py-2 rounded-2xl shadow-md">
                                <span className="text-red-700 font-semibold text-sm">🚫 제어 불가</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 탭 컨텐츠 - 간단한 핸들러들로 수정 */}
                <div className="tab-content">
                    {/* 1페이지: 리프트 원격 제어 */}
                    {activeTab === 'page1' && (
                        <div className="flex flex-col items-center gap-20 px-4" style={{ marginTop: '10%' }}>
                            {/* 첫 번째 줄: 비상정지, 수동선택, 센터링선택, 리셋버튼 */}
                            <div className="page1-first-row flex gap-5 justify-center items-center flex-wrap">
                                <HoldButton 
                                    commandName="remoteEmergencyStop" 
                                    label="비상정지" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteEmergencyStop")} 
                                    theme={theme} 
                                    className="emergency-button" 
                                />

                                <HoldButton 
                                    commandName="remoteManualSelect" 
                                    label="수동선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteManualSelect")} 
                                    theme={theme} 
                                />

                                <HoldButton 
                                    commandName="remoteCenteringSelect" 
                                    label="센터링선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteCenteringSelect")} 
                                    theme={theme} 
                                />

                                <HoldButton 
                                    commandName="remoteReset" 
                                    label="리셋버튼" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteReset")} 
                                    theme={theme} 
                                />
                            </div>

                            {/* 두 번째 줄: 고속, 상승, 하강 */}
                            <div className="page1-second-row flex gap-5 justify-center items-center">
                                <HoldButton 
                                    commandName="remoteHighSpeed" 
                                    label="고속버튼" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteHighSpeed")} 
                                    theme={theme} 
                                    className="common-button" 
                                />

                                <HoldButton 
                                    commandName="liftUp" 
                                    label="상승버튼" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("liftUp")} 
                                    theme={theme} 
                                    className="common-button" 
                                />

                                <HoldButton 
                                    commandName="liftDown" 
                                    label="하강버튼" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("liftDown")} 
                                    theme={theme} 
                                    className="common-button" 
                                />
                            </div>

                            {/* 세 번째 줄: 센터링 정렬/해제 */}
                            <div className="page1-stopper-row flex gap-5 justify-center items-center">
                                <HoldButton 
                                    commandName="remoteCenteringAlignStopperUp" 
                                    label="센터링정렬 스토퍼상승" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteCenteringAlignStopperUp")} 
                                    theme={theme} 
                                />

                                <HoldButton 
                                    commandName="remoteCenteringReleaseStopperDown" 
                                    label="센터링해제 스토퍼하강" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteCenteringReleaseStopperDown")} 
                                    theme={theme} 
                                />
                            </div>

                            {/* 네 번째 줄: 도어 열림/닫힘, 외장턴 */}
                            <div className="page1-fourth-row flex gap-5 justify-center items-center">
                                <HoldButton 
                                    commandName="doorOpen" 
                                    label="도어열림" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("doorOpen")} 
                                    theme={theme} 
                                    className="common-button" 
                                />

                                <HoldButton 
                                    commandName="doorClose" 
                                    label="도어닫힘" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("doorClose")} 
                                    theme={theme} 
                                    className="common-button" 
                                />

                                <HoldButton 
                                    commandName="remoteExternalTurnForward" 
                                    label="외장턴정" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteExternalTurnForward")} 
                                    theme={theme} 
                                    className="common-button" 
                                />

                                <HoldButton 
                                    commandName="remoteExternalTurnReverse" 
                                    label="외장턴역" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteExternalTurnReverse")} 
                                    theme={theme} 
                                    className="common-button" 
                                />
                            </div>
                        </div>
                    )}

                    {/* 2페이지: 1단카트 */}
                    {activeTab === 'page2' && (
                        <div className="flex flex-col items-center gap-20 px-4">

                            {/* 1단 카트 상태 데이터 */}
                            <div className={`hidden md:grid grid-cols-4 gap-4 max-w-4xl w-full mb-0 mt-0 -mb-8 ${theme === 'space' ? 'space-theme' : ''}`}>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">카트적재파렛번호</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page2.cartLoadPalletNumber - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page2.cartLoadPalletNumber}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">룸측카운터</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page2.roomSideCounter - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page2.roomSideCounter}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">리프트측카운터</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page2.liftSideCounter - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page2.liftSideCounter}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">상태메시지 1</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page2.statusMessage1 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page2.statusMessage1}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">상태메시지 2</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page2.statusMessage2 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page2.statusMessage2}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">상태메시지 3</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page2.statusMessage3 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page2.statusMessage3}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">이송파렛번호</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page2.cartToLiftTransferPallet - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page2.cartToLiftTransferPallet}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">에러리스트 1</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page2.errorList1 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page2.errorList1}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">에러리스트 2</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page2.errorList2 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page2.errorList2}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">에러리스트 3</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page2.errorList3 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page2.errorList3}</div>
                                </div>
                            </div>

                            {/* LED 상태 표시 영역 */}
                            <div className={`hidden md:grid grid-cols-4 gap-4 max-w-4xl w-full mb-0 -mt-8 ${theme === 'space' ? 'space-theme' : ''}`}>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page2.remoteManualMode.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page2.remoteManualMode.address - startAddressOffset] >> currentConfig.pageDataAddresses.page2.remoteManualMode.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">수동모드</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page2.remoteManualMode.address}.{currentConfig.pageDataAddresses.page2.remoteManualMode.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page2.remoteSemiAutoMode.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page2.remoteSemiAutoMode.address - startAddressOffset] >> currentConfig.pageDataAddresses.page2.remoteSemiAutoMode.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">반자동모드</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page2.remoteSemiAutoMode.address}.{currentConfig.pageDataAddresses.page2.remoteSemiAutoMode.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page2.remoteSliderSelect.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page2.remoteSliderSelect.address - startAddressOffset] >> currentConfig.pageDataAddresses.page2.remoteSliderSelect.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">슬라이더선택</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page2.remoteSliderSelect.address}.{currentConfig.pageDataAddresses.page2.remoteSliderSelect.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page2.remoteLiftSelect.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page2.remoteLiftSelect.address - startAddressOffset] >> currentConfig.pageDataAddresses.page2.remoteLiftSelect.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">리프트선택</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page2.remoteLiftSelect.address}.{currentConfig.pageDataAddresses.page2.remoteLiftSelect.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page2.remoteFrontSliderSelect.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page2.remoteFrontSliderSelect.address - startAddressOffset] >> currentConfig.pageDataAddresses.page2.remoteFrontSliderSelect.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">전면슬라이더선택</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page2.remoteFrontSliderSelect.address}.{currentConfig.pageDataAddresses.page2.remoteFrontSliderSelect.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page2.remoteRearSliderSelect.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page2.remoteRearSliderSelect.address - startAddressOffset] >> currentConfig.pageDataAddresses.page2.remoteRearSliderSelect.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">후면슬라이더선택</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page2.remoteRearSliderSelect.address}.{currentConfig.pageDataAddresses.page2.remoteRearSliderSelect.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page2.remoteSimultaneousSelect.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page2.remoteSimultaneousSelect.address - startAddressOffset] >> currentConfig.pageDataAddresses.page2.remoteSimultaneousSelect.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">동시선택</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page2.remoteSimultaneousSelect.address}.{currentConfig.pageDataAddresses.page2.remoteSimultaneousSelect.bit}</div>
                                </div>
                            </div>         

                            {/* 첫 번째 줄: 비상정지, 수동선택, 자동선택, 리셋버튼 */}
                            <div className="page2-first-row flex gap-5 justify-center items-center flex-wrap">
                                <HoldButton 
                                    commandName="remoteEmergencyButton1" 
                                    label="비상정지" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteEmergencyButton1")} 
                                    theme={theme} 
                                    className="emergency-button" 
                                />

                                <HoldButton 
                                    commandName="remoteManual1" 
                                    label="수동선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteManual1")} 
                                    theme={theme} 
                                />

                                <HoldButton 
                                    commandName="remoteAuto1" 
                                    label="자동선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteAuto1")} 
                                    theme={theme} 
                                />

                                <HoldButton 
                                    commandName="remoteResetButton1" 
                                    label="리셋버튼" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteResetButton1")} 
                                    theme={theme} 
                                />
                            </div>

                            {/* 두 번째 줄: 리프트측선택, 슬라이더선택, 전면선택, 후면선택 */}
                            <div className="page2-second-row flex gap-5 justify-center items-center flex-wrap">
                                <HoldButton 
                                    commandName="remoteLiftSideSelect1" 
                                    label="리프트측선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteLiftSideSelect1")} 
                                    theme={theme} 
                                    className="common-button" 
                                />

                                <HoldButton 
                                    commandName="remoteSliderSelect1" 
                                    label="슬라이더선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteSliderSelect1")} 
                                    theme={theme} 
                                    className="common-button" 
                                />

                                <HoldButton 
                                    commandName="remoteSliderFrontSelect1" 
                                    label="전면선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteSliderFrontSelect1")} 
                                    theme={theme} 
                                    className="common-button" 
                                />

                                <HoldButton 
                                    commandName="remoteSliderRearSelect1" 
                                    label="후면선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteSliderRearSelect1")} 
                                    theme={theme} 
                                    className="common-button" 
                                />
                            </div>

                            {/* 3-5번째 줄 (간격 10) */}
                            <div className="page2-cross-layout flex flex-col gap-10">
                                {/* 세 번째 줄: 격납_로드 1개 */}
                                <div className="page2-third-row flex gap-5 justify-center items-center">
                                <HoldButton 
                                    commandName="remoteStorageButtonLoad1" 
                                    label="격납_로드" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteStorageButtonLoad1")} 
                                    theme={theme} 
                                />
                            </div>

                            {/* 네 번째 줄: 끝번주행, 고속, 시작주행 3개 */}
                            <div className="page2-fourth-row flex gap-5 justify-center items-center flex-wrap">
                                <HoldButton 
                                    commandName="remoteEndRunButton1" 
                                    label="끝번주행" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteEndRunButton1")} 
                                    theme={theme} 
                                />

                                <HoldButton 
                                    commandName="remoteHighSpeedButton1" 
                                    label="고속" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteHighSpeedButton1")} 
                                    theme={theme} 
                                />

                                <HoldButton 
                                    commandName="remoteStartRunButton1" 
                                    label="시작주행" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteStartRunButton1")} 
                                    theme={theme} 
                                />
                            </div>

                            {/* 다섯 번째 줄: 추출_언로드 1개 */}
                            <div className="page2-fifth-row flex gap-5 justify-center items-center">
                                <HoldButton 
                                    commandName="remoteExtractButtonUnload1" 
                                    label="추출_언로드" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteExtractButtonUnload1")} 
                                    theme={theme} 
                                />
                            </div>
                            </div>

                            {/* 슬라이더초기화 */}
                            <div className="page2-slider-init flex gap-5 justify-center items-center">
                                <div className="slider-init-spacer" style={{ flex: '0 0 280%' }}></div>
                                <HoldButton 
                                    commandName="remoteSliderInitialize" 
                                    label="슬라이더초기화" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteSliderInitialize")} 
                                    theme={theme} 
                                    className="common-button" 
                                />
                            </div>
                        </div>
                    )}

                    {/* 중복 제거 완료 */}

                    {/* 3페이지: 2단카트 */}
                    {activeTab === 'page3' && (
                        <div className="flex flex-col items-center gap-20 px-4">
                            {/* 2단 카트 상태 데이터 */}
                            <div className={`hidden md:grid grid-cols-4 gap-4 max-w-4xl w-full mb-0 mt-0 -mb-8 ${theme === 'space' ? 'space-theme' : ''}`}>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">카트적재파렛번호</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page3.cartLoadPalletNumber - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page3.cartLoadPalletNumber}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">룸측카운터</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page3.roomSideCounter - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page3.roomSideCounter}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">리프트측카운터</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page3.liftSideCounter - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page3.liftSideCounter}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">상태메시지 1</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page3.statusMessage1 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page3.statusMessage1}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">상태메시지 2</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page3.statusMessage2 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page3.statusMessage2}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">상태메시지 3</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page3.statusMessage3 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page3.statusMessage3}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">이송파렛번호</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page3.cartToLiftTransferPallet - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page3.cartToLiftTransferPallet}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">에러리스트 1</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page3.errorList1 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page3.errorList1}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">에러리스트 2</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page3.errorList2 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page3.errorList2}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">에러리스트 3</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page3.errorList3 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page3.errorList3}</div>
                                </div>
                            </div>

                            {/* LED 상태 표시 영역 */}
                            <div className={`hidden md:grid grid-cols-4 gap-4 max-w-4xl w-full mb-0 -mt-8 ${theme === 'space' ? 'space-theme' : ''}`}>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page3.remoteManualMode.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page3.remoteManualMode.address - startAddressOffset] >> currentConfig.pageDataAddresses.page3.remoteManualMode.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">수동모드</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page3.remoteManualMode.address}.{currentConfig.pageDataAddresses.page3.remoteManualMode.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page3.remoteSemiAutoMode.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page3.remoteSemiAutoMode.address - startAddressOffset] >> currentConfig.pageDataAddresses.page3.remoteSemiAutoMode.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">반자동모드</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page3.remoteSemiAutoMode.address}.{currentConfig.pageDataAddresses.page3.remoteSemiAutoMode.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page3.remoteSliderSelect.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page3.remoteSliderSelect.address - startAddressOffset] >> currentConfig.pageDataAddresses.page3.remoteSliderSelect.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">슬라이더선택</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page3.remoteSliderSelect.address}.{currentConfig.pageDataAddresses.page3.remoteSliderSelect.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page3.remoteLiftSelect.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page3.remoteLiftSelect.address - startAddressOffset] >> currentConfig.pageDataAddresses.page3.remoteLiftSelect.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">리프트선택</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page3.remoteLiftSelect.address}.{currentConfig.pageDataAddresses.page3.remoteLiftSelect.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page3.remoteFrontSliderSelect.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page3.remoteFrontSliderSelect.address - startAddressOffset] >> currentConfig.pageDataAddresses.page3.remoteFrontSliderSelect.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">전면슬라이더선택</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page3.remoteFrontSliderSelect.address}.{currentConfig.pageDataAddresses.page3.remoteFrontSliderSelect.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page3.remoteRearSliderSelect.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page3.remoteRearSliderSelect.address - startAddressOffset] >> currentConfig.pageDataAddresses.page3.remoteRearSliderSelect.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">후면슬라이더선택</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page3.remoteRearSliderSelect.address}.{currentConfig.pageDataAddresses.page3.remoteRearSliderSelect.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page3.remoteSimultaneousSelect.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page3.remoteSimultaneousSelect.address - startAddressOffset] >> currentConfig.pageDataAddresses.page3.remoteSimultaneousSelect.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">동시선택</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page3.remoteSimultaneousSelect.address}.{currentConfig.pageDataAddresses.page3.remoteSimultaneousSelect.bit}</div>
                                </div>
                            </div>

                            {/* 첫 번째 줄: 비상정지, 수동선택, 자동선택, 리셋버튼 */}
                            <div className="page2-first-row flex gap-5 justify-center items-center flex-wrap">
                                <HoldButton 
                                    commandName="remoteEmergencyButton2" 
                                    label="비상정지" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteEmergencyButton2")} 
                                    theme={theme} 
                                    className="emergency-button" 
                                />

                                <HoldButton 
                                    commandName="remoteManual2" 
                                    label="수동선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteManual2")} 
                                    theme={theme} 
                                />

                                <HoldButton 
                                    commandName="remoteAuto2" 
                                    label="자동선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteAuto2")} 
                                    theme={theme} 
                                />

                                <HoldButton 
                                    commandName="remoteResetButton2" 
                                    label="리셋버튼" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteResetButton2")} 
                                    theme={theme} 
                                />
                            </div>

                            {/* 두 번째 줄: 리프트측선택, 슬라이더선택, 전면선택, 후면선택 */}
                            <div className="page2-second-row flex gap-5 justify-center items-center flex-wrap">
                                <HoldButton 
                                    commandName="remoteLiftSideSelect2" 
                                    label="리프트측선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteLiftSideSelect2")} 
                                    theme={theme} 
                                    className="common-button" 
                                />

                                <HoldButton 
                                    commandName="remoteSliderSelect2" 
                                    label="슬라이더선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteSliderSelect2")} 
                                    theme={theme} 
                                    className="common-button" 
                                />

                                <HoldButton 
                                    commandName="remoteSliderFrontSelect2" 
                                    label="전면선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteSliderFrontSelect2")} 
                                    theme={theme} 
                                    className="common-button" 
                                />

                                <HoldButton 
                                    commandName="remoteSliderRearSelect2" 
                                    label="후면선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteSliderRearSelect2")} 
                                    theme={theme} 
                                    className="common-button" 
                                />
                            </div>

                            {/* 3-5번째 줄 (간격 10) */}
                            <div className="page2-cross-layout flex flex-col gap-10">
                                {/* 세 번째 줄: 격납_로드 1개 */}
                                <div className="page2-third-row flex gap-5 justify-center items-center">
                                <HoldButton 
                                    commandName="remoteStorageButtonLoad2" 
                                    label="격납_로드" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteStorageButtonLoad2")} 
                                    theme={theme} 
                                />
                            </div>

                            {/* 네 번째 줄: 끝번주행, 고속, 시작주행 3개 */}
                            <div className="page2-fourth-row flex gap-5 justify-center items-center flex-wrap">
                                <HoldButton 
                                    commandName="remoteEndRunButton2" 
                                    label="끝번주행" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteEndRunButton2")} 
                                    theme={theme} 
                                />

                                <HoldButton 
                                    commandName="remoteHighSpeedButton2" 
                                    label="고속" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteHighSpeedButton2")} 
                                    theme={theme} 
                                />

                                <HoldButton 
                                    commandName="remoteStartRunButton2" 
                                    label="시작주행" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteStartRunButton2")} 
                                    theme={theme} 
                                />
                            </div>

                            {/* 다섯 번째 줄: 추출_언로드 1개 */}
                            <div className="page2-fifth-row flex gap-5 justify-center items-center">
                                <HoldButton 
                                    commandName="remoteExtractButtonUnload2" 
                                    label="추출_언로드" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteExtractButtonUnload2")} 
                                    theme={theme} 
                                />
                            </div>
                            </div>

                            {/* 슬라이더초기화 */}
                            <div className="page2-slider-init flex gap-5 justify-center items-center">
                                <div className="slider-init-spacer" style={{ flex: '0 0 280%' }}></div>
                                <HoldButton 
                                    commandName="remoteSliderInitialize2" 
                                    label="슬라이더초기화" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteSliderInitialize2")} 
                                    theme={theme} 
                                    className="common-button" 
                                />
                            </div>
                        </div>
                    )}

                    {/* 4페이지: 3단카트 */}
                    {activeTab === 'page4' && (
                        <div className="flex justify-center items-center md:min-h-[200px]">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold mb-4">3단카트 제어</h3>
                                <p className="text-gray-600">3단카트 제어 기능이 여기에 표시됩니다.</p>
                            </div>
                        </div>
                    )}

                    {/* 5페이지: 4단카트 */}
                    {activeTab === 'page5' && (
                        <div className="flex flex-col items-center gap-20 px-4">
                            {/* 4단 카트 상태 데이터 */}
                            <div className={`hidden md:grid grid-cols-4 gap-4 max-w-4xl w-full mb-0 mt-0 -mb-8 ${theme === 'space' ? 'space-theme' : ''}`}>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">카트적재파렛번호</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page5.cartLoadPalletNumber - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page5.cartLoadPalletNumber}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">룸측카운터</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page5.roomSideCounter - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page5.roomSideCounter}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">리프트측카운터</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page5.liftSideCounter - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page5.liftSideCounter}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">상태메시지 1</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page5.statusMessage1 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page5.statusMessage1}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">상태메시지 2</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page5.statusMessage2 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page5.statusMessage2}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">상태메시지 3</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page5.statusMessage3 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page5.statusMessage3}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">이송파렛번호</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page5.cartToLiftTransferPallet - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page5.cartToLiftTransferPallet}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">에러리스트 1</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page5.errorList1 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page5.errorList1}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">에러리스트 2</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page5.errorList2 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page5.errorList2}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">에러리스트 3</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page5.errorList3 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page5.errorList3}</div>
                                </div>
                            </div>

                            {/* LED 상태 표시 영역 */}
                            <div className={`hidden md:grid grid-cols-4 gap-4 max-w-4xl w-full mb-0 -mt-8 ${theme === 'space' ? 'space-theme' : ''}`}>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page5.remoteManualMode.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page5.remoteManualMode.address - startAddressOffset] >> currentConfig.pageDataAddresses.page5.remoteManualMode.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">수동모드</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page5.remoteManualMode.address}.{currentConfig.pageDataAddresses.page5.remoteManualMode.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page5.remoteSemiAutoMode.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page5.remoteSemiAutoMode.address - startAddressOffset] >> currentConfig.pageDataAddresses.page5.remoteSemiAutoMode.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">반자동모드</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page5.remoteSemiAutoMode.address}.{currentConfig.pageDataAddresses.page5.remoteSemiAutoMode.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page5.remoteSliderSelect.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page5.remoteSliderSelect.address - startAddressOffset] >> currentConfig.pageDataAddresses.page5.remoteSliderSelect.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">슬라이더선택</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page5.remoteSliderSelect.address}.{currentConfig.pageDataAddresses.page5.remoteSliderSelect.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page5.remoteLiftSelect.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page5.remoteLiftSelect.address - startAddressOffset] >> currentConfig.pageDataAddresses.page5.remoteLiftSelect.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">리프트선택</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page5.remoteLiftSelect.address}.{currentConfig.pageDataAddresses.page5.remoteLiftSelect.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page5.remoteFrontSliderSelect.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page5.remoteFrontSliderSelect.address - startAddressOffset] >> currentConfig.pageDataAddresses.page5.remoteFrontSliderSelect.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">전면슬라이더선택</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page5.remoteFrontSliderSelect.address}.{currentConfig.pageDataAddresses.page5.remoteFrontSliderSelect.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page5.remoteRearSliderSelect.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page5.remoteRearSliderSelect.address - startAddressOffset] >> currentConfig.pageDataAddresses.page5.remoteRearSliderSelect.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">후면슬라이더선택</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page5.remoteRearSliderSelect.address}.{currentConfig.pageDataAddresses.page5.remoteRearSliderSelect.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page5.remoteSimultaneousSelect.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page5.remoteSimultaneousSelect.address - startAddressOffset] >> currentConfig.pageDataAddresses.page5.remoteSimultaneousSelect.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">동시선택</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page5.remoteSimultaneousSelect.address}.{currentConfig.pageDataAddresses.page5.remoteSimultaneousSelect.bit}</div>
                                </div>
                            </div>

                            {/* 첫 번째 줄: 비상정지, 수동선택, 자동선택, 리셋버튼 */}
                            <div className="page2-first-row flex gap-5 justify-center items-center flex-wrap">
                                <HoldButton 
                                    commandName="remoteEmergencyButton4" 
                                    label="비상정지" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteEmergencyButton4")} 
                                    theme={theme} 
                                    className="emergency-button" 
                                />

                                <HoldButton 
                                    commandName="remoteManual4" 
                                    label="수동선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteManual4")} 
                                    theme={theme} 
                                />

                                <HoldButton 
                                    commandName="remoteAuto4" 
                                    label="자동선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteAuto4")} 
                                    theme={theme} 
                                />

                                <HoldButton 
                                    commandName="remoteResetButton4" 
                                    label="리셋버튼" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteResetButton4")} 
                                    theme={theme} 
                                />
                            </div>

                            {/* 두 번째 줄: 리프트측선택, 슬라이더선택, 전면선택, 후면선택 */}
                            <div className="page2-second-row flex gap-5 justify-center items-center flex-wrap">
                                <HoldButton 
                                    commandName="remoteLiftSideSelect4" 
                                    label="리프트측선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteLiftSideSelect4")} 
                                    theme={theme} 
                                    className="common-button" 
                                />

                                <HoldButton 
                                    commandName="remoteSliderSelect4" 
                                    label="슬라이더선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteSliderSelect4")} 
                                    theme={theme} 
                                    className="common-button" 
                                />

                                <HoldButton 
                                    commandName="remoteSliderFrontSelect4" 
                                    label="전면선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteSliderFrontSelect4")} 
                                    theme={theme} 
                                    className="common-button" 
                                />

                                <HoldButton 
                                    commandName="remoteSliderRearSelect4" 
                                    label="후면선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteSliderRearSelect4")} 
                                    theme={theme} 
                                    className="common-button" 
                                />
                            </div>

                            {/* 3-5번째 줄 (간격 10) */}
                            <div className="page2-cross-layout flex flex-col gap-10">
                                {/* 세 번째 줄: 격납_로드 1개 */}
                                <div className="page2-third-row flex gap-5 justify-center items-center">
                                <HoldButton 
                                    commandName="remoteStorageButtonLoad4" 
                                    label="격납_로드" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteStorageButtonLoad4")} 
                                    theme={theme} 
                                />
                            </div>

                            {/* 네 번째 줄: 끝번주행, 고속, 시작주행 3개 */}
                            <div className="page2-fourth-row flex gap-5 justify-center items-center flex-wrap">
                                <HoldButton 
                                    commandName="remoteEndRunButton4" 
                                    label="끝번주행" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteEndRunButton4")} 
                                    theme={theme} 
                                />

                                <HoldButton 
                                    commandName="remoteHighSpeedButton4" 
                                    label="고속" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteHighSpeedButton4")} 
                                    theme={theme} 
                                />

                                <HoldButton 
                                    commandName="remoteStartRunButton4" 
                                    label="시작주행" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteStartRunButton4")} 
                                    theme={theme} 
                                />
                            </div>

                            {/* 다섯 번째 줄: 추출_언로드 1개 */}
                            <div className="page2-fifth-row flex gap-5 justify-center items-center">
                                <HoldButton 
                                    commandName="remoteExtractButtonUnload4" 
                                    label="추출_언로드" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteExtractButtonUnload4")} 
                                    theme={theme} 
                                />
                            </div>
                            </div>

                            {/* 슬라이더초기화 */}
                            <div className="page2-slider-init flex gap-5 justify-center items-center">
                                <div className="slider-init-spacer" style={{ flex: '0 0 280%' }}></div>
                                <HoldButton 
                                    commandName="remoteSliderInitialize4" 
                                    label="슬라이더초기화" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteSliderInitialize4")} 
                                    theme={theme} 
                                    className="common-button" 
                                />
                            </div>
                        </div>
                    )}

                    {/* 6페이지: 5단카트 */}
                    {activeTab === 'page6' && (
                        <div className="flex flex-col items-center gap-20 px-4">
                            {/* 5단 카트 상태 데이터 */}
                            <div className={`hidden md:grid grid-cols-4 gap-4 max-w-4xl w-full mb-0 mt-0 -mb-8 ${theme === 'space' ? 'space-theme' : ''}`}>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">카트적재파렛번호</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page6.cartLoadPalletNumber - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page6.cartLoadPalletNumber}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">룸측카운터</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page6.roomSideCounter - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page6.roomSideCounter}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">리프트측카운터</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page6.liftSideCounter - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page6.liftSideCounter}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">상태메시지 1</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page6.statusMessage1 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page6.statusMessage1}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">상태메시지 2</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page6.statusMessage2 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page6.statusMessage2}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">상태메시지 3</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page6.statusMessage3 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page6.statusMessage3}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">이송파렛번호</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page6.cartToLiftTransferPallet - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page6.cartToLiftTransferPallet}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">에러리스트 1</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page6.errorList1 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page6.errorList1}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">에러리스트 2</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page6.errorList2 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page6.errorList2}</div>
                                </div>
                                <div className={`data-value-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className="data-label">에러리스트 3</div>
                                    <div className="data-value">{sensorData?.rawData?.[currentConfig.pageDataAddresses.page6.errorList3 - startAddressOffset] || 0}</div>
                                    <div className="data-address">P{currentConfig.pageDataAddresses.page6.errorList3}</div>
                                </div>
                            </div>

                            {/* LED 상태 표시 영역 */}
                            <div className={`hidden md:grid grid-cols-4 gap-4 max-w-4xl w-full mb-0 -mt-8 ${theme === 'space' ? 'space-theme' : ''}`}>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page6.remoteManualMode.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page6.remoteManualMode.address - startAddressOffset] >> currentConfig.pageDataAddresses.page6.remoteManualMode.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">수동모드</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page6.remoteManualMode.address}.{currentConfig.pageDataAddresses.page6.remoteManualMode.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page6.remoteSemiAutoMode.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page6.remoteSemiAutoMode.address - startAddressOffset] >> currentConfig.pageDataAddresses.page6.remoteSemiAutoMode.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">반자동모드</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page6.remoteSemiAutoMode.address}.{currentConfig.pageDataAddresses.page6.remoteSemiAutoMode.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page6.remoteSliderSelect.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page6.remoteSliderSelect.address - startAddressOffset] >> currentConfig.pageDataAddresses.page6.remoteSliderSelect.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">슬라이더선택</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page6.remoteSliderSelect.address}.{currentConfig.pageDataAddresses.page6.remoteSliderSelect.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page6.remoteLiftSelect.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page6.remoteLiftSelect.address - startAddressOffset] >> currentConfig.pageDataAddresses.page6.remoteLiftSelect.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">리프트선택</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page6.remoteLiftSelect.address}.{currentConfig.pageDataAddresses.page6.remoteLiftSelect.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page6.remoteFrontSliderSelect.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page6.remoteFrontSliderSelect.address - startAddressOffset] >> currentConfig.pageDataAddresses.page6.remoteFrontSliderSelect.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">전면슬라이더선택</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page6.remoteFrontSliderSelect.address}.{currentConfig.pageDataAddresses.page6.remoteFrontSliderSelect.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page6.remoteRearSliderSelect.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page6.remoteRearSliderSelect.address - startAddressOffset] >> currentConfig.pageDataAddresses.page6.remoteRearSliderSelect.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">후면슬라이더선택</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page6.remoteRearSliderSelect.address}.{currentConfig.pageDataAddresses.page6.remoteRearSliderSelect.bit}</div>
                                </div>
                                <div className={`led-status-card ${theme === 'space' ? 'space-theme' : ''}`}>
                                    <div className={`led-indicator ${sensorData?.rawData?.[currentConfig.pageDataAddresses.page6.remoteSimultaneousSelect.address - startAddressOffset] && (sensorData.rawData[currentConfig.pageDataAddresses.page6.remoteSimultaneousSelect.address - startAddressOffset] >> currentConfig.pageDataAddresses.page6.remoteSimultaneousSelect.bit) & 1 ? 'on' : 'off'}`}></div>
                                    <div className="led-label">동시선택</div>
                                    <div className="led-address">P{currentConfig.pageDataAddresses.page6.remoteSimultaneousSelect.address}.{currentConfig.pageDataAddresses.page6.remoteSimultaneousSelect.bit}</div>
                                </div>
                            </div>

                            {/* 첫 번째 줄: 비상정지, 수동선택, 자동선택, 리셋버튼 */}
                            <div className="page2-first-row flex gap-5 justify-center items-center flex-wrap">
                                <HoldButton 
                                    commandName="remoteEmergencyButton5" 
                                    label="비상정지" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteEmergencyButton5")} 
                                    theme={theme} 
                                    className="emergency-button" 
                                />

                                <HoldButton 
                                    commandName="remoteManual5" 
                                    label="수동선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteManual5")} 
                                    theme={theme} 
                                />

                                <HoldButton 
                                    commandName="remoteAuto5" 
                                    label="자동선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteAuto5")} 
                                    theme={theme} 
                                />

                                <HoldButton 
                                    commandName="remoteResetButton5" 
                                    label="리셋버튼" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteResetButton5")} 
                                    theme={theme} 
                                />
                            </div>

                            {/* 두 번째 줄: 리프트측선택, 슬라이더선택, 전면선택, 후면선택 */}
                            <div className="page2-second-row flex gap-5 justify-center items-center flex-wrap">
                                <HoldButton 
                                    commandName="remoteLiftSideSelect5" 
                                    label="리프트측선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteLiftSideSelect5")} 
                                    theme={theme} 
                                    className="common-button" 
                                />

                                <HoldButton 
                                    commandName="remoteSliderSelect5" 
                                    label="슬라이더선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteSliderSelect5")} 
                                    theme={theme} 
                                    className="common-button" 
                                />

                                <HoldButton 
                                    commandName="remoteSliderFrontSelect5" 
                                    label="전면선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteSliderFrontSelect5")} 
                                    theme={theme} 
                                    className="common-button" 
                                />

                                <HoldButton 
                                    commandName="remoteSliderRearSelect5" 
                                    label="후면선택" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteSliderRearSelect5")} 
                                    theme={theme} 
                                    className="common-button" 
                                />
                            </div>

                            {/* 3-5번째 줄 (간격 10) */}
                            <div className="page2-cross-layout flex flex-col gap-10">
                                {/* 세 번째 줄: 격납_로드 1개 */}
                                <div className="page2-third-row flex gap-5 justify-center items-center">
                                <HoldButton 
                                    commandName="remoteStorageButtonLoad5" 
                                    label="격납_로드" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteStorageButtonLoad5")} 
                                    theme={theme} 
                                />
                            </div>

                            {/* 네 번째 줄: 끝번주행, 고속, 시작주행 3개 */}
                            <div className="page2-fourth-row flex gap-5 justify-center items-center flex-wrap">
                                <HoldButton 
                                    commandName="remoteEndRunButton5" 
                                    label="끝번주행" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteEndRunButton5")} 
                                    theme={theme} 
                                />

                                <HoldButton 
                                    commandName="remoteHighSpeedButton5" 
                                    label="고속" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteHighSpeedButton5")} 
                                    theme={theme} 
                                />

                                <HoldButton 
                                    commandName="remoteStartRunButton5" 
                                    label="시작주행" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteStartRunButton5")} 
                                    theme={theme} 
                                />
                            </div>

                            {/* 다섯 번째 줄: 추출_언로드 1개 */}
                            <div className="page2-fifth-row flex gap-5 justify-center items-center">
                                <HoldButton 
                                    commandName="remoteExtractButtonUnload5" 
                                    label="추출_언로드" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteExtractButtonUnload5")} 
                                    theme={theme} 
                                />
                            </div>
                            </div>

                            {/* 슬라이더초기화 */}
                            <div className="page2-slider-init flex gap-5 justify-center items-center">
                                <div className="slider-init-spacer" style={{ flex: '0 0 280%' }}></div>
                                <HoldButton 
                                    commandName="remoteSliderInitialize5" 
                                    label="슬라이더초기화" 
                                    onPress={sendCommand} 
                                    disabled={isDisabled} 
                                    busy={isResourceBusy("remoteSliderInitialize5")} 
                                    theme={theme} 
                                    className="common-button" 
                                />
                            </div>
                        </div>
                    )}

                    {/* 7페이지: 6단카트 */}
                    {activeTab === 'page7' && (
                        <div className="flex justify-center items-center md:min-h-[200px]">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold mb-4">6단카트 제어</h3>
                                <p className="text-gray-600">6단카트 제어 기능이 여기에 표시됩니다.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 탭 네비게이션 */}
                <div className="tab-navigation" style={{ marginTop: window.innerWidth <= 768 ? '40px' : '120px' }}>
                    <button
                        onClick={() => { setActiveTab('page1'); setShowSensors(true); }}
                        className={`tab-button ${theme === 'space' ? 'space-theme' : ''} ${activeTab === 'page1' ? 'active' : ''}`}
                    >
                        리프트
                    </button>
                    <button
                        onClick={() => { setActiveTab('page2'); setShowSensors(true); }}
                        className={`tab-button ${theme === 'space' ? 'space-theme' : ''} ${activeTab === 'page2' ? 'active' : ''}`}
                    >
                        1단카트
                    </button>
                    <button
                        onClick={() => { setActiveTab('page3'); setShowSensors(true); }}
                        className={`tab-button ${theme === 'space' ? 'space-theme' : ''} ${activeTab === 'page3' ? 'active' : ''}`}
                    >
                        2단카트
                    </button>
                    <button
                        onClick={() => { setActiveTab('page4'); setShowSensors(true); }}
                        className={`tab-button ${theme === 'space' ? 'space-theme' : ''} ${activeTab === 'page4' ? 'active' : ''}`}
                    >
                        3단카트
                    </button>
                    <button
                        onClick={() => { setActiveTab('page5'); setShowSensors(true); }}
                        className={`tab-button ${theme === 'space' ? 'space-theme' : ''} ${activeTab === 'page5' ? 'active' : ''}`}
                    >
                        4단카트
                    </button>
                    <button
                        onClick={() => { setActiveTab('page6'); setShowSensors(true); }}
                        className={`tab-button ${theme === 'space' ? 'space-theme' : ''} ${activeTab === 'page6' ? 'active' : ''}`}
                    >
                        5단카트
                    </button>
                    <button
                        onClick={() => { setActiveTab('page7'); setShowSensors(true); }}
                        className={`tab-button ${theme === 'space' ? 'space-theme' : ''} ${activeTab === 'page7' ? 'active' : ''}`}
                    >
                        6단카트
                    </button>
                </div>
            </div>

            {/* 좌측 센서 패널 - config 기반 동적 렌더링 */}
            {showSensors && (

                <div className={`sensor-panel-left show ${theme === 'space' ? 'space-theme' : ''}`}>
                    <div className="mb-4 text-center">
                        
                    </div>
                    {renderLeftSensorPanel()}

                </div>
            )}

            {/* 우측 센서 패널 - config 기반 동적 렌더링 */}
            {showSensors && (

                <div className={`sensor-panel-right show ${theme === 'space' ? 'space-theme' : ''}`}>
                    <div className="mb-4 text-center">
                   
                    </div>
                    {renderRightSensorPanel()}

                </div>
            )}
        </>
    );
};

export default ManualControl;