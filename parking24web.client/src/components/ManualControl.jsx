import React, { useState, useEffect } from 'react';
// config import - 빌드별로 변경 (sokcho1Config 또는 sokcho2Config)
import siteConfig from '../../config/sokcho1Config.js';
// SignalR 서비스 import
import signalRService from '../Services/signalrService.js';

const ManualControl = ({ isPLCConnected, isAuthenticated, sensorData, isMobileMenuOpen }) => {
    const [_activeCommand, setActiveCommand] = useState(null);
    const [_isEmergencyMode, setIsEmergencyMode] = useState(false);
    const [activeTab, setActiveTab] = useState('page1');
    const [showSensors, setShowSensors] = useState(true);
    const [sensorStates, setSensorStates] = useState({});


    const currentConfig = siteConfig;

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
        Object.entries(currentConfig.sensorMapping).forEach(([ , configData]) => {
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
                className={`sensor-item ${isActive ? 'active' : 'inactive'}`}
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

    // 간단한 명령 실행 헬퍼 (UI 피드백용)
    const executeCommand = async (commandName, signalRMethod) => {
        if (!isPLCConnected || !isAuthenticated) return;

        try {
            setActiveCommand(commandName);
            await signalRMethod();
            console.log(`명령 실행: ${commandName}`);

            // 명령 실행 후 1초 뒤 활성 상태 해제
            setTimeout(() => setActiveCommand(null), 1000);
        } catch (error) {
            console.error(`명령 실행 실패 (${commandName}):`, error);
            setActiveCommand(null);
        }
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

    return (
        <>
            <style jsx>{`
                @import url("https://fonts.googleapis.com/css?family=Rubik:700&display=swap");
                
                .learn-more {
                    font-weight: 600;
                    color: #1e3a8a;
                    text-transform: uppercase;
                    padding: 20px 32px;
                    background: #dbeafe;
                    border: 1px solid #3b82f6;
                    border-radius: 24px;
                    transform-style: preserve-3d;
                    transition: transform 150ms cubic-bezier(0, 0, 0.58, 1), background 150ms cubic-bezier(0, 0, 0.58, 1);
                    position: relative;
                    display: inline-block;
                    cursor: pointer;
                    outline: none;
                    vertical-align: middle;
                    text-decoration: none;
                    font-size: 0.875rem;
                    font-family: inherit;
                    min-width: 120px;
                }
                
                @media (min-width: 768px) {
                    .learn-more {
                        min-width: 160px;
                        padding: 24px 48px;
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
                
                .learn-more:hover {
                    background: #bfdbfe;
                    transform: translate(0, 0.25em);
                }
                
                .learn-more:hover::before {
                    box-shadow: 0 0 0 1px #3b82f6, 0 0.5em 0 0 #bfdbfe;
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
                    color: #374151;
                    background: #f3f4f6;
                    border: 1px solid #9ca3af;
                    min-width: 120px;
                    text-align: center;
                    font-size: 0.75rem;
                }
                
                .common-button::before {
                    background: #e5e7eb;
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

                .common-buttons-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 16px;
                    justify-content: center;
                    max-width: none;
                }

                @media (min-width: 768px) and (max-width: 1023px) {
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
                    top: 55%;
                    right: -300px;
                    width: 300px;
                    height: 85vh;
                    transform: translateY(-50%);
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    box-shadow: -5px 0 20px rgba(0, 0, 0, 0.1);
                    transition: right 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    z-index: 1000;
                    overflow-y: auto;
                    padding: 20px;
                    border-radius: 20px 0 0 20px;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                
                @media (min-width: 768px) and (max-width: 1024px) {
                    .sensor-panel-right {
                        width: 200px;
                        height: 60vh;
                        padding: 12px;
                        top: 63%;
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
                    top: 55%; 
                    left: -300px;
                    width: 300px;
                    height: 85vh;
                    transform: translateY(-50%);
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    box-shadow: 5px 0 20px rgba(0, 0, 0, 0.1);
                    transition: left 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    z-index: 1000;
                    overflow-y: auto;
                    padding: 20px;
                    border-radius: 0 20px 20px 0;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                
                @media (min-width: 768px) and (max-width: 1024px) {
                    .sensor-panel-left {
                        width: 200px;
                        height: 60vh;
                        padding: 12px;
                        top: 63%;
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
                
                .sensor-item.inactive {
                    background: linear-gradient(145deg, 
                        rgba(107, 114, 128, 0.15) 0%, 
                        rgba(156, 163, 175, 0.08) 50%, 
                        rgba(107, 114, 128, 0.12) 100%);
                    border: 1px solid rgba(156, 163, 175, 0.4);
                    color: #6b7280;
                    opacity: 0.8;
                    box-shadow: 
                        0 8px 25px rgba(0, 0, 0, 0.1),
                        0 3px 8px rgba(0, 0, 0, 0.08),
                        inset 0 1px 2px rgba(255, 255, 255, 0.2),
                        inset 0 -1px 2px rgba(0, 0, 0, 0.05);
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
                
                .sensor-name {
                    font-weight: 600;
                    color: #1f2937;
                    font-size: 0.9rem;
                    flex: 1;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
                }
                
                .sensor-item:hover .sensor-name {
                    color: #111827;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
                }

                @media (max-width: 768px) {
                    .tab-navigation {
                        margin: 20px 0 20px 0;
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
            `}</style>

            <div className="bg-white rounded-2xl shadow-lg p-3 md:p-4 overflow-hidden border-2 border-gray-300" style={{
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
                        <div className="bg-blue-100 border border-blue-300 px-3 py-2 rounded-2xl shadow-md">
                            <span className="text-blue-700 font-semibold text-sm">📡 {currentConfig.siteInfo.name} {currentConfig.siteInfo.unitNumber}</span>
                        </div>
                    </div>
                </div>

                {/* 엔코더값/카운터값 표시 - PC에서는 더 넓게, 모바일/태블릿에서는 작게 */}
                <div className="mb-6 md:mb-8">
                    <div className="grid grid-cols-2 gap-4 max-w-md lg:max-w-2xl mx-auto">
                        <div className="p-3 rounded-lg transition-all duration-300 ease-out transform relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                boxShadow: '0 3px 12px 0 rgba(31, 38, 135, 0.18)'
                            }}>
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/6 to-blue-500/6 rounded-lg"></div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 relative z-10">엔코더값</label>
                            <div className="text-gray-700 text-center rounded-2xl px-2 sm:px-3 py-2 sm:py-3 text-sm sm:text-lg md:text-xl font-bold relative z-10" style={{
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)',
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                boxShadow: '0 1px 6px 0 rgba(31, 38, 135, 0.12)'
                            }}>
                                {sensorData?.rawData?.[240] || 0}
                            </div>
                        </div>

                        <div className="p-3 rounded-lg transition-all duration-300 ease-out transform relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                boxShadow: '0 3px 12px 0 rgba(31, 38, 135, 0.18)'
                            }}>
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/6 to-blue-500/6 rounded-lg"></div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 relative z-10">카운터값</label>
                            <div className="text-gray-700 text-center rounded-2xl px-2 sm:px-3 py-2 sm:py-3 text-sm sm:text-lg md:text-xl font-bold relative z-10" style={{
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)',
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                boxShadow: '0 1px 6px 0 rgba(31, 38, 135, 0.12)'
                            }}>
                                {sensorData?.rawData?.[200] || 0}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 공용 버튼들 - 홀드 방식으로 수정 */}
                <div className="mb-12 md:mb-20">
                    <div className="flex flex-wrap gap-4 justify-center common-buttons-grid">
                        <button
                            onMouseDown={handleErrorReset}
                            onMouseUp={() => signalRService.errorReset(0)}
                            onMouseLeave={() => signalRService.errorReset(0)}
                            onTouchStart={handleErrorReset}
                            onTouchEnd={() => signalRService.errorReset(0)}
                            disabled={isDisabled}
                            className={`learn-more common-button ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            에러 리셋
                        </button>
                        <button
                            onMouseDown={handleRemoteControl}
                            onMouseUp={() => signalRService.remoteControl(0)}
                            onMouseLeave={() => signalRService.remoteControl(0)}
                            onTouchStart={handleRemoteControl}
                            onTouchEnd={() => signalRService.remoteControl(0)}
                            disabled={isDisabled}
                            className={`learn-more common-button ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            원격 제어
                        </button>
                        <button
                            onMouseDown={handleHomeReturn}
                            onMouseUp={() => signalRService.homeReturn(0)}
                            onMouseLeave={() => signalRService.homeReturn(0)}
                            onTouchStart={handleHomeReturn}
                            onTouchEnd={() => signalRService.homeReturn(0)}
                            disabled={isDisabled}
                            className={`learn-more common-button ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            홈 복귀
                        </button>
                        <button
                            onMouseDown={handlePaletteChange}
                            onMouseUp={() => signalRService.paletteChange(0)}
                            onMouseLeave={() => signalRService.paletteChange(0)}
                            onTouchStart={handlePaletteChange}
                            onTouchEnd={() => signalRService.paletteChange(0)}
                            disabled={isDisabled}
                            className={`learn-more common-button ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            파레트 교체
                        </button>
                        <button
                            onMouseDown={handleEmergencyStop}
                            onMouseUp={() => signalRService.emergencyStop(0)}
                            onMouseLeave={() => signalRService.emergencyStop(0)}
                            onTouchStart={handleEmergencyStop}
                            onTouchEnd={() => signalRService.emergencyStop(0)}
                            disabled={isDisabled}
                            className={`learn-more emergency-button ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            비상정지
                        </button>
                    </div>
                </div>

                {/* 탭 컨텐츠 - 간단한 핸들러들로 수정 */}
                <div className="tab-content">
                    {/* 1페이지: 도어/턴테이블 */}
                    {activeTab === 'page1' && (
                        <div className="page1-layout">
                            {/* 턴테이블 제어 */}
                            <div className="turn-table-section">
                                <div className="door-vertical">
                                    <button
                                        onMouseDown={handleTurnLeft}
                                        onMouseUp={() => signalRService.turnLeft(0)}
                                        onMouseLeave={() => signalRService.turnLeft(0)}
                                        onTouchStart={handleTurnLeft}
                                        onTouchEnd={() => signalRService.turnLeft(0)}
                                        disabled={isDisabled}
                                        className={`learn-more ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        좌회전
                                    </button>
                                    <button
                                        onMouseDown={handleTurnRight}
                                        onMouseUp={() => signalRService.turnRight(0)}
                                        onMouseLeave={() => signalRService.turnRight(0)}
                                        onTouchStart={handleTurnRight}
                                        onTouchEnd={() => signalRService.turnRight(0)}
                                        disabled={isDisabled}
                                        className={`learn-more ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        우회전
                                    </button>
                                </div>
                            </div>

                            {/* 도어 제어 */}
                            <div className="door-section">
                                <div className="door-vertical">
                                    <button
                                        onMouseDown={handleDoorOpen}
                                        onMouseUp={() => signalRService.doorOpen(0)}
                                        onMouseLeave={() => signalRService.doorOpen(0)}
                                        onTouchStart={handleDoorOpen}
                                        onTouchEnd={() => signalRService.doorOpen(0)}
                                        disabled={isDisabled}
                                        className={`learn-more ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        도어 열림
                                    </button>
                                    <button
                                        onMouseDown={handleDoorClose}
                                        onMouseUp={() => signalRService.doorClose(0)}
                                        onMouseLeave={() => signalRService.doorClose(0)}
                                        onTouchStart={handleDoorClose}
                                        onTouchEnd={() => signalRService.doorClose(0)}
                                        disabled={isDisabled}
                                        className={`learn-more ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        도어 닫힘
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2페이지: 승강 제어 */}
                    {activeTab === 'page2' && (
                        <div className="space-y-6">
                            <div>
                                <div className="flex flex-col gap-6 md:gap-8 justify-center items-center">
                                    <button
                                        onMouseDown={handleLiftUp}
                                        onMouseUp={() => signalRService.liftUp(0)}
                                        onMouseLeave={() => signalRService.liftUp(0)}
                                        onTouchStart={handleLiftUp}
                                        onTouchEnd={() => signalRService.liftUp(0)}
                                        disabled={isDisabled}
                                        className={`learn-more ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        상승
                                    </button>

                                    <button
                                        onMouseDown={handleLiftDown}
                                        onMouseUp={() => signalRService.liftDown(0)}
                                        onMouseLeave={() => signalRService.liftDown(0)}
                                        onTouchStart={handleLiftDown}
                                        onTouchEnd={() => signalRService.liftDown(0)}
                                        disabled={isDisabled}
                                        className={`learn-more ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        하강
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3페이지: 횡행/락킹 */}
                    {activeTab === 'page3' && (
                        <div className="page1-layout">
                            {/* 횡행 제어 */}
                            <div className="turn-table-section">
                                <div className="door-vertical">
                                    <button
                                        onMouseDown={handleMoveLeft}
                                        onMouseUp={() => signalRService.moveLeft(0)}
                                        onMouseLeave={() => signalRService.moveLeft(0)}
                                        onTouchStart={handleMoveLeft}
                                        onTouchEnd={() => signalRService.moveLeft(0)}
                                        disabled={isDisabled}
                                        className={`learn-more ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        좌행
                                    </button>
                                    <button
                                        onMouseDown={handleMoveRight}
                                        onMouseUp={() => signalRService.moveRight(0)}
                                        onMouseLeave={() => signalRService.moveRight(0)}
                                        onTouchStart={handleMoveRight}
                                        onTouchEnd={() => signalRService.moveRight(0)}
                                        disabled={isDisabled}
                                        className={`learn-more ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        우행
                                    </button>
                                </div>
                            </div>

                            {/* 락킹 제어 */}
                            <div className="door-section">
                                <div className="door-vertical">
                                    <button
                                        onMouseDown={handleLockingOn}
                                        onMouseUp={() => signalRService.lockingOn(0)}
                                        onMouseLeave={() => signalRService.lockingOn(0)}
                                        onTouchStart={handleLockingOn}
                                        onTouchEnd={() => signalRService.lockingOn(0)}
                                        disabled={isDisabled}
                                        className={`learn-more ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        락킹 잠김
                                    </button>
                                    <button
                                        onMouseDown={handleLockingOff}
                                        onMouseUp={() => signalRService.lockingOff(0)}
                                        onMouseLeave={() => signalRService.lockingOff(0)}
                                        onTouchStart={handleLockingOff}
                                        onTouchEnd={() => signalRService.lockingOff(0)}
                                        disabled={isDisabled}
                                        className={`learn-more ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        락킹 해제
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 탭 네비게이션 */}
                <div className="tab-navigation" style={{ marginTop: window.innerWidth <= 768 ? '40px' : '120px' }}>
                    <button
                        onClick={() => { setActiveTab('page1'); setShowSensors(true); }}
                        className={`tab-button ${activeTab === 'page1' ? 'active' : ''}`}
                    >
                        도어/턴테이블
                    </button>
                    <button
                        onClick={() => { setActiveTab('page2'); setShowSensors(true); }}
                        className={`tab-button ${activeTab === 'page2' ? 'active' : ''}`}
                    >
                        승강 제어
                    </button>
                    <button
                        onClick={() => { setActiveTab('page3'); setShowSensors(true); }}
                        className={`tab-button ${activeTab === 'page3' ? 'active' : ''}`}
                    >
                        횡행/락킹
                    </button>
                </div>
            </div>

            {/* 좌측 센서 패널 - config 기반 동적 렌더링 */}
            {showSensors && (
                <div className="sensor-panel-left show">
                    <div className="mb-4 text-center">
                        <h3 className="text-sm font-bold text-gray-600">입력 센서</h3>
                    </div>
                    {renderLeftSensorPanel()}
                </div>
            )}

            {/* 우측 센서 패널 - config 기반 동적 렌더링 */}
            {showSensors && (
                <div className="sensor-panel-right show">
                    <div className="mb-4 text-center">
                        <h3 className="text-sm font-bold text-gray-600">출력 센서</h3>
                    </div>
                    {renderRightSensorPanel()}
                </div>
            )}
        </>
    );
};

export default ManualControl;