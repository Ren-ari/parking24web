import { useState, useEffect, useCallback, useRef } from 'react';
import signalRService from '../services/signalrService';

export const usePLCConnection = () => {
    // 연결 상태
    const [isSignalRConnected, setIsSignalRConnected] = useState(false);
    const [isPLCConnected, setIsPLCConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    // PLC 연결 설정
    const [plcConfig, setPLCConfig] = useState({
        ip: '192.168.1.2',
        port: 2005
    });

    // 센서 데이터
    const [sensorData, setSensorData] = useState({
        timestamp: null,
        connected: false,
        rawData: new Array(256).fill(0),
        parsedData: {}
    });

    // 인증 상태
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // 에러 상태
    const [error, setError] = useState(null);
    const [lastError, setLastError] = useState(null);

    // 로그 메시지
    const [logs, setLogs] = useState([]);
    const maxLogs = 100;

    // 자동 센서 데이터 요청용 타이머
    const sensorRequestTimer = useRef(null);

    // 로그 추가 함수
    const addLog = useCallback((message, type = 'info') => {
        const logEntry = {
            timestamp: new Date().toLocaleTimeString(),
            message,
            type
        };

        setLogs(prev => {
            const newLogs = [logEntry, ...prev];
            return newLogs.slice(0, maxLogs);
        });
    }, []);

    // SignalR 이벤트 핸들러 설정
    useEffect(() => {
        const setupEventHandlers = () => {
            // PLC 연결 상태 변경
            signalRService.onConnectionChanged = (connected) => {
                setIsPLCConnected(connected);
                addLog(`PLC ${connected ? '연결됨' : '연결 해제됨'}`, connected ? 'success' : 'warning');

                if (connected) {
                    // PLC 연결 성공시 센서 데이터 자동 요청 시작
                    startSensorDataRequests();
                } else {
                    // PLC 연결 해제시 센서 데이터 요청 중지
                    stopSensorDataRequests();
                    setIsAuthenticated(false);
                }
            };

            // 센서 데이터 업데이트
            signalRService.onSensorDataUpdate = (data) => {
                setSensorData(data);
                // 너무 많은 로그를 방지하기 위해 30초마다 한 번만 로그
                const now = Date.now();
                if (!window.lastSensorLogTime || now - window.lastSensorLogTime > 30000) {
                    addLog(`센서 데이터 업데이트: ${Object.keys(data.parsedData || {}).length}개 센서`, 'info');
                    window.lastSensorLogTime = now;
                }
            };

            // PLC 인증 결과
            signalRService.onPLCAuthenticated = (authenticated) => {
                setIsAuthenticated(authenticated);
                addLog(`PLC 인증 ${authenticated ? '성공' : '실패'}`, authenticated ? 'success' : 'error');
            };

            // 명령 실행 완료
            signalRService.onCommandExecuted = (command) => {
                addLog(`명령 실행: ${command.commandType} ${command.deviceType}${command.address} = ${command.value}`, 'success');
            };

            // 에러 처리
            signalRService.onError = (message) => {
                setError(message);
                setLastError(message);
                addLog(`오류: ${message}`, 'error');

                // 5초 후 에러 메시지 자동 제거
                setTimeout(() => setError(null), 5000);
            };
        };

        setupEventHandlers();

        return () => {
            stopSensorDataRequests();
        };
    }, [addLog]);

    // SignalR 초기 연결
    useEffect(() => {
        const initializeSignalR = async () => {
            try {
                addLog('SignalR 연결 초기화 중...', 'info');
                const success = await signalRService.initialize();
                setIsSignalRConnected(success);

                if (success) {
                    addLog('SignalR 연결 성공', 'success');
                } else {
                    addLog('SignalR 연결 실패', 'error');
                }
            } catch (error) {
                addLog(`SignalR 초기화 오류: ${error.message}`, 'error');
                setIsSignalRConnected(false);
            }
        };

        initializeSignalR();

        return () => {
            signalRService.disconnect();
        };
    }, []);

    // 센서 데이터 자동 요청 시작
    const startSensorDataRequests = useCallback(() => {
        if (sensorRequestTimer.current) return;

        sensorRequestTimer.current = setInterval(async () => {
            try {
                await signalRService.requestSensorData();
            } catch (error) {
                console.error('센서 데이터 요청 오류:', error);
            }
        }, 1000); // 1초마다 요청

        addLog('센서 데이터 자동 요청 시작', 'info');
    }, [addLog]);

    // 센서 데이터 자동 요청 중지
    const stopSensorDataRequests = useCallback(() => {
        if (sensorRequestTimer.current) {
            clearInterval(sensorRequestTimer.current);
            sensorRequestTimer.current = null;
            addLog('센서 데이터 자동 요청 중지', 'info');
        }
    }, [addLog]);

    // PLC 연결
    const connectToPLC = useCallback(async () => {
        if (isConnecting) return;

        try {
            setIsConnecting(true);
            setError(null);

            addLog(`PLC 연결 시도: ${plcConfig.ip}:${plcConfig.port}`, 'info');

            const success = await signalRService.connectToPLC(plcConfig.ip, plcConfig.port);

            if (!success) {
                throw new Error('PLC 연결 실패');
            }
        } catch (error) {
            addLog(`PLC 연결 실패: ${error.message}`, 'error');
            setError(error.message);
        } finally {
            setIsConnecting(false);
        }
    }, [isConnecting, plcConfig, addLog]);

    // PLC 연결 해제
    const disconnectFromPLC = useCallback(async () => {
        try {
            addLog('PLC 연결 해제 중...', 'info');
            await signalRService.disconnectFromPLC();
            stopSensorDataRequests();
        } catch (error) {
            addLog(`PLC 연결 해제 실패: ${error.message}`, 'error');
            setError(error.message);
        }
    }, [addLog, stopSensorDataRequests]);

    // 수동 제어 명령들
    const sendCommand = useCallback(async (commandName, value = 1) => {
        try {
            addLog(`${commandName} 명령 전송 (값: ${value})`, 'info');

            switch (commandName) {
                case 'liftUp':
                    await signalRService.liftUp(value);
                    break;
                case 'liftDown':
                    await signalRService.liftDown(value);
                    break;
                case 'moveLeft':
                    await signalRService.moveLeft(value);
                    break;
                case 'moveRight':
                    await signalRService.moveRight(value);
                    break;
                case 'emergencyStop':
                    await signalRService.emergencyStop();
                    break;
                default:
                    throw new Error(`알 수 없는 명령: ${commandName}`);
            }
        } catch (error) {
            addLog(`명령 전송 실패: ${error.message}`, 'error');
            setError(error.message);
        }
    }, [addLog]);

    // 에러 클리어
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // 로그 클리어
    const clearLogs = useCallback(() => {
        setLogs([]);
        addLog('로그 초기화됨', 'info');
    }, [addLog]);

    return {
        // 상태
        isSignalRConnected,
        isPLCConnected,
        isConnecting,
        isAuthenticated,
        error,
        lastError,
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
        clearLogs,

        // 유틸리티
        addLog
    };
};