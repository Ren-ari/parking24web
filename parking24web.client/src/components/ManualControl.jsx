import React, { useState, useEffect } from 'react';
// 속초 1호기 config import (센서 표시용)
import sokcho1Config from '../../config/sokcho1Config.js';
// SignalR 서비스 import
import signalRService from '../Services/signalrService.js';
import { useTheme } from '../contexts/ThemeContext';

const ManualControl = ({ isPLCConnected, isAuthenticated, sensorData, isMobileMenuOpen }) => {
    const { theme, isSpaceTheme, isDarkTheme, isOceanTheme } = useTheme();
    const [activeCommand, setActiveCommand] = useState(null);
    const [isEmergencyMode, setIsEmergencyMode] = useState(false);
    const [activeTab, setActiveTab] = useState('page1');
    const [showSensors, setShowSensors] = useState(true);
    
    // 태블릿 모드에서 햄버거 메뉴가 열리면 센서 패널 숨기기
    useEffect(() => {
        if (isMobileMenuOpen !== undefined) {
            setShowSensors(!isMobileMenuOpen);
        }
    }, [isMobileMenuOpen]);
    const [sensorStates, setSensorStates] = useState({});

    // 속초 1호기 센서 상태 업데이트 (C060~C072 비트 구조)
    const updateSensorStates = () => {
        if (!sensorData || !sensorData.rawData) return;

        const newStates = {};

        // 속초 config의 센서 매핑을 기반으로 센서 상태 업데이트
        Object.entries(sokcho1Config.sensorMapping).forEach(([configKey, configData]) => {
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

    // sensorData가 변경될 때마다 센서 상태 업데이트
    useEffect(() => {
        updateSensorStates();
    }, [sensorData]);

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

    // 테마에 따른 카드 배경 스타일
    const getCardBackgroundStyle = () => {
        switch (theme) {
            case 'space':
                return {
                    background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)', // 보라색 계열
                    border: '1px solid rgba(147, 51, 234, 0.2)',
                    boxShadow: '0 4px 16px 0 rgba(147, 51, 234, 0.1)'
                };
            case 'dark':
                return {
                    background: 'linear-gradient(135deg, rgba(75, 85, 99, 0.15) 0%, rgba(55, 65, 81, 0.08) 100%)', // 회색 계열
                    border: '1px solid rgba(75, 85, 99, 0.2)',
                    boxShadow: '0 4px 16px 0 rgba(75, 85, 99, 0.1)'
                };
            case 'ocean':
                return {
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(29, 78, 216, 0.08) 100%)', // 파란색 계열
                    border: '1px solid rgba(37, 99, 235, 0.2)',
                    boxShadow: '0 4px 16px 0 rgba(37, 99, 235, 0.1)'
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

                .learn-more.space-theme {
                    color: #f3e8ff;
                    background: #6b46c1;
                    border: 1px solid #5b21b6;
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
                
                .sensor-panel-right.space-theme {
                    background: linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(15, 15, 15, 0.9) 100%);
                    border: 1px solid rgba(40, 40, 40, 0.3);
                    box-shadow: -5px 0 20px rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(25px);
                    -webkit-backdrop-filter: blur(25px);
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
                
                .sensor-panel-left.space-theme {
                    background: linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(15, 15, 15, 0.9) 100%);
                    border: 1px solid rgba(40, 40, 40, 0.3);
                    box-shadow: 5px 0 20px rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(25px);
                    -webkit-backdrop-filter: blur(25px);
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

                {/* 엔코더값/카운터값 표시 - PC에서는 더 넓게, 모바일/태블릿에서는 작게 */}
                <div className="mb-6 md:mb-8">
                    <div className="grid grid-cols-2 gap-4 max-w-md lg:max-w-2xl mx-auto">
                        <div className={`p-2 sm:p-3 rounded-2xl transition-all duration-700 ease-out transform relative overflow-hidden`}
                            style={{
                                backdropFilter: 'blur(25px)',
                                WebkitBackdropFilter: 'blur(25px)',
                                ...getCardBackgroundStyle()
                            }}>
                            <div className={`absolute inset-0 rounded-2xl ${theme === 'space' ? 'bg-gradient-to-br from-purple-500/8 to-purple-600/8' : theme === 'dark' ? 'bg-gradient-to-br from-gray-500/8 to-gray-600/8' : theme === 'ocean' ? 'bg-gradient-to-br from-blue-500/8 to-cyan-500/8' : 'bg-gradient-to-br from-blue-500/8 to-indigo-500/8'}`}></div>
                            <label className={`block text-xs font-medium mb-1 relative z-10 ${getCardLabelColorClass()}`}>엔코더값</label>
                            <div className={`rounded-2xl px-2 sm:px-3 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10 ${getCardValueColorClass()}`} style={{
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                boxShadow: '0 2px 8px 0 rgba(31, 38, 135, 0.15)'
                            }}>
                                {sensorData?.rawData?.[240] || 0}
                            </div>
                        </div>

                        <div className={`p-2 sm:p-3 rounded-2xl transition-all duration-700 ease-out transform relative overflow-hidden`}
                            style={{
                                backdropFilter: 'blur(25px)',
                                WebkitBackdropFilter: 'blur(25px)',
                                ...getCardBackgroundStyle()
                            }}>
                            <div className={`absolute inset-0 rounded-2xl ${theme === 'space' ? 'bg-gradient-to-br from-purple-500/8 to-purple-600/8' : theme === 'dark' ? 'bg-gradient-to-br from-gray-500/8 to-gray-600/8' : theme === 'ocean' ? 'bg-gradient-to-br from-blue-500/8 to-cyan-500/8' : 'bg-gradient-to-br from-blue-500/8 to-indigo-500/8'}`}></div>
                            <label className={`block text-xs font-medium mb-1 relative z-10 ${getCardLabelColorClass()}`}>카운터값</label>
                            <div className={`rounded-2xl px-2 sm:px-3 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10 ${getCardValueColorClass()}`} style={{
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                boxShadow: '0 2px 8px 0 rgba(31, 38, 135, 0.15)'
                            }}>
                                {sensorData?.rawData?.[200] || 0}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 공용 버튼들 - 간단한 SignalR 호출 */}
                <div className="mb-12 md:mb-20">
                    <div className="flex flex-wrap gap-4 justify-center common-buttons-grid">
                        <button
                            onClick={handleErrorReset}
                            disabled={isDisabled}
                            className={`learn-more common-button ${theme === 'space' ? 'space-theme' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            에러 리셋
                        </button>
                        <button
                            onClick={handleRemoteControl}
                            disabled={isDisabled}
                            className={`learn-more common-button ${theme === 'space' ? 'space-theme' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            원격 제어
                        </button>
                        <button
                            onClick={handleHomeReturn}
                            disabled={isDisabled}
                            className={`learn-more common-button ${theme === 'space' ? 'space-theme' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            홈 복귀
                        </button>
                        <button
                            onClick={handlePaletteChange}
                            disabled={isDisabled}
                            className={`learn-more common-button ${theme === 'space' ? 'space-theme' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            파레트 교체
                        </button>
                        <button
                            onClick={handleEmergencyStop}
                            disabled={isDisabled}
                            className={`learn-more emergency-button ${theme === 'space' ? 'space-theme' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                        disabled={isDisabled}
                                        className={`learn-more ${theme === 'space' ? 'space-theme' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        좌회전
                                    </button>
                                    <button
                                        onMouseDown={handleTurnRight}
                                        disabled={isDisabled}
                                        className={`learn-more ${theme === 'space' ? 'space-theme' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                        disabled={isDisabled}
                                        className={`learn-more ${theme === 'space' ? 'space-theme' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        도어 열림
                                    </button>
                                    <button
                                        onMouseDown={handleDoorClose}
                                        disabled={isDisabled}
                                        className={`learn-more ${theme === 'space' ? 'space-theme' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                        className={`learn-more ${theme === 'space' ? 'space-theme' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                        className={`learn-more ${theme === 'space' ? 'space-theme' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                        className={`learn-more ${theme === 'space' ? 'space-theme' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                        className={`learn-more ${theme === 'space' ? 'space-theme' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                        disabled={isDisabled}
                                        className={`learn-more ${theme === 'space' ? 'space-theme' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        락킹 잠김
                                    </button>
                                    <button
                                        onMouseDown={handleLockingOff}
                                        disabled={isDisabled}
                                        className={`learn-more ${theme === 'space' ? 'space-theme' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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

            {/* 좌측 센서 패널 - 속초 센서 표시 (기존과 동일) */}
            {showSensors && (
                <div className={`sensor-panel-left show ${theme === 'space' ? 'space-theme' : ''}`}>
                    {activeTab === 'page1' && (
                        <div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P102_OP도어열림SW') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P102_OP도어열림SW')}</div>
                                <div className="sensor-name">도어열림SW</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P103_OP도어닫힘SW') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P103_OP도어닫힘SW')}</div>
                                <div className="sensor-name">도어닫힘SW</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P109_도어잠센서') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P109_도어잠센서')}</div>
                                <div className="sensor-name">도어잠센서</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P10A_도어열림확인') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P10A_도어열림확인')}</div>
                                <div className="sensor-name">도어열림확인</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P10B_도어닫힘확인') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P10B_도어닫힘확인')}</div>
                                <div className="sensor-name">도어닫힘확인</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P134_턴0도확인') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P134_턴0도확인')}</div>
                                <div className="sensor-name">턴 0도 확인</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P135_턴180확인') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P135_턴180확인')}</div>
                                <div className="sensor-name">턴 180도 확인</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P137_턴좌정지') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P137_턴좌정지')}</div>
                                <div className="sensor-name">턴 좌정지</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P138_턴우정지') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P138_턴우정지')}</div>
                                <div className="sensor-name">턴 우정지</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P146_턴잠김') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P146_턴잠김')}</div>
                                <div className="sensor-name">턴 잠김</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P147_턴해제') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P147_턴해제')}</div>
                                <div className="sensor-name">턴 해제</div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'page2' && (
                        <div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P133_홈위치') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P133_홈위치')}</div>
                                <div className="sensor-name">홈 위치</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P148_레벨상') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P148_레벨상')}</div>
                                <div className="sensor-name">레벨 상</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P149_레벨하') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P149_레벨하')}</div>
                                <div className="sensor-name">레벨 하</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P118_상승비상') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P118_상승비상')}</div>
                                <div className="sensor-name">상승 비상</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P11A_상승감속') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P11A_상승감속')}</div>
                                <div className="sensor-name">상승 감속</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P11B_하강감속') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P11B_하강감속')}</div>
                                <div className="sensor-name">하강 감속</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P11D_하강비상') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P11D_하강비상')}</div>
                                <div className="sensor-name">하강 비상</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P115_와이어절단') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P115_와이어절단')}</div>
                                <div className="sensor-name">와이어 절단</div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'page3' && (
                        <div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P140_후크중앙_전_') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P140_후크중앙_전_')}</div>
                                <div className="sensor-name">후크 중앙(전)</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P141_후크중앙_후_') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P141_후크중앙_후_')}</div>
                                <div className="sensor-name">후크 중앙(후)</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P142_홀수파렛정지') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P142_홀수파렛정지')}</div>
                                <div className="sensor-name">홀수 파렛 정지</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P143_짝수파렛정지') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P143_짝수파렛정지')}</div>
                                <div className="sensor-name">짝수 파렛 정지</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P144_파렛감지_홀_') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P144_파렛감지_홀_')}</div>
                                <div className="sensor-name">파렛 감지(홀)</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P145_파렛감지_짝_') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P145_파렛감지_짝_')}</div>
                                <div className="sensor-name">파렛 감지(짝)</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P116_피트센서_홀_') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P116_피트센서_홀_')}</div>
                                <div className="sensor-name">피트센서(홀)</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P117_피트센서_짝_') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P117_피트센서_짝_')}</div>
                                <div className="sensor-name">피트센서(짝)</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 우측 센서 패널 - 속초 출력 센서 표시 (기존과 동일) */}
            {showSensors && (
                <div className={`sensor-panel-right show ${theme === 'space' ? 'space-theme' : ''}`}>
                    {activeTab === 'page1' && (
                        <div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P212_도어열림MC') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P212_도어열림MC')}</div>
                                <div className="sensor-name">도어열림MC</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P213_도어닫힘MC') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P213_도어닫힘MC')}</div>
                                <div className="sensor-name">도어닫힘MC</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P22A_턴MC') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P22A_턴MC')}</div>
                                <div className="sensor-name">턴 MC</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P22B_턴BK') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P22B_턴BK')}</div>
                                <div className="sensor-name">턴 BK</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P22C_턴락MC') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P22C_턴락MC')}</div>
                                <div className="sensor-name">턴락 MC</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P22D_턴언락MC') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P22D_턴언락MC')}</div>
                                <div className="sensor-name">턴언락 MC</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P208_유도등1') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P208_유도등1')}</div>
                                <div className="sensor-name">유도등1</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P209_유도등2') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P209_유도등2')}</div>
                                <div className="sensor-name">유도등2</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P20A_유도등4') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P20A_유도등4')}</div>
                                <div className="sensor-name">유도등4</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P20B_유도등8') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P20B_유도등8')}</div>
                                <div className="sensor-name">유도등8</div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'page2' && (
                        <div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P200_L_INV정') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P200_L_INV정')}</div>
                                <div className="sensor-name">리프트 인버터 정</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P201_L_INV역') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P201_L_INV역')}</div>
                                <div className="sensor-name">리프트 인버터 역</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P210_리프트MC') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P210_리프트MC')}</div>
                                <div className="sensor-name">리프트 MC</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P211_리프트BK') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P211_리프트BK')}</div>
                                <div className="sensor-name">리프트 BK</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P202_L_INV_S3') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P202_L_INV_S3')}</div>
                                <div className="sensor-name">리프트 INV S3</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P203_L_INV_S4') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P203_L_INV_S4')}</div>
                                <div className="sensor-name">리프트 INV S4</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P204_L_INV_S5') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P204_L_INV_S5')}</div>
                                <div className="sensor-name">리프트 INV S5</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P205_L_INV_S6') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P205_L_INV_S6')}</div>
                                <div className="sensor-name">리프트 INV S6</div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'page3' && (
                        <div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P220_P_INV정') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P220_P_INV정')}</div>
                                <div className="sensor-name">횡행 인버터 정</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P221_P_INV역') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P221_P_INV역')}</div>
                                <div className="sensor-name">횡행 인버터 역</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P228_횡행MC') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P228_횡행MC')}</div>
                                <div className="sensor-name">횡행 MC</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P229_횡행BK') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P229_횡행BK')}</div>
                                <div className="sensor-name">횡행 BK</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P222_P_INV_S3') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P222_P_INV_S3')}</div>
                                <div className="sensor-name">횡행 INV S3</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P223_P_INV_S4') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P223_P_INV_S4')}</div>
                                <div className="sensor-name">횡행 INV S4</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P224_P_INV_S5') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P224_P_INV_S5')}</div>
                                <div className="sensor-name">횡행 INV S5</div>
                            </div>
                            <div className={`sensor-item ${theme === 'space' ? 'space-theme' : ''} ${getSensorValue('P225_P_INV_S6') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P225_P_INV_S6')}</div>
                                <div className="sensor-name">횡행 INV S6</div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default ManualControl;