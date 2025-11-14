import { useState, useEffect, useCallback, useRef } from 'react';
import signalRService from '../services/signalrService';

export const usePLCConnection = () => {
    // 연결 상태
    const [isSignalRConnected, setIsSignalRConnected] = useState(false);
    const [isPLCConnected, setIsPLCConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    // PLC 연결 설정
    const [plcConfig, setPLCConfig] = useState({
        ip: '',
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

    // 자동 센서 데이터 요청용 타이머
    const sensorRequestTimer = useRef(null);

    // SignalR 이벤트 핸들러 설정
    useEffect(() => {
        const setupEventHandlers = () => {
            // PLC 연결 상태 변경
            signalRService.onConnectionChanged = (connected) => {
                setIsPLCConnected(connected);
                console.log(`PLC ${connected ? '연결됨' : '연결 해제됨'}`);

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
            };

            // PLC 인증 결과
            signalRService.onPLCAuthenticated = (authenticated) => {
                setIsAuthenticated(authenticated);
                console.log(`PLC 인증 ${authenticated ? '성공' : '실패'}`);
            };

            // 명령 실행 완료
            signalRService.onCommandExecuted = (command) => {
                console.log(`명령 실행: ${command.commandType} ${command.deviceType}${command.address} = ${command.value}`);
            };

            // 에러 처리
            signalRService.onError = (message) => {
                setError(message);
                console.error(`오류: ${message}`);

                // 5초 후 에러 메시지 자동 제거
                setTimeout(() => setError(null), 5000);
            };
        };

        setupEventHandlers();

        return () => {
            stopSensorDataRequests();
        };
    }, []);

    // SignalR 초기 연결
    useEffect(() => {
        const initializeSignalR = async () => {
            try {
                console.log('SignalR 연결 초기화 중...');
                const success = await signalRService.initialize();
                setIsSignalRConnected(success);

                if (success) {
                    console.log('SignalR 연결 성공');
                } else {
                    console.error('SignalR 연결 실패');
                }
            } catch (error) {
                console.error(`SignalR 초기화 오류: ${error.message}`);
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

        console.log('센서 데이터 자동 요청 시작');
    }, []);

    // 센서 데이터 자동 요청 중지
    const stopSensorDataRequests = useCallback(() => {
        if (sensorRequestTimer.current) {
            clearInterval(sensorRequestTimer.current);
            sensorRequestTimer.current = null;
            console.log('센서 데이터 자동 요청 중지');
        }
    }, []);

    // PLC 연결
    const connectToPLC = useCallback(async (ip, port) => {
        if (isConnecting) return;

        // 파라미터로 받은 값이 있으면 state도 같이 업데이트
        const targetIp = ip || plcConfig.ip;
        const targetPort = port || plcConfig.port;

        // 여기 추가 - state 동기화
        if (ip && port) {
            setPLCConfig({ ip, port });
        }

        try {
            setIsConnecting(true);
            setError(null);
            console.log(`PLC 연결 시도: ${targetIp}:${targetPort}`);
            const success = await signalRService.connectToPLC(targetIp, targetPort);
            if (!success) {
                throw new Error('PLC 연결 실패');
            }
        } catch (error) {
            console.error(`PLC 연결 실패: ${error.message}`);
            setError(error.message);
        } finally {
            setIsConnecting(false);
        }
    }, [isConnecting, plcConfig.ip, plcConfig.port]);

    // PLC 연결 해제
    const disconnectFromPLC = useCallback(async () => {
        try {
            console.log('PLC 연결 해제 중...');
            await signalRService.disconnectFromPLC();
            stopSensorDataRequests();
        } catch (error) {
            console.error(`PLC 연결 해제 실패: ${error.message}`);
            setError(error.message);
        }
    }, [stopSensorDataRequests]);

    // 에러 클리어
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        // 상태
        isSignalRConnected,
        isPLCConnected,
        isConnecting,
        isAuthenticated,
        error,
        sensorData,

        // 설정
        plcConfig,
        setPLCConfig,

        // 액션
        connectToPLC,
        disconnectFromPLC,
        clearError
    };
};