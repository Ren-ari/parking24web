import React, { useState } from 'react';
import { usePLCConnection } from '../hooks/usePLCConnection';
import ConnectionPanel from './ConnectionPanel';
import SensorMonitor from './SensorMonitor';
import ManualControl from './ManualControl';
import ParkingMonitor from './ParkingMonitor';

const PLCControl = () => {
    const [activeTab, setActiveTab] = useState('connection');
    const [showLogs, setShowLogs] = useState(false);

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

    // 탭 스타일
    const getTabStyle = (tabName) => {
        const baseStyle = "px-4 py-2 font-medium rounded-t-lg transition-colors";
        if (activeTab === tabName) {
            return `${baseStyle} bg-blue-500 text-white`;
        }
        return `${baseStyle} bg-gray-200 text-gray-700 hover:bg-gray-300`;
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            {/* 헤더 */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">PLC 웹 제어 시스템</h1>
                <p className="text-gray-600">실시간 PLC 모니터링 및 제어</p>
            </div>

            {/* 전역 상태 표시 */}
            <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <div className={`w-4 h-4 rounded-full ${isSignalRConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-sm font-medium">SignalR</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className={`w-4 h-4 rounded-full ${isPLCConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-sm font-medium">PLC</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className={`w-4 h-4 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            <span className="text-sm font-medium">인증</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                            마지막 업데이트: {sensorData.timestamp ? new Date(sensorData.timestamp).toLocaleTimeString() : 'N/A'}
                        </span>
                        <button
                            onClick={() => setShowLogs(!showLogs)}
                            className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                        >
                            {showLogs ? '로그 숨기기' : '로그 보기'}
                        </button>
                    </div>
                </div>
            </div>

            {/* 로그 패널 (토글) */}
            {showLogs && (
                <div className="mb-6 bg-white rounded-lg shadow-md">
                    <div className="flex justify-between items-center p-4 border-b">
                        <h3 className="font-semibold text-gray-800">시스템 로그</h3>
                        <button
                            onClick={clearLogs}
                            className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                        >
                            로그 지우기
                        </button>
                    </div>
                    <div className="p-4 max-h-60 overflow-y-auto">
                        {logs.length === 0 ? (
                            <p className="text-gray-500 text-sm">로그가 없습니다</p>
                        ) : (
                            <div className="space-y-1">
                                {logs.slice(0, 20).map((log, index) => (
                                    <div key={index} className={`text-sm p-2 rounded ${log.type === 'error' ? 'bg-red-50 text-red-700' :
                                        log.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                                            log.type === 'success' ? 'bg-green-50 text-green-700' :
                                                'bg-gray-50 text-gray-700'
                                        }`}>
                                        <span className="font-mono text-xs text-gray-500">{log.timestamp}</span>
                                        <span className="ml-2">{log.message}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 탭 네비게이션 */}
            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-2">
                        <button
                            onClick={() => setActiveTab('connection')}
                            className={getTabStyle('connection')}
                        >
                            연결 관리
                        </button>
                        <button
                            onClick={() => setActiveTab('monitor')}
                            className={getTabStyle('monitor')}
                        >
                            센서 모니터
                        </button>
                        <button
                            onClick={() => setActiveTab('control')}
                            className={getTabStyle('control')}
                        >
                            수동 제어
                        </button>
                        <button
                            onClick={() => setActiveTab('parking')}
                            className={getTabStyle('parking')}
                        >
                            주차장 모니터
                        </button>
                    </nav>
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
                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
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
    );
};

export default PLCControl;