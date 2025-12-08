import React, { useState, useEffect, useCallback } from 'react';
import siteConfig from '../../config/gapEulMyeongGaConfig.js';
// SignalR 서비스 import
import signalRService from '../services/signalrService.js';
import { useTheme } from '../contexts/ThemeContext';

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
            <style>{`
                @import url("https://fonts.googleapis.com/css?family=Rubik:700&display=swap");
                
                .learn-more {
                    font-weight: 600;
                    color: #1e3a8a;
                    text-transform: uppercase;
                    padding: 14px 12px;
                    background: #dbeafe;
                    border: 1px solid #3b82f6;
                    border-radius: 20px;
                    transform-style: preserve-3d;
                    transition: transform 150ms cubic-bezier(0, 0, 0.58, 1), background 150ms cubic-bezier(0, 0, 0.58, 1);
                    position: relative;
                    display: inline-block;
                    cursor: pointer;
                    outline: none;
                    vertical-align: middle;
                    text-decoration: none;
                    font-size: 0.75rem;
                    font-family: inherit;
                    min-width: 90px;
                }

                .learn-more.space-theme {
                    color: #f3e8ff;
                    background: #6b46c1;
                    border: 1px solid #5b21b6;
                }
                
                @media (min-width: 768px) and (max-width: 1199px) {
                    .learn-more {
                        min-width: 120px;
                        padding: 18px 20px;
                        font-size: 0.8rem;
                    }
                }
                
                @media (min-width: 1200px) {
                    .learn-more {
                        min-width: 160px;
                        padding: 24px 28px;
                    }
                }

                
                .learn-more::before {
                    position: absolute;
                    content: "";
                    width: 100%;
                    height: 100%;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: #93c5fd;
                    border-radius: inherit;
                    box-shadow: 0 0 0 1px #3b82f6, 0 0.625em 0 0 #bfdbfe;
                    transform: translate3d(0, 0.75em, -1em);
                    transition: transform 150ms cubic-bezier(0, 0, 0.58, 1), box-shadow 150ms cubic-bezier(0, 0, 0.58, 1);
                }

                .learn-more.space-theme::before {
                    background: #2d1b69;
                    box-shadow: 0 0 0 1px #5b21b6, 0 0.625em 0 0 #2d1b69;
                }
                
                .learn-more:hover {
                    background: #bfdbfe;
                    transform: translate(0, 0.25em);
                }
                
                .learn-more:hover::before {
                    box-shadow: 0 0 0 1px #3b82f6, 0 0.5em 0 0 #bfdbfe;
                    transform: translate3d(0, 0.5em, -1em);
                }

                .learn-more.space-theme:hover {
                    background: #4c1d95;
                }
                
                .learn-more.space-theme:hover::before {
                    box-shadow: 0 0 0 1px #5b21b6, 0 0.5em 0 0 #6b46c1;
                    transform: translate3d(0, 0.5em, -1em);
                }
                
                .learn-more:active {
                    background: #bfdbfe;
                    transform: translate(0em, 0.75em);
                }
                
                .learn-more:active::before {
                    box-shadow: 0 0 0 1px #3b82f6, 0 0 #bfdbfe;
                    transform: translate3d(0, 0, -1em);
                }

                .learn-more.space-theme:active {
                    background: #4c1d95;
                }
                
                .learn-more.space-theme:active::before {
                    box-shadow: 0 0 0 1px #5b21b6, 0 0 #6b46c1;
                    transform: translate3d(0, 0, -1em);
                }

                .emergency-button {
                    color: #7f1d1d;
                    background: #fecaca;
                    border: 1px solid #dc2626;
                    min-width: 120px;
                    text-align: center;
                    font-size: 0.875rem;
                }
                
                .emergency-button::before {
                    background: #fca5a5;
                    box-shadow: 0 0 0 1px #dc2626, 0 0.625em 0 0 #fecaca;
                }
                
                .emergency-button:hover {
                    background: #fca5a5;
                }
                
                .emergency-button:hover::before {
                    box-shadow: 0 0 0 1px #dc2626, 0 0.5em 0 0 #fecaca;
                }
                
                .emergency-button:active {
                    background: #fca5a5;
                }
                
                .emergency-button:active::before {
                    box-shadow: 0 0 0 1px #dc2626, 0 0 #fecaca;
                }

                .common-button {
                    color: #6b7280;
                    background: #f3f4f6;
                    border: 1px solid #9ca3af;
                    min-width: 120px;
                    text-align: center;
                    font-size: 0.75rem;
                }
                
                .common-button::before {
                    background: #d1d5db;
                    box-shadow: 0 0 0 1px #9ca3af, 0 0.625em 0 0 #f3f4f6;
                }
                
                .common-button:hover {
                    background: #e5e7eb;
                }
                
                .common-button:hover::before {
                    box-shadow: 0 0 0 1px #9ca3af, 0 0.5em 0 0 #f3f4f6;
                }
                
                .common-button:active {
                    background: #e5e7eb;
                }
                
                .common-button:active::before {
                    box-shadow: 0 0 0 1px #9ca3af, 0 0 #f3f4f6;
                }

                .common-button.space-theme {
                    color: #f9fafb;
                    background: #374151;
                    border: 1px solid #1f2937;
                }
                
                .common-button.space-theme::before {
                    background: #111827;
                    box-shadow: 0 0 0 1px #1f2937, 0 0.625em 0 0 #111827;
                }
                
                .common-button.space-theme:hover {
                    background: #1f2937;
                }
                
                .common-button.space-theme:hover::before {
                    box-shadow: 0 0 0 1px #1f2937, 0 0.5em 0 0 #111827;
                }
                
                .common-button.space-theme:active {
                    background: #1f2937;
                }
                
                .common-button.space-theme:active::before {
                    box-shadow: 0 0 0 1px #1f2937, 0 0 #111827;
                }

                .emergency-button.space-theme {
                    color: #fef2f2;
                    background: #991b1b;
                    border: 1px solid #7f1d1d;
                }
                
                .emergency-button.space-theme::before {
                    background: #450a0a;
                    box-shadow: 0 0 0 1px #7f1d1d, 0 0.625em 0 0 #450a0a;
                }
                
                .emergency-button.space-theme:hover {
                    background: #7f1d1d;
                }
                
                .emergency-button.space-theme:hover::before {
                    box-shadow: 0 0 0 1px #7f1d1d, 0 0.5em 0 0 #450a0a;
                }
                
                .emergency-button.space-theme:active {
                    background: #7f1d1d;
                }
                
                .emergency-button.space-theme:active::before {
                    box-shadow: 0 0 0 1px #7f1d1d, 0 0 #450a0a;
                }

                .common-buttons-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                    justify-content: center;
                    max-width: none;
                }

                @media (min-width: 768px) and (max-width: 1400px) {
                    .common-buttons-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        max-width: 320px;
                        margin: 0 auto;
                        margin-top: 20px;
                        margin-bottom: 20px;
                    }
                    
                    .common-buttons-grid .common-button {
                        min-width: 120px;
                        padding: 20px 32px;
                        font-size: 0.875rem;
                    }
                    
                    .common-buttons-grid .emergency-button {
                        grid-column: 1 / -1;
                        justify-self: center;
                        margin-top: 16px;
                        min-width: 120px;
                        padding: 20px 32px;
                        font-size: 0.875rem;
                    }
                }

                .tab-navigation {
                    display: flex;
                    gap: 8px;
                    margin: 40px 0 20px 0;
                    justify-content: center;
                }
                
                .sensor-panel-right {
                    position: fixed;
                    top: 35%;
                    right: -300px;
                    width: 300px;
                    height: 70vh;
                    transform: translateY(-50%);
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    box-shadow: -5px 0 20px rgba(0, 0, 0, 0.1);
                    transition: right 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55), top 0.3s ease-out;
                    z-index: 1000;
                    overflow-y: auto;
                    padding: 20px;
                    border-radius: 20px 0 0 20px;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                
                .sensor-panel-right.space-theme {
                    background: linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(15, 15, 15, 0.9) 100%);
                    border: 1px solid rgba(40, 40, 40, 0.3);
                    box-shadow: -5px 0 20px rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(25px);
                    -webkit-backdrop-filter: blur(25px);
                }
                
                @media (min-width: 768px) and (max-width: 1199px) {
                    .sensor-panel-right {
                        width: 220px;
                        height: 45vh;
                        padding: 12px;
                        top: 45%;
                    }
                }
                
                @media (min-width: 1200px) and (max-width: 1400px) {
                    .sensor-panel-right {
                        width: 250px;
                        height: 50vh;
                        padding: 14px;
                        top: 43%;
                    }
                }
                
                @media (max-width: 767px) {
                    .sensor-panel-right {
                        display: none;
                    }
                }
                .sensor-panel-right::-webkit-scrollbar {
                    display: none;
                }
                
                .sensor-panel-right.show {
                    right: 0;
                    animation: slideInRight 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
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
                
                .sensor-panel-left {
                    position: fixed;
                    top: 35%; 
                    left: -300px;
                    width: 300px;
                    height: 70vh;
                    transform: translateY(-50%);
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    box-shadow: 5px 0 20px rgba(0, 0, 0, 0.1);
                    transition: left 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55), top 0.3s ease-out;
                    z-index: 1000;
                    overflow-y: auto;
                    padding: 20px;
                    border-radius: 0 20px 20px 0;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                
                .sensor-panel-left.space-theme {
                    background: linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(15, 15, 15, 0.9) 100%);
                    border: 1px solid rgba(40, 40, 40, 0.3);
                    box-shadow: 5px 0 20px rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(25px);
                    -webkit-backdrop-filter: blur(25px);
                }
                
                @media (min-width: 768px) and (max-width: 1199px) {
                    .sensor-panel-left {
                        width: 220px;
                        height: 45vh;
                        padding: 12px;
                        top: 45%;
                    }
                }
                
                @media (min-width: 1200px) and (max-width: 1400px) {
                    .sensor-panel-left {
                        width: 250px;
                        height: 50vh;
                        padding: 14px;
                        top: 43%;
                    }
                }
                
                @media (max-width: 767px) {
                    .sensor-panel-left {
                        display: none;
                    }
                }
                .sensor-panel-left::-webkit-scrollbar {
                    display: none;
                }
                
                .sensor-panel-left.show {
                    left: 0;
                    animation: slideInLeft 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
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
                
                .sensor-item {
                    background: linear-gradient(145deg, 
                        rgba(255, 255, 255, 0.15) 0%, 
                        rgba(255, 255, 255, 0.05) 50%, 
                        rgba(255, 255, 255, 0.1) 100%);
                    backdrop-filter: blur(15px);
                    -webkit-backdrop-filter: blur(15px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 24px;
                    padding: 20px;
                    margin-bottom: 20px;
                    box-shadow: 
                        0 12px 40px rgba(0, 0, 0, 0.15),
                        0 4px 12px rgba(0, 0, 0, 0.1),
                        inset 0 2px 4px rgba(255, 255, 255, 0.3),
                        inset 0 -1px 2px rgba(0, 0, 0, 0.1),
                        0 0 0 1px rgba(255, 255, 255, 0.2);
                    transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
                    opacity: 0;
                    transform: translateX(0) scale(0.95);
                    animation: slideInFromCenter 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                    position: relative;
                    overflow: hidden;
                }
                
                .sensor-item.space-theme {
                    background: 
                        linear-gradient(145deg, 
                            rgba(120, 120, 120, 0.95) 0%, 
                            rgba(100, 100, 100, 0.9) 25%,
                            rgba(80, 80, 80, 0.85) 50%,
                            rgba(70, 70, 70, 0.9) 75%,
                            rgba(60, 60, 60, 0.95) 100%),
                        repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 2px,
                            rgba(255, 255, 255, 0.03) 2px,
                            rgba(255, 255, 255, 0.03) 4px,
                            transparent 4px,
                            transparent 6px,
                            rgba(0, 0, 0, 0.05) 6px,
                            rgba(0, 0, 0, 0.05) 8px
                        ) !important;
                    border: 1px solid rgba(140, 140, 140, 0.8) !important;
                    box-shadow: 
                        0 12px 40px rgba(0, 0, 0, 0.4),
                        0 4px 12px rgba(0, 0, 0, 0.3),
                        inset 0 2px 4px rgba(180, 180, 180, 0.3),
                        inset 0 -1px 2px rgba(40, 40, 40, 0.5),
                        0 0 0 1px rgba(140, 140, 140, 0.7),
                        0 0 20px rgba(120, 120, 120, 0.3),
                        0 0 40px rgba(100, 100, 100, 0.2) !important;
                }
                
                .sensor-item::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, 
                        transparent, 
                        rgba(255, 255, 255, 0.3), 
                        transparent);
                    transition: left 0.6s ease;
                }
                
                .sensor-item:hover::before {
                    left: 100%;
                }
                
                .sensor-item::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 0;
                    height: 0;
                    background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%);
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    transition: all 0.4s ease;
                    pointer-events: none;
                }
                
                .sensor-item:hover::after {
                    width: 200px;
                    height: 200px;
                    animation: ripple 0.6s ease-out;
                }
                
                @keyframes ripple {
                    0% {
                        width: 0;
                        height: 0;
                        opacity: 1;
                    }
                    100% {
                        width: 200px;
                        height: 200px;
                        opacity: 0;
                    }
                }
                
                .sensor-item:nth-child(1) { animation-delay: 0.1s; }
                .sensor-item:nth-child(2) { animation-delay: 0.15s; }
                .sensor-item:nth-child(3) { animation-delay: 0.2s; }
                .sensor-item:nth-child(4) { animation-delay: 0.25s; }
                .sensor-item:nth-child(5) { animation-delay: 0.3s; }
                .sensor-item:nth-child(6) { animation-delay: 0.35s; }
                .sensor-item:nth-child(7) { animation-delay: 0.4s; }
                .sensor-item:nth-child(8) { animation-delay: 0.45s; }
                .sensor-item:nth-child(9) { animation-delay: 0.5s; }
                .sensor-item:nth-child(10) { animation-delay: 0.55s; }
                .sensor-item:nth-child(11) { animation-delay: 0.6s; }
                .sensor-item:nth-child(12) { animation-delay: 0.65s; }
                .sensor-item:nth-child(13) { animation-delay: 0.7s; }
                .sensor-item:nth-child(14) { animation-delay: 0.75s; }
                .sensor-item:nth-child(15) { animation-delay: 0.8s; }
                
                @keyframes slideInFromCenter {
                    0% {
                        opacity: 0;
                        transform: translateX(0) scale(0.95) rotateY(-10deg);
                    }
                    50% {
                        opacity: 0.8;
                        transform: translateX(0) scale(1.02) rotateY(-5deg);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0) scale(1) rotateY(0deg);
                    }
                }
                
                .sensor-item:hover {
                    transform: translateY(-4px) scale(1.01);
                    box-shadow: 
                        0 20px 45px rgba(0, 0, 0, 0.18),
                        0 6px 15px rgba(0, 0, 0, 0.12),
                        inset 0 3px 6px rgba(255, 255, 255, 0.4),
                        inset 0 -2px 4px rgba(0, 0, 0, 0.1),
                        0 0 0 1px rgba(255, 255, 255, 0.4);
                    border-color: rgba(255, 255, 255, 0.5);
                }
                
                .sensor-item.space-theme:hover {
                    box-shadow: 
                        0 20px 45px rgba(0, 0, 0, 0.4),
                        0 6px 15px rgba(0, 0, 0, 0.3),
                        inset 0 3px 6px rgba(255, 255, 255, 0.9),
                        inset 0 -2px 4px rgba(100, 100, 100, 0.4),
                        0 0 0 1px rgba(220, 220, 220, 1),
                        0 0 40px rgba(220, 220, 220, 0.8),
                        0 0 60px rgba(200, 200, 200, 0.6);
                    border-color: rgba(220, 220, 220, 1);
                }
                
                .sensor-item.active {
                    background: linear-gradient(145deg, 
                        rgba(16, 185, 129, 0.25) 0%, 
                        rgba(34, 197, 94, 0.2) 50%, 
                        rgba(16, 185, 129, 0.25) 100%);
                    border: 1px solid rgba(16, 185, 129, 0.6);
                    box-shadow: 
                        0 8px 25px rgba(0, 0, 0, 0.1),
                        0 3px 8px rgba(0, 0, 0, 0.08),
                        inset 0 2px 4px rgba(255, 255, 255, 0.3),
                        inset 0 -1px 2px rgba(16, 185, 129, 0.1);
                    opacity: 1 !important;
                }
                
                .sensor-item.active.space-theme {
                    background: 
                        linear-gradient(145deg, 
                            rgba(147, 51, 234, 0.4) 0%, 
                            rgba(124, 58, 237, 0.35) 25%,
                            rgba(109, 40, 217, 0.3) 50%,
                            rgba(91, 33, 182, 0.35) 75%,
                            rgba(76, 29, 149, 0.4) 100%),
                        repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 2px,
                            rgba(196, 181, 253, 0.1) 2px,
                            rgba(196, 181, 253, 0.1) 4px,
                            transparent 4px,
                            transparent 6px,
                            rgba(76, 29, 149, 0.1) 6px,
                            rgba(76, 29, 149, 0.1) 8px
                        ) !important;
                    border: 1px solid rgba(147, 51, 234, 0.8) !important;
                    box-shadow: 
                        0 8px 25px rgba(0, 0, 0, 0.4),
                        0 3px 8px rgba(0, 0, 0, 0.3),
                        inset 0 2px 4px rgba(196, 181, 253, 0.4),
                        inset 0 -1px 2px rgba(76, 29, 149, 0.4),
                        0 0 0 1px rgba(147, 51, 234, 0.9),
                        0 0 25px rgba(147, 51, 234, 0.6),
                        0 0 50px rgba(196, 181, 253, 0.4) !important;
                    animation: purpleGlow 2s ease-in-out infinite alternate;
                }
                
                @keyframes purpleGlow {
                    0% {
                        box-shadow: 
                            0 8px 25px rgba(0, 0, 0, 0.4),
                            0 3px 8px rgba(0, 0, 0, 0.3),
                            inset 0 2px 4px rgba(196, 181, 253, 0.4),
                            inset 0 -1px 2px rgba(76, 29, 149, 0.4),
                            0 0 0 1px rgba(147, 51, 234, 0.9),
                            0 0 25px rgba(147, 51, 234, 0.6),
                            0 0 50px rgba(196, 181, 253, 0.4);
                    }
                    100% {
                        box-shadow: 
                            0 8px 25px rgba(0, 0, 0, 0.4),
                            0 3px 8px rgba(0, 0, 0, 0.3),
                            inset 0 2px 4px rgba(196, 181, 253, 0.6),
                            inset 0 -1px 2px rgba(76, 29, 149, 0.5),
                            0 0 0 1px rgba(147, 51, 234, 1),
                            0 0 35px rgba(147, 51, 234, 0.8),
                            0 0 70px rgba(196, 181, 253, 0.6);
                    }
                }
                
                .sensor-item.inactive {
                    background: 
                        linear-gradient(145deg, 
                            rgba(80, 80, 80, 0.3) 0%, 
                            rgba(70, 70, 70, 0.25) 25%,
                            rgba(60, 60, 60, 0.2) 50%,
                            rgba(55, 55, 55, 0.25) 75%,
                            rgba(50, 50, 50, 0.3) 100%),
                        repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 2px,
                            rgba(120, 120, 120, 0.02) 2px,
                            rgba(120, 120, 120, 0.02) 4px,
                            transparent 4px,
                            transparent 6px,
                            rgba(40, 40, 40, 0.03) 6px,
                            rgba(40, 40, 40, 0.03) 8px
                        );
                    border: 1px solid rgba(100, 100, 100, 0.4);
                    color: #6b7280;
                    opacity: 0.8;
                    box-shadow: 
                        0 8px 25px rgba(0, 0, 0, 0.2),
                        0 3px 8px rgba(0, 0, 0, 0.15),
                        inset 0 1px 2px rgba(120, 120, 120, 0.1),
                        inset 0 -1px 2px rgba(40, 40, 40, 0.2);
                }
                
                .sensor-item.inactive .sensor-code {
                    color: #6b7280;
                }
                
                .sensor-item.inactive .sensor-name {
                    color: #6b7280;
                }
                
                .sensor-item.active .sensor-code {
                    color: #059669;
                    font-weight: bold;
                }
                
                .sensor-item.active .sensor-name {
                    color: #047857;
                    font-weight: 600;
                }
                
                .sensor-item.active.space-theme .sensor-code {
                    background: linear-gradient(135deg, #c4b5fd 0%, #a78bfa 50%, #8b5cf6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-shadow: 0 0 15px rgba(196, 181, 253, 0.6);
                }
                
                .sensor-item.active.space-theme .sensor-name {
                    color: #c4b5fd;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 0 10px rgba(196, 181, 253, 0.4);
                }
                
                .sensor-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                
                .sensor-code {
                    font-family: 'Courier New', monospace;
                    font-weight: bold;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 1.1rem;
                    min-width: 50px;
                    text-shadow: 0 0 10px rgba(102, 126, 234, 0.3);
                }
                
                .sensor-item.space-theme .sensor-code {
                    background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 50%, #e5e7eb 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-shadow: 0 0 15px rgba(255, 255, 255, 0.7);
                }
                
                .sensor-name {
                    font-weight: 600;
                    color: #1f2937;
                    font-size: 0.9rem;
                    flex: 1;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
                }
                
                .sensor-item.space-theme .sensor-name {
                    color: #ffffff;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 0 8px rgba(255, 255, 255, 0.5);
                }
                
                .sensor-item:hover .sensor-name {
                    color: #1f2937;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
                }
                
                .sensor-item.space-theme:hover .sensor-name {
                    color: #ffffff;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 0 8px rgba(255, 255, 255, 0.5);
                }

                @media (max-width: 768px) {
                    .tab-navigation {
                        margin: 20px 0 20px 0;
                    }
                }

                @media (min-width: 768px) and (max-width: 1199px) {
                    .sensor-item {
                        padding: 12px;
                        margin-bottom: 12px;
                        border-radius: 16px;
                        height: 48px;
                        min-height: 48px;
                        max-height: 48px;
                    }
                    
                    .sensor-code {
                        font-size: 0.85rem;
                        min-width: 42px;
                    }
                    
                    .sensor-name {
                        font-size: 0.7rem;
                        line-height: 1.2;
                    }
                }
                
                @media (min-width: 1200px) and (max-width: 1400px) {
                    .sensor-item {
                        padding: 16px;
                        margin-bottom: 16px;
                        border-radius: 20px;
                        height: 56px;
                        min-height: 56px;
                        max-height: 56px;
                    }
                    
                    .sensor-code {
                        font-size: 1rem;
                        min-width: 50px;
                    }
                    
                    .sensor-name {
                        font-size: 0.85rem;
                        line-height: 1.3;
                    }
                }

                .tab-button {
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    border: 2px solid transparent;
                    background: #f3f4f6;
                    color: #6b7280;
                    cursor: pointer;
                    font-size: 14px;
                }

                .tab-button.active {
                    background: #3b82f6;
                    color: white;
                    border-color: #2563eb;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }

                .tab-button:hover:not(.active) {
                    background: #e5e7eb;
                    color: #374151;
                }

                .tab-button.space-theme {
                    background: linear-gradient(145deg, 
                        rgba(80, 80, 80, 0.8) 0%, 
                        rgba(70, 70, 70, 0.7) 25%,
                        rgba(60, 60, 60, 0.6) 50%,
                        rgba(55, 55, 55, 0.7) 75%,
                        rgba(50, 50, 50, 0.8) 100%);
                    border: 1px solid rgba(100, 100, 100, 0.6);
                    color: #c4b5fd;
                    box-shadow: 
                        0 4px 12px rgba(0, 0, 0, 0.3),
                        inset 0 1px 2px rgba(120, 120, 120, 0.2),
                        inset 0 -1px 2px rgba(40, 40, 40, 0.3);
                }

                .tab-button.space-theme.active {
                    background: linear-gradient(145deg, 
                        rgba(147, 51, 234, 0.8) 0%, 
                        rgba(124, 58, 237, 0.7) 25%,
                        rgba(109, 40, 217, 0.6) 50%,
                        rgba(91, 33, 182, 0.7) 75%,
                        rgba(76, 29, 149, 0.8) 100%);
                    border: 1px solid rgba(147, 51, 234, 0.8);
                    color: #ffffff;
                    box-shadow: 
                        0 4px 12px rgba(0, 0, 0, 0.4),
                        0 0 20px rgba(147, 51, 234, 0.3),
                        inset 0 1px 2px rgba(196, 181, 253, 0.3),
                        inset 0 -1px 2px rgba(76, 29, 149, 0.4);
                }

                .tab-button.space-theme:hover:not(.active) {
                    background: linear-gradient(145deg, 
                        rgba(100, 100, 100, 0.9) 0%, 
                        rgba(90, 90, 90, 0.8) 25%,
                        rgba(80, 80, 80, 0.7) 50%,
                        rgba(75, 75, 75, 0.8) 75%,
                        rgba(70, 70, 70, 0.9) 100%);
                    color: #e0e7ff;
                    box-shadow: 
                        0 4px 12px rgba(0, 0, 0, 0.4),
                        inset 0 1px 2px rgba(140, 140, 140, 0.3),
                        inset 0 -1px 2px rgba(50, 50, 50, 0.4);
                }

                .tab-content {
                    animation: fadeIn 0.3s ease-in-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .turn-table-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    grid-template-rows: 1fr 1fr 1fr;
                    gap: 20px;
                    max-width: 300px;
                    margin: 0 auto;
                }

                @media (max-width: 768px) {
                    .turn-table-grid {
                        gap: 10px;
                        max-width: 250px;
                    }
                }

                .turn-table-btn {
                    min-width: 80px;
                    padding: 1em 1.5em;
                    font-size: 0.75rem;
                }

                @media (min-width: 768px) {
                    .turn-table-btn {
                        min-width: 100px;
                        padding: 1.25em 2em;
                        font-size: 0.875rem;
                    }
                }

                .turn-table-btn.up {
                    grid-column: 2;
                    grid-row: 1;
                }

                .turn-table-btn.down {
                    grid-column: 2;
                    grid-row: 3;
                }

                .turn-table-btn.left {
                    grid-column: 1;
                    grid-row: 2;
                }

                .turn-table-btn.right {
                    grid-column: 3;
                    grid-row: 2;
                }

                .page1-layout {
                    display: grid;
                    grid-template-rows: 1fr 1fr;
                    gap: 40px;
                    justify-content: center;
                    align-items: center;
                    max-width: 600px;
                    margin: 0 auto;
                }

                @media (min-width: 768px) {
                    .page1-layout {
                        gap: 50px;
                    }
                }

                @media (max-width: 768px) {
                    .page1-layout {
                        display: flex;
                        flex-direction: column;
                        gap: 15px;
                        max-width: none;
                    }
                }

                .turn-table-section {
                    flex: 0 0 auto;
                    min-width: 200px;
                    display: flex;
                    justify-content: center;
                }

                .door-section {
                    flex: 0 0 auto;
                    min-width: 200px;
                    display: flex;
                    justify-content: center;
                }

                .door-vertical {
                    display: flex;
                    flex-direction: row;
                    gap: 40px;
                    align-items: center;
                }

                @media (max-width: 768px) {
                    .door-vertical {
                        flex-direction: row;
                        gap: 20px;
                    }
                }

                .door-btn {
                    min-width: 120px;
                    padding: 1em 2em;
                }

                @media (min-width: 768px) {
                    .door-btn {
                        min-width: 140px;
                        padding: 1.25em 2.5em;
                        font-size: 0.875rem;
                    }
                }

                @media (max-width: 768px) {
                    .page1-layout {
                        flex-direction: column;
                        gap: 30px;
                    }
                }

                @media (min-width: 768px) and (max-width: 1199px) {
                    .page1-first-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        max-width: 400px;
                    }

                    .page1-second-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        max-width: 400px;
                    }

                    .page1-second-row button:first-child {
                        grid-column: 1 / 3;
                        grid-row: 1;
                        justify-self: center;
                        max-width: 50%;
                    }

                    .page1-second-row button:nth-child(2) {
                        grid-column: 1;
                        grid-row: 2;
                    }

                    .page1-second-row button:nth-child(3) {
                        grid-column: 2;
                        grid-row: 2;
                    }

                    .page2-first-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        max-width: 400px;
                        margin: 0 auto;
                    }

                    .page2-second-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        max-width: 400px;
                        margin: 0 auto;
                    }

                    .page2-third-row button {
                        min-width: 120px !important;
                        padding: 14px 20px !important;
                        font-size: 0.8rem !important;
                    }

                    .page2-fourth-row button {
                        min-width: 110px !important;
                        padding: 14px 18px !important;
                        font-size: 0.8rem !important;
                    }

                    .page2-fifth-row button {
                        min-width: 120px !important;
                        padding: 14px 20px !important;
                        font-size: 0.8rem !important;
                    }

                    .page2-slider-init .slider-init-spacer {
                        display: none;
                    }

                    .page2-slider-init button {
                        flex: 0 0 auto !important;
                    }
                }

                @media (max-width: 767px) {
                    .page1-first-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                        max-width: 100%;
                    }

                    .page1-second-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                        max-width: 100%;
                    }

                    .page1-second-row button:first-child {
                        grid-column: 1 / 3;
                        grid-row: 1;
                        justify-self: center;
                        max-width: 50%;
                    }

                    .page1-second-row button:nth-child(2) {
                        grid-column: 1;
                        grid-row: 2;
                    }

                    .page1-second-row button:nth-child(3) {
                        grid-column: 2;
                        grid-row: 2;
                    }

                    .page2-first-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                        max-width: 100%;
                    }

                    .page2-second-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                        max-width: 100%;
                    }

                    .page2-slider-init .slider-init-spacer {
                        display: none;
                    }

                    .page2-slider-init button {
                        flex: 0 0 auto !important;
                    }
                }

                @media (max-width: 767px) {
                    .flex.flex-col.items-center.gap-20 {
                        gap: 45px;
                    }

                    .page2-cross-layout {
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr;
                        grid-template-rows: auto auto auto;
                        gap: 25px;
                        max-width: 360px;
                        margin: 0 auto;
                    }

                    .page2-third-row {
                        grid-column: 1 / 4;
                        grid-row: 1;
                        display: flex;
                        justify-content: center;
                    }

                    .page2-fourth-row {
                        grid-column: 1 / 4;
                        grid-row: 2;
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr;
                        gap: 12px;
                    }

                    .page2-fifth-row {
                        grid-column: 1 / 4;
                        grid-row: 3;
                        display: flex;
                        justify-content: center;
                    }

                    .page2-third-row button {
                        min-width: 100px !important;
                        padding: 12px 18px !important;
                        font-size: 0.75rem !important;
                    }

                    .page2-fourth-row button {
                        min-width: 0 !important;
                        padding: 12px 10px !important;
                        font-size: 0.7rem !important;
                    }

                    .page2-fourth-row button:first-child,
                    .page2-fourth-row button:last-child {
                        padding: 14px 16px !important;
                        font-size: 0.75rem !important;
                    }

                    .page2-fifth-row button {
                        min-width: 100px !important;
                        padding: 12px 18px !important;
                        font-size: 0.75rem !important;
                    }

                    .page1-stopper-row button {
                        font-size: 0.7rem !important;
                        padding: 12px 16px !important;
                    }

                    .page1-fourth-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                        max-width: 100%;
                    }

                    .tab-navigation {
                        display: grid !important;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 10px;
                        margin-top: 70px !important;
                    }

                    .tab-navigation button:first-child {
                        grid-column: 1 / 4;
                    }
                }

                /* LED 상태 표시 카드 스타일 */
                .led-status-card {
                    padding: 10px 16px;
                    border-radius: 4px;
                    background: #E0F2FE;
                    border: 1px solid #7DD3FC;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 8px;
                    position: relative;
                    min-height: 50px;
                }


                .led-status-card.space-theme {
                    background: linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%);
                    border: 2px solid #444;
                    box-shadow: 
                        inset 0 1px 0 rgba(255, 255, 255, 0.1),
                        inset 0 -1px 0 rgba(0, 0, 0, 0.8),
                        0 0 0 1px rgba(0, 0, 0, 0.5);
                }

                .led-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #374151;
                    text-align: center;
                }

                .led-status-card.space-theme .led-label {
                    color: #ffffff;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
                    font-weight: 500;
                    letter-spacing: 0.5px;
                    position: relative;
                    z-index: 1;
                    font-size: 0.9rem;
                }

                .led-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 0;
                    transition: all 0.3s ease;
                    border: 0;
                    position: relative;
                    z-index: 1;
                }

                .led-indicator.on {
                    background: #3B82F6;
                    box-shadow: 
                        0 0 4px rgba(59, 130, 246, 0.8),
                        0 0 8px rgba(59, 130, 246, 0.5);
                }

                .led-indicator.off {
                    background: #4b5563;
                    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.5);
                }

                .led-status-card.space-theme .led-indicator.on {
                    background: #20B8D1;
                    box-shadow: 
                        0 0 8px rgba(32, 184, 209, 1),
                        0 0 16px rgba(32, 184, 209, 0.8),
                        0 0 24px rgba(32, 184, 209, 0.4);
                }

                .led-status-card.space-theme .led-indicator.off {
                    background: #0e4a58;
                    box-shadow: 
                        inset 0 1px 2px rgba(0, 0, 0, 0.8);
                }


                .led-address {
                    font-size: 0.65rem;
                    font-family: 'Courier New', monospace;
                    color: #6b7280;
                    opacity: 0.7;
                    position: relative;
                    z-index: 1;
                }

                .led-status-card.space-theme .led-address {
                    color: #888;
                    font-weight: 400;
                    opacity: 0.8;
                    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.8);
                    font-size: 0.7rem;
                }

                /* 데이터 값 표시 카드 스타일 */
                .data-value-card {
                    padding: 10px 16px;
                    border-radius: 4px;
                    background: #E0F2FE;
                    border: 1px solid #7DD3FC;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    position: relative;
                    min-height: 50px;
                }

                .data-value-card.space-theme {
                    background: linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%);
                    border: 2px solid #333;
                    box-shadow: 
                        inset 0 1px 0 rgba(255, 255, 255, 0.05),
                        inset 0 -1px 0 rgba(0, 0, 0, 0.9),
                        0 0 0 1px rgba(0, 0, 0, 0.6);
                }

                .data-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #374151;
                    text-align: left;
                    flex-shrink: 0;
                }

                .data-value-card.space-theme .data-label {
                    color: #ffffff;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
                    font-weight: 500;
                    letter-spacing: 0.5px;
                    font-size: 0.9rem;
                }

                .data-value {
                    font-size: 0.95rem;
                    font-weight: 700;
                    font-family: 'Courier New', monospace;
                    color: #1f2937;
                    flex: 1;
                    text-align: center;
                }

                .data-value-card.space-theme .data-value {
                    color: #20B8D1;
                    text-shadow: 0 0 8px rgba(32, 184, 209, 0.6);
                    font-weight: 600;
                    font-size: 1rem;
                }

                .data-address {
                    font-size: 0.65rem;
                    font-family: 'Courier New', monospace;
                    color: #6b7280;
                    opacity: 0.7;
                    flex-shrink: 0;
                }

                .data-value-card.space-theme .data-address {
                    color: #888;
                    font-weight: 400;
                    opacity: 0.8;
                    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.8);
                    font-size: 0.7rem;
                }
            `}</style>

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