import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { usePLCConnection } from '../hooks/usePLCConnection';
import { useAuth } from '../hooks/useAuth';
import ConnectionPanel from './ConnectionPanel';
import SensorMonitor from './SensorMonitor';
import ManualControl from './ManualControl';
import ParkingMonitor from './ParkingMonitor';
import EventMonitor from './EventMonitor';
// 속초 1호기 config import 추가
import sokcho1Config from '../../config/sokcho1Config.js';
// 권한 관리 import 추가
import { ROLE_TABS } from './auth';

const PLCControl = ({ currentUser, onLogout }) => {
    const { isClient } = useAuth();
    
    // 탭 ID 매핑 테이블 (ROLE_TABS -> PLCControl 탭)
    const TAB_MAPPING = {
        'parking': 'parking',      // 주차 현황
        'events': 'events',        // 입출차 이벤트
        'manual': 'control',       // 수동 제어  
        'sensor': 'monitor',       // 센서 모니터
        'config': 'connection'     // 연결 관리 (설정)
    };

    // 사용자 권한에 따른 허용된 탭들 계산
    const allowedTabs = useMemo(() => {
        if (!currentUser || !currentUser.role) return [];

        const userTabs = ROLE_TABS[currentUser.role] || [];
        return userTabs.map(tab => ({
            id: TAB_MAPPING[tab.id],
            name: tab.name,
            originalId: tab.id,
            icon: tab.icon
        })).filter(tab => tab.id); // 매핑되지 않은 탭 제외
    }, [currentUser]);

    // 첫 번째 허용된 탭을 기본값으로 설정
    const getDefaultTab = () => {
        if (allowedTabs.length === 0) return 'parking';

        // Client는 events를 기본으로, 나머지는 첫 번째 탭
        if (currentUser?.role === 'client') {
            return allowedTabs.find(tab => tab.id === 'events')?.id || allowedTabs[0].id;
        }

        return allowedTabs[0].id;
    };

    const defaultTab = getDefaultTab();
    const [activeTab, setActiveTab] = useState(defaultTab);

    const [showLogs, setShowLogs] = useState(false);
    const [isDataPanelExpanded, setIsDataPanelExpanded] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [selectedUnit, setSelectedUnit] = useState(1);

    // PLC 연결 훅 사용
    const {
        isSignalRConnected,
        isPLCConnected,
        isConnecting,
        isAuthenticated,
        error,
        sensorData,
        logs,
        plcConfig,
        setPLCConfig,
        connectToPLC,
        disconnectFromPLC,
        sendCommand,
        clearError,
        clearLogs
    } = usePLCConnection();

    // 모바일 메뉴 애니메이션 타이머 관리
    useEffect(() => {
        if (!isClosing || !pendingAction) return;

        const timer = setTimeout(() => {
            pendingAction.action();
            setPendingAction(null);
            setIsClosing(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [isClosing, pendingAction]);

    // 권한 체크 함수
    const hasTabAccess = (tabId) => {
        return allowedTabs.some(tab => tab.id === tabId);
    };

    // 차량번호 편집 핸들러
    const handleVehicleEdit = async (address, value, description) => {
        try {
            const deviceType = address.substring(0, 1);
            const addressNum = parseInt(address.substring(1));

            const result = await sendCommand('WriteAddress', {
                deviceType: deviceType,
                address: addressNum,
                value: value
            });

            if (result.success) {
                console.log(`${description} 편집 완료: ${address} = ${value}`);
            } else {
                alert(`편집 실패: ${result.error || '알 수 없는 오류'}`);
            }
        } catch (error) {
            console.error('차량번호 편집 오류:', error);
            alert('편집 중 오류가 발생했습니다.');
        }
    };

    // 모바일 메뉴 탭 클릭 핸들러
    const handleMobileTabClick = (tabName) => {
        if (!hasTabAccess(tabName)) return; // 권한 없으면 무시

        setIsClosing(true);
        setPendingAction({
            action: () => {
                setActiveTab(tabName);
                setIsMobileMenuOpen(false);
            }
        });
    };

    // 탭 클릭 핸들러 (권한 체크 포함)
    const handleTabClick = (tabId) => {
        if (!hasTabAccess(tabId)) return; // 권한 없으면 무시
        setActiveTab(tabId);
    };

    // 탭 스타일 - 화려한 애니메이션 적용
    const getTabStyle = (tabName) => {
        const baseStyle = "relative px-8 py-4 font-bold rounded-2xl transition-all duration-300 ease-in-out text-sm transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl border-2";

        // 권한 없는 탭은 숨김
        if (!hasTabAccess(tabName)) {
            return `${baseStyle} hidden`;
        }

        if (activeTab === tabName) {
            return `${baseStyle} bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white shadow-2xl border-blue-300 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700`;
        }
        return `${baseStyle} bg-gradient-to-r from-white to-gray-50 text-gray-600 hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 border-gray-200 hover:border-blue-300 hover:shadow-lg`;
    };

    return (
        <>
            {/* 상단 네비게이션 헤더 - 완전 전체 화면 너비 */}
            <header className="bg-white shadow-lg border-b border-gray-200 fixed top-0 left-0 right-0 w-full z-50">
                <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3">
                    {/* 로고/제목 (왼쪽) */}
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-300">
                            <span className="text-white font-black text-xs sm:text-sm tracking-wider">E</span>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent tracking-wider">
                                EPSAI
                            </h1>
                            <div className="text-xs text-gray-500 font-medium tracking-widest hidden sm:block">
                                PARKING SYSTEM
                            </div>
                        </div>
                    </div>

                    {/* 탭 네비게이션 (중앙) - 데스크톱용만 */}
                    <nav className="hidden xl:flex space-x-4 flex-1 justify-center max-w-6xl">
                        {/* 연결 관리 - config 권한 */}
                        {hasTabAccess('connection') && (
                            <button
                                onClick={() => handleTabClick('connection')}
                                className={`${getTabStyle('connection')} group overflow-hidden`}
                            >
                                <span className="relative z-10">연결 관리</span>
                            </button>
                        )}

                        {/* 센서 모니터 - sensor 권한 */}
                        {hasTabAccess('monitor') && (
                            <button
                                onClick={() => handleTabClick('monitor')}
                                className={`${getTabStyle('monitor')} group overflow-hidden`}
                            >
                                <span className="relative z-10">센서 모니터</span>
                            </button>
                        )}

                        {/* 수동 제어 - manual 권한 */}
                        {hasTabAccess('control') && (
                            <button
                                onClick={() => handleTabClick('control')}
                                className={`${getTabStyle('control')} group overflow-hidden`}
                            >
                                <span className="relative z-10">수동 제어</span>
                            </button>
                        )}

                        {/* 주차장 모니터 - parking 권한 (모든 사용자) */}
                        {hasTabAccess('parking') && (
                            <button
                                onClick={() => handleTabClick('parking')}
                                className={`${getTabStyle('parking')} group overflow-hidden`}
                            >
                                <span className="relative z-10">주차장 모니터</span>
                            </button>
                        )}

                        {/* 입출차 이벤트 - events 권한 */}
                        {hasTabAccess('events') && (
                            <button
                                onClick={() => handleTabClick('events')}
                                className={`${getTabStyle('events')} group overflow-hidden`}
                            >
                                <span className="relative z-10">입출차 이벤트</span>
                            </button>
                        )}
                    </nav>

                    {/* 사용자 정보 & 로그아웃 (오른쪽) - 데스크톱용만 */}
                    <div className="hidden xl:flex items-center space-x-4 flex-shrink-0">
                        {/* 상태 표시 */}
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${isSignalRConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-sm font-medium text-gray-700">SignalR</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${isPLCConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-sm font-medium text-gray-700">PLC</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                <span className="text-sm font-medium text-gray-700">인증</span>
                            </div>
                        </div>

                        {/* 사용자 정보 */}
                        {currentUser && (
                            <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
                                <div className="text-right">
                                    <div className="text-sm font-semibold text-gray-800">{currentUser.name}</div>
                                    <div className="text-xs text-gray-500">{currentUser.description}</div>
                                </div>
                                <button
                                    onClick={onLogout}
                                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-colors duration-200"
                                >
                                    로그아웃
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 모바일/태블릿 햄버거 메뉴 (오른쪽) */}
                    <div className="xl:hidden flex items-center space-x-2 flex-shrink-0">
                        {/* 모바일 사용자 정보 */}
                        {currentUser && (
                            <div className="text-right mr-2">
                                <div className="text-sm font-semibold text-gray-800">{currentUser.name}</div>
                                <div className="text-xs text-gray-500">{currentUser.role}</div>
                            </div>
                        )}
                        <button
                            onClick={() => {
                                if (isMobileMenuOpen) {
                                    setIsClosing(true);
                                    setPendingAction({
                                        action: () => setIsMobileMenuOpen(false)
                                    });
                                } else {
                                    setIsMobileMenuOpen(true);
                                }
                            }}
                            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* 모바일/태블릿 탭 메뉴 - 권한별 필터링 적용 */}
                {isMobileMenuOpen && (
                    <div className={`xl:hidden fixed inset-0 top-16 z-40 overflow-hidden mobile-menu-bg transition-all duration-300 ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                        <div className="h-full flex items-start justify-center p-4 pt-16 relative z-10">
                            <div className={`w-full max-w-md md:max-w-lg transform transition-all duration-500 ease-out ${isClosing ? 'animate-out slide-out-to-top-8 fade-out-0' : 'animate-in slide-in-from-top-8 fade-in-0'}`}>
                                {/* 권한에 따른 동적 그리드 - 모바일/태블릿 모두 2열 */}
                                <nav className={`grid gap-4 md:gap-6 w-full grid-cols-2`}>
                                    {allowedTabs.map((tab, index) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => handleMobileTabClick(tab.id)}
                                            className={`${getTabStyle(tab.id)} w-full h-24 md:h-20 flex items-center justify-center text-center transform transition-all duration-300 hover:scale-105 hover:rotate-1`}
                                            style={{
                                                animationName: isClosing ? 'slideOutToLeft' : (index % 2 === 0 ? 'slideInFromLeft' : 'slideInFromRight'),
                                                animationDuration: isClosing ? '0.3s' : '0.6s',
                                                animationTimingFunction: isClosing ? 'ease-in' : 'ease-out',
                                                animationDelay: isClosing ? '0s' : `${(index + 1) * 0.1}s`,
                                                animationFillMode: 'both'
                                            }}
                                        >
                                            <div className="flex flex-col items-center">
                                                <span className="text-lg md:text-base font-semibold">{tab.name}</span>
                                            </div>
                                        </button>
                                    ))}

                                    {/* 모바일 로그아웃 버튼 */}
                                    <button
                                        onClick={() => {
                                            setIsClosing(true);
                                            setPendingAction({
                                                action: () => onLogout()
                                            });
                                        }}
                                        className="relative px-8 py-4 font-bold rounded-2xl transition-all duration-300 ease-in-out text-sm transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl border-2 bg-gradient-to-r from-white to-gray-50 text-gray-600 hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 border-gray-200 hover:border-blue-300 hover:shadow-lg w-full h-24 md:h-20 flex items-center justify-center text-center"
                                        style={{
                                            animationName: isClosing ? 'slideOutToRight' : (allowedTabs.length % 2 === 0 ? 'slideInFromLeft' : 'slideInFromRight'),
                                            animationDuration: isClosing ? '0.3s' : '0.6s',
                                            animationTimingFunction: isClosing ? 'ease-in' : 'ease-out',
                                            animationDelay: isClosing ? '0s' : `${(allowedTabs.length + 1) * 0.1}s`,
                                            animationFillMode: 'both'
                                        }}
                                    >
                                        <div className="flex flex-col items-center">
                                            <span className="text-lg md:text-base font-semibold relative z-10">로그아웃</span>
                                        </div>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* 메인 컨텐츠 */}
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20" style={{ width: '100vw' }}>
                <main className="p-2 md:p-4 max-w-6xl mx-auto">
                    <div className="w-full">
                        {/* 상단 상태 표시 탭들 - 속초 config 적용 (클라이언트일 때 숨김) */}
                        {!isClient() && (
                        <div className="mb-4 rounded-2xl shadow-lg overflow-hidden border border-white/20" style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                        }}>
                            <div className="flex items-stretch">
                                <div className="flex-1 min-w-0 flex flex-col">
                                    <div className={`text-white text-xs font-medium px-1 py-2 text-center h-10 flex items-center justify-center ${sensorData.rawData[sokcho1Config.systemAddresses.remoteOp] === 1 ? 'bg-blue-500' : 'bg-gray-400'}`} style={{
                                        backdropFilter: 'blur(10px)',
                                        WebkitBackdropFilter: 'blur(10px)',
                                    }}>
                                        원격조작
                                    </div>
                                    <div className={`text-sm px-2 py-3 text-center border-r h-16 flex items-center justify-center ${sensorData.rawData[sokcho1Config.systemAddresses.remoteOp] === 1 ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-800'}`}>
                                        {sensorData.rawData[sokcho1Config.systemAddresses.remoteOp] === 1 ? '활성' : '비활성'}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col">
                                    <div className={`text-white text-xs font-medium px-1 py-2 text-center h-10 flex items-center justify-center ${isPLCConnected ? 'bg-blue-500' : 'bg-gray-400'}`} style={{
                                        backdropFilter: 'blur(10px)',
                                        WebkitBackdropFilter: 'blur(10px)',
                                    }}>
                                        위치정보
                                    </div>
                                    <div className={`text-sm px-2 py-3 text-center border-r h-16 flex items-center justify-center ${isPLCConnected ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-800'}`}>
                                        {isPLCConnected ? sokcho1Config.siteInfo.location : '-'}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col">
                                    <div className={`text-white text-xs font-medium px-1 py-2 text-center h-10 flex items-center justify-center ${isPLCConnected ? 'bg-blue-500' : 'bg-gray-400'}`} style={{
                                        backdropFilter: 'blur(10px)',
                                        WebkitBackdropFilter: 'blur(10px)',
                                    }}>
                                        호기번호
                                    </div>
                                    <div className={`text-sm px-2 py-3 text-center border-r h-16 flex items-center justify-center ${isPLCConnected ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-800'}`}>
                                        {isPLCConnected ? `${selectedUnit}호기` : '-'}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col">
                                    <div className={`text-white text-xs font-medium px-1 py-2 text-center h-10 flex items-center justify-center ${isPLCConnected ? 'bg-blue-500' : 'bg-gray-400'}`} style={{
                                        backdropFilter: 'blur(10px)',
                                        WebkitBackdropFilter: 'blur(10px)',
                                    }}>
                                        운전모드
                                    </div>
                                    <div className={`text-sm px-2 py-3 text-center border-r h-16 flex items-center justify-center ${isPLCConnected ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-800'}`}>
                                        {isPLCConnected ? (sensorData.rawData[sokcho1Config.systemAddresses.manualMode] === 1 ? '수동' : '자동') : '-'}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col">
                                    <div className={`text-white text-xs font-medium px-1 py-2 text-center h-10 flex items-center justify-center ${isPLCConnected ? (sensorData.rawData[sokcho1Config.systemAddresses.errorStatus] === 1 ? 'bg-red-500' : 'bg-green-500') : 'bg-gray-400'}`} style={{
                                        backdropFilter: 'blur(10px)',
                                        WebkitBackdropFilter: 'blur(10px)',
                                    }}>
                                        에러상태
                                    </div>
                                    <div className={`text-sm px-2 py-3 text-center border-r h-16 flex items-center justify-center ${isPLCConnected ? (sensorData.rawData[sokcho1Config.systemAddresses.errorStatus] === 1 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700') : 'bg-gray-100 text-gray-800'}`}>
                                        {isPLCConnected ? (sensorData.rawData[sokcho1Config.systemAddresses.errorStatus] === 1 ? '고장발생' : '정상') : '-'}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col">
                                    <div className={`text-white text-xs font-medium px-1 py-2 text-center h-10 flex items-center justify-center ${sensorData.rawData[sokcho1Config.systemAddresses.plcComm] === 1 ? 'bg-blue-500' : 'bg-red-500'}`} style={{
                                        backdropFilter: 'blur(10px)',
                                        WebkitBackdropFilter: 'blur(10px)',
                                    }}>
                                        PLC통신
                                    </div>
                                    <div className={`text-sm px-2 py-3 text-center h-16 flex items-center justify-center ${sensorData.rawData[sokcho1Config.systemAddresses.plcComm] === 1 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                                        {sensorData.rawData[sokcho1Config.systemAddresses.plcComm] === 1 ? '활성' : '비활성'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}

                        {/* 차량 및 주차 현황 데이터 - 속초 config 적용 */}
                        <div
                            className="mb-6 rounded-2xl relative overflow-hidden border border-white/20 shadow-xl shadow-black/20"
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(25px)',
                                WebkitBackdropFilter: 'blur(25px)',
                            }}
                        >
                            {/* 헤더 */}
                            <div
                                className="group p-4 sm:p-6 flex justify-between items-center cursor-pointer rounded-t-2xl transition-all duration-300 relative overflow-hidden"
                                onClick={() => setIsDataPanelExpanded(!isDataPanelExpanded)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
                                }}
                            >
                                <div
                                    className="absolute top-0 left-[-150%] h-full w-[50%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-700 ease-in-out group-hover:left-[150%]"
                                />

                                <h3 className="text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent relative z-10">
                                    차량 및 주차 현황 데이터
                                </h3>
                                <button
                                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95 relative z-10"
                                >
                                    <svg
                                        className={`w-5 h-5 transform transition-transform duration-500 ease-in-out ${isDataPanelExpanded
                                            ? 'rotate-180 text-purple-500'
                                            : 'rotate-0 text-blue-500'
                                            }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>

                            {/* 데이터 패널 내용 (기존과 동일) */}
                            <div className={`overflow-hidden transition-all duration-700 ease-in-out ${isDataPanelExpanded
                                ? 'max-h-screen opacity-100 transform translate-y-0'
                                : 'max-h-0 opacity-0 transform -translate-y-4'
                                }`}>
                                <div className="px-4 sm:px-6 pt-4 pb-4 sm:pb-6 relative" style={{
                                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.7) 100%)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)'
                                }}>
                                    {/* 글래스모피즘 배경 그라데이션 */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-white/3 to-white/2 rounded-b-2xl"></div>

                                    {/* 첫 번째 행 */}
                                    <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
                                        <div className={`p-2 sm:p-3 rounded-lg transition-all duration-700 ease-out transform relative overflow-hidden ${isDataPanelExpanded
                                                ? 'translate-y-0 opacity-100'
                                                : 'translate-y-4 opacity-0'
                                            }`}
                                            style={{
                                                transitionDelay: isDataPanelExpanded ? '100ms' : '0ms',
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                                                backdropFilter: 'blur(25px)',
                                                WebkitBackdropFilter: 'blur(25px)',
                                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                                boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.15)'
                                            }}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 to-indigo-500/8 rounded-lg"></div>
                                            <label className="block text-xs font-medium text-blue-700 mb-1 relative z-10">차량번호</label>
                                            <div className="rounded-2xl px-2 sm:px-3 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold text-gray-700 relative z-10" style={{
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)',
                                                backdropFilter: 'blur(10px)',
                                                WebkitBackdropFilter: 'blur(10px)',
                                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                                boxShadow: '0 2px 8px 0 rgba(31, 38, 135, 0.15)'
                                            }}>----</div>
                                        </div>

                                        <div className={`p-2 sm:p-3 rounded-lg transition-all duration-700 ease-out transform relative overflow-hidden ${isDataPanelExpanded
                                                ? 'translate-y-0 opacity-100'
                                                : 'translate-y-4 opacity-0'
                                            }`}
                                            style={{
                                                transitionDelay: isDataPanelExpanded ? '200ms' : '0ms',
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.12) 100%)',
                                                backdropFilter: 'blur(15px)',
                                                WebkitBackdropFilter: 'blur(15px)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.2)'
                                            }}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 to-indigo-500/8 rounded-lg"></div>
                                            <label className="block text-xs font-medium text-blue-700 mb-1 relative z-10">적재차판</label>
                                            <div className="rounded-2xl px-2 sm:px-3 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold text-gray-700 relative z-10" style={{
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)',
                                                backdropFilter: 'blur(10px)',
                                                WebkitBackdropFilter: 'blur(10px)',
                                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                                boxShadow: '0 2px 8px 0 rgba(31, 38, 135, 0.15)'
                                            }}>
                                                {sensorData.rawData?.[75] || 0}
                                            </div>
                                        </div>

                                        <div className={`p-2 sm:p-3 rounded-lg transition-all duration-700 ease-out transform relative overflow-hidden ${isDataPanelExpanded
                                                ? 'translate-y-0 opacity-100'
                                                : 'translate-y-4 opacity-0'
                                            }`}
                                            style={{
                                                transitionDelay: isDataPanelExpanded ? '300ms' : '0ms',
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.12) 100%)',
                                                backdropFilter: 'blur(15px)',
                                                WebkitBackdropFilter: 'blur(15px)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.2)'
                                            }}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 to-indigo-500/8 rounded-lg"></div>
                                            <label className="block text-xs font-medium text-blue-700 mb-1 relative z-10">출고차판</label>
                                            <div className="rounded-2xl px-2 sm:px-3 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold text-gray-700 relative z-10" style={{
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)',
                                                backdropFilter: 'blur(10px)',
                                                WebkitBackdropFilter: 'blur(10px)',
                                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                                boxShadow: '0 2px 8px 0 rgba(31, 38, 135, 0.15)'
                                            }}>
                                                {sensorData.rawData?.[76] || 0}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 두 번째 행 */}
                                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                                        <div className={`p-3 rounded-lg transition-all duration-700 ease-out transform relative overflow-hidden ${isDataPanelExpanded
                                                ? 'translate-y-0 opacity-100 scale-100'
                                                : 'translate-y-4 opacity-0 scale-95'
                                            }`}
                                            style={{
                                                transitionDelay: isDataPanelExpanded ? '400ms' : '0ms',
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)',
                                                backdropFilter: 'blur(12px)',
                                                WebkitBackdropFilter: 'blur(12px)',
                                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                                boxShadow: '0 3px 12px 0 rgba(31, 38, 135, 0.18)'
                                            }}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/6 to-pink-500/6 rounded-lg"></div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1 relative z-10">전체주차</label>
                                            <div className="text-gray-700 text-center rounded-2xl px-1 sm:px-2 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10" style={{
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)',
                                                backdropFilter: 'blur(8px)',
                                                WebkitBackdropFilter: 'blur(8px)',
                                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                                boxShadow: '0 1px 6px 0 rgba(31, 38, 135, 0.12)'
                                            }}>
                                                {sensorData.rawData?.[77] || 0}
                                            </div>
                                        </div>

                                        <div className={`p-3 rounded-lg transition-all duration-700 ease-out transform relative overflow-hidden ${isDataPanelExpanded
                                                ? 'translate-y-0 opacity-100 scale-100'
                                                : 'translate-y-4 opacity-0 scale-95'
                                            }`}
                                            style={{
                                                transitionDelay: isDataPanelExpanded ? '500ms' : '0ms',
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)',
                                                backdropFilter: 'blur(12px)',
                                                WebkitBackdropFilter: 'blur(12px)',
                                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                                boxShadow: '0 3px 12px 0 rgba(31, 38, 135, 0.18)'
                                            }}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/6 to-pink-500/6 rounded-lg"></div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1 relative z-10">전체공차</label>
                                            <div className="text-gray-700 text-center rounded-2xl px-1 sm:px-2 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10" style={{
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)',
                                                backdropFilter: 'blur(8px)',
                                                WebkitBackdropFilter: 'blur(8px)',
                                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                                boxShadow: '0 1px 6px 0 rgba(31, 38, 135, 0.12)'
                                            }}>
                                                {sensorData.rawData?.[78] || 0}
                                            </div>
                                        </div>

                                        <div className={`p-3 rounded-lg transition-all duration-700 ease-out transform relative overflow-hidden ${isDataPanelExpanded
                                                ? 'translate-y-0 opacity-100 scale-100'
                                                : 'translate-y-4 opacity-0 scale-95'
                                            }`}
                                            style={{
                                                transitionDelay: isDataPanelExpanded ? '600ms' : '0ms',
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)',
                                                backdropFilter: 'blur(12px)',
                                                WebkitBackdropFilter: 'blur(12px)',
                                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                                boxShadow: '0 3px 12px 0 rgba(31, 38, 135, 0.18)'
                                            }}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/6 to-pink-500/6 rounded-lg"></div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1 relative z-10">일반입고</label>
                                            <div className="text-gray-700 text-center rounded-2xl px-1 sm:px-2 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10" style={{
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)',
                                                backdropFilter: 'blur(8px)',
                                                WebkitBackdropFilter: 'blur(8px)',
                                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                                boxShadow: '0 1px 6px 0 rgba(31, 38, 135, 0.12)'
                                            }}>
                                                {sensorData.rawData?.[79] || 0}
                                            </div>
                                        </div>

                                        <div className={`p-3 rounded-lg transition-all duration-700 ease-out transform relative overflow-hidden ${isDataPanelExpanded
                                                ? 'translate-y-0 opacity-100 scale-100'
                                                : 'translate-y-4 opacity-0 scale-95'
                                            }`}
                                            style={{
                                                transitionDelay: isDataPanelExpanded ? '700ms' : '0ms',
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)',
                                                backdropFilter: 'blur(12px)',
                                                WebkitBackdropFilter: 'blur(12px)',
                                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                                boxShadow: '0 3px 12px 0 rgba(31, 38, 135, 0.18)'
                                            }}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/6 to-pink-500/6 rounded-lg"></div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1 relative z-10">일반출차</label>
                                            <div className="text-gray-700 text-center rounded-2xl px-1 sm:px-2 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10" style={{
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)',
                                                backdropFilter: 'blur(8px)',
                                                WebkitBackdropFilter: 'blur(8px)',
                                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                                boxShadow: '0 1px 6px 0 rgba(31, 38, 135, 0.12)'
                                            }}>
                                                {sensorData.rawData?.[80] || 0}
                                            </div>
                                        </div>

                                        <div className={`p-3 rounded-lg transition-all duration-700 ease-out transform relative overflow-hidden ${isDataPanelExpanded
                                                ? 'translate-y-0 opacity-100 scale-100'
                                                : 'translate-y-4 opacity-0 scale-95'
                                            }`}
                                            style={{
                                                transitionDelay: isDataPanelExpanded ? '800ms' : '0ms',
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)',
                                                backdropFilter: 'blur(12px)',
                                                WebkitBackdropFilter: 'blur(12px)',
                                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                                boxShadow: '0 3px 12px 0 rgba(31, 38, 135, 0.18)'
                                            }}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/6 to-pink-500/6 rounded-lg"></div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1 relative z-10">RV입고</label>
                                            <div className="text-gray-700 text-center rounded-2xl px-1 sm:px-2 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10" style={{
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)',
                                                backdropFilter: 'blur(8px)',
                                                WebkitBackdropFilter: 'blur(8px)',
                                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                                boxShadow: '0 1px 6px 0 rgba(31, 38, 135, 0.12)'
                                            }}>
                                                {sensorData.rawData?.[82] || 0}
                                            </div>
                                        </div>

                                        <div className={`p-3 rounded-lg transition-all duration-700 ease-out transform relative overflow-hidden ${isDataPanelExpanded
                                                ? 'translate-y-0 opacity-100 scale-100'
                                                : 'translate-y-4 opacity-0 scale-95'
                                            }`}
                                            style={{
                                                transitionDelay: isDataPanelExpanded ? '900ms' : '0ms',
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)',
                                                backdropFilter: 'blur(12px)',
                                                WebkitBackdropFilter: 'blur(12px)',
                                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                                boxShadow: '0 3px 12px 0 rgba(31, 38, 135, 0.18)'
                                            }}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/6 to-pink-500/6 rounded-lg"></div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1 relative z-10">RV출차</label>
                                            <div className="text-gray-700 text-center rounded-2xl px-1 sm:px-2 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10" style={{
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)',
                                                backdropFilter: 'blur(8px)',
                                                WebkitBackdropFilter: 'blur(8px)',
                                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                                boxShadow: '0 1px 6px 0 rgba(31, 38, 135, 0.12)'
                                            }}>
                                                {sensorData.rawData?.[81] || 0}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* 탭 컨텐츠 - 권한 체크 적용 */}
                        <div className="space-y-6">
                            {/* 연결 관리 탭 - config 권한 필요 */}
                            {activeTab === 'connection' && hasTabAccess('connection') && (
                                <ConnectionPanel
                                    isSignalRConnected={isSignalRConnected}
                                    isPLCConnected={isPLCConnected}
                                    isConnecting={isConnecting}
                                    isAuthenticated={isAuthenticated}
                                    error={error}
                                    plcConfig={plcConfig}
                                    setPLCConfig={setPLCConfig}
                                    connectToPLC={connectToPLC}
                                    disconnectFromPLC={disconnectFromPLC}
                                    clearError={clearError}
                                    selectedUnit={selectedUnit}
                                    setSelectedUnit={setSelectedUnit}
                                />
                            )}

                            {/* 센서 모니터 탭 - sensor 권한 필요 */}
                            {activeTab === 'monitor' && hasTabAccess('monitor') && (
                                <SensorMonitor
                                    sensorData={sensorData}
                                    isPLCConnected={isPLCConnected}
                                />
                            )}

                            {/* 수동 제어 탭 - manual 권한 필요 */}
                            {activeTab === 'control' && hasTabAccess('control') && (
                                <ManualControl
                                    isPLCConnected={isPLCConnected}
                                    isAuthenticated={isAuthenticated}
                                    sendCommand={sendCommand}
                                    sensorData={sensorData}
                                    isMobileMenuOpen={isMobileMenuOpen}
                                />
                            )}

                            {/* 주차장 모니터 탭 - parking 권한 (모든 사용자) */}
                            {activeTab === 'parking' && hasTabAccess('parking') && (
                                <ParkingMonitor
                                    sensorData={sensorData}
                                    isPLCConnected={isPLCConnected}
                                    onVehicleEdit={handleVehicleEdit}
                                />
                            )}

                            {/* 입출차 이벤트 탭 - events 권한 */}
                            {activeTab === 'events' && hasTabAccess('events') && (
                                <EventMonitor
                                    sensorData={sensorData}
                                    isPLCConnected={isPLCConnected}
                                />
                            )}

                            {/* 권한 없는 경우 안내 메시지 */}
                            {!hasTabAccess(activeTab) && (
                                <div className="flex items-center justify-center min-h-96">
                                    <div className="text-center p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                                        <div className="text-6xl mb-4">🔒</div>
                                        <h3 className="text-xl font-bold text-gray-700 mb-2">접근 권한이 없습니다</h3>
                                        <p className="text-gray-500">
                                            현재 계정({currentUser?.role})으로는 이 기능을 사용할 수 없습니다.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>


                        {/* Footer */}
                        <footer className="mt-8 text-center text-sm text-gray-500">
                            <p>PLC 웹 제어 시스템 v1.0 - Parking24web ({currentUser?.role} 모드)</p>
                        </footer>
                    </div>
                </main>
            </div>
        </>
    );
};

export default PLCControl;