import React, { useState } from 'react';
import { usePLCConnection } from '../hooks/usePLCConnection';
import ConnectionPanel from './ConnectionPanel';
import SensorMonitor from './SensorMonitor';
import ManualControl from './ManualControl';
import ParkingMonitor from './ParkingMonitor';

const PLCControl = () => {
    const [activeTab, setActiveTab] = useState('connection');
    const [showLogs, setShowLogs] = useState(false);
    const [isDataPanelExpanded, setIsDataPanelExpanded] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // PLC 연결 훅 사용
    const {
        // 상태
        isSignalRConnected,
        isPLCConnected,
        isConnecting,
        isAuthenticated,
        error,
        sensorData,
        logs,

        // 설정
        plcConfig,
        setPLCConfig,

        // 액션
        connectToPLC,
        disconnectFromPLC,
        sendCommand,
        clearError,
        clearLogs
    } = usePLCConnection();

    // 차량번호 편집 핸들러
    const handleVehicleEdit = async (address, value, description) => {
        try {
            const deviceType = address.substring(0, 1);  // D
            const addressNum = parseInt(address.substring(1));  // 4001~

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

    // 탭 스타일 - 화려한 애니메이션 적용
    const getTabStyle = (tabName) => {
        const baseStyle = "relative px-6 py-3 font-bold rounded-xl transition-all duration-500 ease-in-out text-sm transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-2xl";
        if (activeTab === tabName) {
            return `${baseStyle} bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white shadow-2xl animate-pulse border-2 border-white`;
        }
        return `${baseStyle} bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-indigo-100 hover:to-purple-100 hover:text-indigo-700 border-2 border-transparent hover:border-indigo-300`;
    };

    return (
        <>
            {/* 상단 네비게이션 헤더 - 완전 전체 화면 너비 */}
            <header className="bg-white shadow-lg border-b border-gray-200 fixed top-0 left-0 right-0 w-full z-50">
                <div className="flex items-center justify-between px-4 py-3">
                    {/* 로고/제목 (왼쪽) */}
                    <div className="flex items-center space-x-3 flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-300">
                            <span className="text-white font-black text-sm tracking-wider">E</span>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent tracking-wider">
                                EPSAI
                            </h1>
                            <div className="text-xs text-gray-500 font-medium tracking-widest">
                                PARKING SYSTEM
                            </div>
                        </div>
                    </div>
                    
                    {/* 탭 네비게이션 (중앙) - 화려한 애니메이션 */}
                    <nav className="hidden md:flex space-x-3 flex-1 justify-center">
                        <button
                            onClick={() => setActiveTab('connection')}
                            className={`${getTabStyle('connection')} group overflow-hidden`}
                        >
                            <span className="relative z-10">연결 관리</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                        </button>
                        <button
                            onClick={() => setActiveTab('monitor')}
                            className={`${getTabStyle('monitor')} group overflow-hidden`}
                        >
                            <span className="relative z-10">센서 모니터</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                        </button>
                        <button
                            onClick={() => setActiveTab('control')}
                            className={`${getTabStyle('control')} group overflow-hidden`}
                        >
                            <span className="relative z-10">수동 제어</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                        </button>
                        <button
                            onClick={() => setActiveTab('parking')}
                            className={`${getTabStyle('parking')} group overflow-hidden`}
                        >
                            <span className="relative z-10">주차장 모니터</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                        </button>
                    </nav>
                    
                    {/* 상태 표시 (데스크톱) */}
                    <div className="hidden md:flex items-center space-x-3 flex-shrink-0">
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
                    
                    {/* 모바일 햄버거 메뉴 (오른쪽) */}
                    <div className="md:hidden flex-shrink-0">
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
                
                {/* 모바일 탭 메뉴 */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 px-4 py-2">
                        <nav className="flex flex-wrap gap-2">
                            <button
                                onClick={() => {
                                    setActiveTab('connection');
                                    setIsMobileMenuOpen(false);
                                }}
                                className={getTabStyle('connection')}
                            >
                                연결 관리
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('monitor');
                                    setIsMobileMenuOpen(false);
                                }}
                                className={getTabStyle('monitor')}
                            >
                                센서 모니터
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('control');
                                    setIsMobileMenuOpen(false);
                                }}
                                className={getTabStyle('control')}
                            >
                                수동 제어
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('parking');
                                    setIsMobileMenuOpen(false);
                                }}
                                className={getTabStyle('parking')}
                            >
                                주차장 모니터
                            </button>
                        </nav>
                    </div>
                )}
            </header>
            
            {/* 메인 컨텐츠 */}
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20" style={{width: '98vw'}}>
                <main className="p-2 md:p-4 max-w-6xl mx-auto">
                <div className="w-full">

            {/* 상단 상태 표시 탭들 */}
                         <div className="mb-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-2xl overflow-hidden border border-blue-200">
                <div className="flex items-stretch">
                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className={`text-white text-sm font-medium px-2 py-2 text-center h-10 flex items-center justify-center ${sensorData.rawData[18] === 1 ? 'bg-blue-500' : 'bg-gray-400'}`}>
                            원격조작
                        </div>
                        <div className={`text-sm px-2 py-3 text-center border-r h-16 flex items-center justify-center ${sensorData.rawData[18] === 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {sensorData.rawData[18] === 1 ? '활성' : '비활성'}
                        </div>
                    </div>
                 
                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className="bg-green-500 text-white text-sm font-medium px-2 py-2 text-center h-10 flex items-center justify-center">
                            위치정보
                        </div>
                        <div className="bg-green-100 text-green-800 text-sm px-2 py-3 text-center border-r h-16 flex items-center justify-center">
                            속초써밋베이
                        </div>
                    </div>
        
                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className="bg-green-500 text-white text-sm font-medium px-2 py-2 text-center h-10 flex items-center justify-center">
                            호기번호
                        </div>
                        <div className="bg-green-100 text-green-800 text-sm px-2 py-3 text-center border-r h-16 flex items-center justify-center">
                            1호기
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className="bg-green-500 text-white text-sm font-medium px-2 py-2 text-center h-10 flex items-center justify-center">
                            운전모드
                        </div>
                        <div className="bg-green-100 text-green-800 text-sm px-2 py-3 text-center border-r h-16 flex items-center justify-center">
                            {sensorData.rawData[15] === 1 ? '자동' : '수동'}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className={`text-white text-sm font-medium px-2 py-2 text-center h-10 flex items-center justify-center ${sensorData.rawData[16] === 1 ? 'bg-red-500' : 'bg-green-500'}`}>
                            에러상태
                        </div>
                        <div className={`text-sm px-2 py-3 text-center border-r h-16 flex items-center justify-center ${sensorData.rawData[16] === 1 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {sensorData.rawData[16] === 1 ? '고장발생' : '정상'}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className={`text-white text-sm font-medium px-2 py-2 text-center h-10 flex items-center justify-center ${sensorData.rawData[0] === 1 ? 'bg-green-500' : 'bg-red-500'}`}>
                            하트비트
                        </div>
                        <div className={`text-sm px-2 py-3 text-center h-16 flex items-center justify-center ${sensorData.rawData[0] === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {sensorData.rawData[0] === 1 ? '활성' : '비활성'}
                        </div>
                    </div>
                </div>
            </div>

            {/* 차량 및 주차 현황 데이터 */}
            <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-2xl border border-blue-200">
                {/* 헤더 (클릭 가능) */}
                <div 
                    className="p-4 sm:p-6 flex justify-between items-center cursor-pointer hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 rounded-t-2xl transition-all duration-500 ease-in-out transform hover:scale-[1.01] hover:shadow-lg"
                    onClick={() => setIsDataPanelExpanded(!isDataPanelExpanded)}
                >
                    <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">차량 및 주차 현황 데이터</h3>
                    <button 
                        className="p-2 hover:bg-blue-200 hover:shadow-md rounded-full transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95"
                    >
                        <svg 
                            className={`w-5 h-5 transform transition-all duration-500 ease-in-out ${
                                isDataPanelExpanded 
                                    ? 'rotate-180 text-purple-600' 
                                    : 'rotate-0 text-blue-600'
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                {/* 컨텐츠 (접었다 폈다 가능) */}
                <div className={`overflow-hidden transition-all duration-700 ease-in-out ${
                    isDataPanelExpanded 
                        ? 'max-h-screen opacity-100 transform translate-y-0' 
                        : 'max-h-0 opacity-0 transform -translate-y-4'
                }`}>
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    {/* 첫 번째 행 */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div className={`p-3 rounded-lg border transition-all duration-700 ease-out transform ${
                        isDataPanelExpanded 
                            ? 'translate-y-0 opacity-100' 
                            : 'translate-y-4 opacity-0'
                    }`} 
                    style={{
                        backgroundColor: '#F0F8FF',
                        transitionDelay: isDataPanelExpanded ? '100ms' : '0ms'
                    }}>
                        <label className="block text-xs font-medium text-blue-700 mb-1">차량번호</label>
                        <div className="bg-white border rounded px-3 py-5 text-sm text-gray-500">----</div>
                    </div>
                    
                    <div className={`p-3 rounded-lg border transition-all duration-700 ease-out transform ${
                        isDataPanelExpanded 
                            ? 'translate-y-0 opacity-100' 
                            : 'translate-y-4 opacity-0'
                    }`} 
                    style={{
                        backgroundColor: '#F0F8FF',
                        transitionDelay: isDataPanelExpanded ? '200ms' : '0ms'
                    }}>
                        <label className="block text-xs font-medium text-blue-700 mb-1">적재차판</label>
                        <div className="bg-white border rounded px-3 py-5 text-2xl md:text-3xl font-bold">
                            {sensorData.rawData?.[75] || 0}
                        </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg border transition-all duration-700 ease-out transform ${
                        isDataPanelExpanded 
                            ? 'translate-y-0 opacity-100' 
                            : 'translate-y-4 opacity-0'
                    }`} 
                    style={{
                        backgroundColor: '#F0F8FF',
                        transitionDelay: isDataPanelExpanded ? '300ms' : '0ms'
                    }}>
                        <label className="block text-xs font-medium text-blue-700 mb-1">출고차판</label>
                        <div className="bg-white border border-gray-300 rounded px-3 py-5 text-2xl md:text-3xl font-bold text-black">
                            {sensorData.rawData?.[76] || 0}
                        </div>
                    </div>
                </div>

                {/* 두 번째 행 */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                    <div className={`bg-gray-50 p-3 rounded-lg border transition-all duration-700 ease-out transform ${
                        isDataPanelExpanded 
                            ? 'translate-y-0 opacity-100 scale-100' 
                            : 'translate-y-4 opacity-0 scale-95'
                    }`}
                    style={{transitionDelay: isDataPanelExpanded ? '400ms' : '0ms'}}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">전체주차</label>
                        <div className="bg-indigo-600 text-white text-center rounded px-2 py-5 text-2xl md:text-3xl font-bold">
                            {sensorData.rawData?.[77] || 0}
                        </div>
                    </div>
                    
                    <div className={`bg-gray-50 p-3 rounded-lg border transition-all duration-700 ease-out transform ${
                        isDataPanelExpanded 
                            ? 'translate-y-0 opacity-100 scale-100' 
                            : 'translate-y-4 opacity-0 scale-95'
                    }`}
                    style={{transitionDelay: isDataPanelExpanded ? '500ms' : '0ms'}}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">전체공차</label>
                        <div className="bg-indigo-600 text-white text-center rounded px-2 py-5 text-2xl md:text-3xl font-bold">
                            {sensorData.rawData?.[78] || 0}
                        </div>
                    </div>
                    
                    <div className={`bg-gray-50 p-3 rounded-lg border transition-all duration-700 ease-out transform ${
                        isDataPanelExpanded 
                            ? 'translate-y-0 opacity-100 scale-100' 
                            : 'translate-y-4 opacity-0 scale-95'
                    }`}
                    style={{transitionDelay: isDataPanelExpanded ? '600ms' : '0ms'}}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">일반입고</label>
                        <div className="bg-indigo-600 text-white text-center rounded px-2 py-5 text-2xl md:text-3xl font-bold">
                            {sensorData.rawData?.[79] || 32}
                        </div>
                    </div>
                    
                    <div className={`bg-gray-50 p-3 rounded-lg border transition-all duration-700 ease-out transform ${
                        isDataPanelExpanded 
                            ? 'translate-y-0 opacity-100 scale-100' 
                            : 'translate-y-4 opacity-0 scale-95'
                    }`}
                    style={{transitionDelay: isDataPanelExpanded ? '700ms' : '0ms'}}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">일반출차</label>
                        <div className="bg-indigo-600 text-white text-center rounded px-2 py-5 text-2xl md:text-3xl font-bold">
                            {sensorData.rawData?.[80] || 0}
                        </div>
                    </div>
                    
                    <div className={`bg-gray-50 p-3 rounded-lg border transition-all duration-700 ease-out transform ${
                        isDataPanelExpanded 
                            ? 'translate-y-0 opacity-100 scale-100' 
                            : 'translate-y-4 opacity-0 scale-95'
                    }`}
                    style={{transitionDelay: isDataPanelExpanded ? '800ms' : '0ms'}}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">RV입고</label>
                        <div className="bg-indigo-600 text-white text-center rounded px-2 py-5 text-2xl md:text-3xl font-bold">
                            {sensorData.rawData?.[82] || 3}
                        </div>
                    </div>
                    
                    <div className={`bg-gray-50 p-3 rounded-lg border transition-all duration-700 ease-out transform ${
                        isDataPanelExpanded 
                            ? 'translate-y-0 opacity-100 scale-100' 
                            : 'translate-y-4 opacity-0 scale-95'
                    }`}
                    style={{transitionDelay: isDataPanelExpanded ? '900ms' : '0ms'}}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">RV출차</label>
                        <div className="bg-indigo-600 text-white text-center rounded px-2 py-5 text-2xl md:text-3xl font-bold">
                            {sensorData.rawData?.[81] || 25}
                        </div>
                    </div>
                </div>

                {/* 세 번째 행 */}
                <div className="grid grid-cols-2 gap-4">
                    <div className={`bg-gray-50 p-3 rounded-lg border transition-all duration-700 ease-out transform ${
                        isDataPanelExpanded 
                            ? 'translate-y-0 opacity-100 scale-100' 
                            : 'translate-y-4 opacity-0 scale-95'
                    }`}
                    style={{transitionDelay: isDataPanelExpanded ? '1000ms' : '0ms'}}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">엔코더값</label>
                        <div className="bg-indigo-600 text-white text-center rounded px-3 py-5 text-2xl md:text-3xl font-bold">
                            {sensorData.rawData?.[240] || 0}
                        </div>
                    </div>
                    
                    <div className={`bg-gray-50 p-3 rounded-lg border transition-all duration-700 ease-out transform ${
                        isDataPanelExpanded 
                            ? 'translate-y-0 opacity-100 scale-100' 
                            : 'translate-y-4 opacity-0 scale-95'
                    }`}
                    style={{transitionDelay: isDataPanelExpanded ? '1100ms' : '0ms'}}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">카운터값</label>
                        <div className="bg-indigo-600 text-white text-center rounded px-3 py-5 text-2xl md:text-3xl font-bold">
                            {sensorData.rawData?.[200] || 0}
                        </div>
                    </div>
                </div>
                    </div>
                </div>
            </div>

            {/* 탭 컨텐츠 */}
            <div className="space-y-6">
                {/* 연결 관리 탭 */}
                {activeTab === 'connection' && (
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
                    />
                )}

                {/* 센서 모니터 탭 */}
                {activeTab === 'monitor' && (
                    <SensorMonitor
                        sensorData={sensorData}
                        isPLCConnected={isPLCConnected}
                    />
                )}

                {/* 수동 제어 탭 */}
                {activeTab === 'control' && (
                    <ManualControl
                        isPLCConnected={isPLCConnected}
                        isAuthenticated={isAuthenticated}
                        sendCommand={sendCommand}
                    />
                )}
                {/* 주차장 모니터 탭 */}
                {activeTab === 'parking' && (
                    <ParkingMonitor
                        sensorData={sensorData}
                        isPLCConnected={isPLCConnected}
                        onVehicleEdit={handleVehicleEdit}
                    />
                )}
            </div>

            {/* 개발자 정보 (개발 모드에서만) */}
            {/* eslint-disable-next-line no-undef */}
            {process.env.NODE_ENV === 'development' && (
                <div className="hidden sm:block mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg lg:w-4/5 mx-auto">
                    <h4 className="font-semibold text-yellow-800 mb-2">개발자 정보</h4>
                    <div className="text-xs text-yellow-700 space-y-1">
                        <div>SignalR Hub: https://localhost:7229/plcHub</div>
                        <div>PLC IP: {plcConfig.ip}:{plcConfig.port}</div>
                        <div>센서 데이터 수: {sensorData.rawData?.length || 0}</div>
                        <div>활성 센서: {sensorData.rawData?.filter(v => v > 0).length || 0}</div>
                        <div>로그 수: {logs.length}</div>
                    </div>
                </div>
            )}

                    {/* Footer */}
                    <footer className="mt-8 text-center text-sm text-gray-500">
                        <p>PLC 웹 제어 시스템 v1.0 - Parking24web</p>
                    </footer>
                    </div>
                </main>
            </div>
        </>
    );
};

export default PLCControl;