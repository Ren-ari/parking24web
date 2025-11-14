import * as signalR from "@microsoft/signalr";
import siteConfig from '../../config/gapEulMyeongGaConfig.js';


class SignalRService {
    constructor() {
        this.connection = null;
        this.isConnected = false;
        this.callbacks = new Map();

        // 이벤트 콜백 저장소
        this.onConnectionChanged = null;
        this.onSensorDataUpdate = null;
        this.onError = null;
        this.onPLCAuthenticated = null;
        this.onCommandExecuted = null;
        this.onCurrentSiteConfiguration = null; // 새로 추가
    }

    // SignalR 연결 초기화
    async initialize() {
        try {
            // 환경별 SignalR URL 자동 생성
            const getSignalRUrl = () => {
                const currentHost = window.location.host;
                const currentProtocol = window.location.protocol;

                // 개발환경 감지 (포트 5173은 Vite 개발서버)
                if (currentHost.includes(':5173')) {
                    const signalRPort = siteConfig.api.devPort || '5123';
                    return `${currentProtocol}//localhost:${signalRPort}/plcHub`;
                }

                // 프로덕션 환경 (상대경로 사용)
                return "/plcHub";
            };

            // 연결 빌더 설정
            this.connection = new signalR.HubConnectionBuilder()
                .withUrl(getSignalRUrl(), {
                    withCredentials: true,
                    transport: signalR.HttpTransportType.WebSockets
                })
                .withAutomaticReconnect([0, 2000, 10000, 30000])
                .configureLogging(signalR.LogLevel.Information)
                .build();

            this.setupEventHandlers();
            await this.connection.start();
            this.isConnected = true;
            console.log("SignalR 연결 성공!");

            return true;
        } catch (error) {
            console.error("SignalR 연결 실패:", error);
            this.isConnected = false;
            return false;
        }
    }

    // 이벤트 핸들러 설정
    setupEventHandlers() {
        if (!this.connection) return;

        // PLC 연결 상태 변경
        this.connection.on("PLCConnectionChanged", (connected) => {
            console.log(`PLC 연결 상태: ${connected ? "연결됨" : "연결해제"}`);
            if (this.onConnectionChanged) {
                this.onConnectionChanged(connected);
            }
        });

        // 센서 데이터 업데이트
        this.connection.on("SensorDataUpdate", (data) => {
            // 센서 데이터 로그는 제거 (너무 빈번함)
            if (this.onSensorDataUpdate) {
                this.onSensorDataUpdate(data);
            }
        });

        // PLC 인증 결과
        this.connection.on("PLCAuthenticated", (authenticated) => {
            console.log(`PLC 인증: ${authenticated ? "성공" : "실패"}`);
            if (this.onPLCAuthenticated) {
                this.onPLCAuthenticated(authenticated);
            }
        });

        // 명령 실행 완료
        this.connection.on("CommandExecuted", (command) => {
            // 명령 실행 로그 제거 (너무 빈번함)
            if (this.onCommandExecuted) {
                this.onCommandExecuted(command);
            }
        });

        // 에러 처리
        this.connection.on("Error", (message) => {
            console.error("서버 에러:", message);
            if (this.onError) {
                this.onError(message);
            }
        });

        // 현장 설정 정보 수신 (새로 추가)
        this.connection.on("CurrentSiteConfiguration", (config) => {
            // 현장 설정 정보 로그 제거 (불필요)
            if (this.onCurrentSiteConfiguration) {
                this.onCurrentSiteConfiguration(config);
            }
        });

        // 현장 설정 로드 완료 (기존)
        this.connection.on("SiteConfigLoaded", (config) => {
            // 현장 설정 로드 로그 제거 (불필요)
        });

        // 연결 상태 관리
        this.connection.onreconnecting((error) => {
            console.warn("SignalR 재연결 중...", error);
            this.isConnected = false;
        });

        this.connection.onreconnected((connectionId) => {
            console.log("SignalR 재연결 성공:", connectionId);
            this.isConnected = true;
        });

        this.connection.onclose((error) => {
            console.error("SignalR 연결 끊김:", error);
            this.isConnected = false;
        });
    }

    // PLC 연결
    async connectToPLC(ip, port) {
        try {
            if (!this.connection || !this.isConnected) {
                throw new Error("SignalR 연결이 필요합니다");
            }

            const result = await this.connection.invoke("ConnectToPLC", ip, port);
            return result;
        } catch (error) {
            console.error("PLC 연결 실패:", error);
            throw error;
        }
    }

    // Config 기반 PLC 연결 (새로 추가)
    async connectToPLCFromConfig() {
        try {
            if (!this.connection || !this.isConnected) {
                throw new Error("SignalR 연결이 필요합니다");
            }

            const result = await this.connection.invoke("ConnectToPLCFromConfig");
            return result;
        } catch (error) {
            console.error("Config 기반 PLC 연결 실패:", error);
            throw error;
        }
    }

    // PLC 연결 해제
    async disconnectFromPLC() {
        try {
            if (!this.connection || !this.isConnected) return;

            await this.connection.invoke("DisconnectFromPLC");
        } catch (error) {
            console.error("PLC 연결 해제 실패:", error);
            throw error;
        }
    }

    // PLC 상태 확인
    async getPLCStatus() {
        try {
            if (!this.connection || !this.isConnected) return false;

            return await this.connection.invoke("GetPLCStatus");
        } catch (error) {
            console.error("PLC 상태 확인 실패:", error);
            return false;
        }
    }

    // 현재 사이트 설정 요청 (새로 추가)
    async getCurrentSiteConfiguration() {
        try {
            if (!this.connection || !this.isConnected) return;

            await this.connection.invoke("GetCurrentSiteConfiguration");
        } catch (error) {
            console.error("사이트 설정 요청 실패:", error);
            throw error;
        }
    }

    // 센서 데이터 요청
    async requestSensorData() {
        try {
            if (!this.connection || !this.isConnected) return;

            await this.connection.invoke("RequestSensorData");
        } catch (error) {
            console.error("센서 데이터 요청 실패:", error);
            throw error;
        }
    }

    // Config 기반 명령 전송 (새로 추가)
    async sendConfigCommand(commandName, value = 1) {
        try {
            if (!this.connection || !this.isConnected) {
                throw new Error("SignalR 연결이 필요합니다");
            }

            await this.connection.invoke("SendConfigCommand", commandName, value);
        } catch (error) {
            console.error("Config 명령 전송 실패:", error);
            throw error;
        }
    }

    // 수동 제어 명령들 - Config 기반으로 업데이트
    async liftUp(value = 1) {
        await this.connection?.invoke("LiftUp", value);
    }

    async liftDown(value = 1) {
        await this.connection?.invoke("LiftDown", value);
    }

    async moveLeft(value = 1) {
        await this.connection?.invoke("MoveLeft", value);
    }

    async moveRight(value = 1) {
        await this.connection?.invoke("MoveRight", value);
    }

    async emergencyStop(value = 1) {
        await this.connection?.invoke("EmergencyStop", value);
    }

    async errorReset(value = 1) {
        await this.connection?.invoke("ErrorReset", value);
    }

    async remoteControl(value = 1) {
        await this.connection?.invoke("RemoteControl", value);
    }

    async homeReturn(value = 1) {
        await this.connection?.invoke("HomeReturn", value);
    }

    async paletteChange(value = 1) {
        await this.connection?.invoke("PaletteChange", value);
    }

    // 턴테이블 제어 - 새 메서드명으로 업데이트
    async turnLeft(value = 1) {
        await this.connection?.invoke("TurnLeft", value);
    }

    async turnRight(value = 1) {
        await this.connection?.invoke("TurnRight", value);
    }

    // 도어 제어 - 새 메서드명으로 업데이트
    async doorOpen(value = 1) {
        await this.connection?.invoke("DoorOpen", value);
    }

    async doorClose(value = 1) {
        await this.connection?.invoke("DoorClose", value);
    }

    // 락킹 제어 - 새 메서드명으로 업데이트
    async lockingOn(value = 1) {
        await this.connection?.invoke("LockingOn", value);
    }

    async lockingOff(value = 1) {
        await this.connection?.invoke("LockingOff", value);
    }

    // ===== 백워드 호환성 (구 메서드명들) =====
    // 기존 코드가 있을 수 있으니 Deprecated로 유지

    async operationMode(value = 1) {
        // Deprecated 경고 메시지 제거
        await this.connection?.invoke("OperationMode", value);
    }

    async recovery(value = 1) {
        // Deprecated 경고 메시지 제거
        await this.connection?.invoke("Recovery", value);
    }

    async turnTableLeft(value = 1) {
        // Deprecated 경고 메시지 제거
        await this.connection?.invoke("TurnTableLeft", value);
    }

    async turnTableRight(value = 1) {
        // Deprecated 경고 메시지 제거
        await this.connection?.invoke("TurnTableRight", value);
    }

    async turnTableUp(value = 1) {
        // Deprecated 경고 메시지 제거
        await this.connection?.invoke("TurnTableUp", value);
    }

    async turnTableDown(value = 1) {
        // Deprecated 경고 메시지 제거
        await this.connection?.invoke("TurnTableDown", value);
    }

    async leftLiftLock(value = 1) {
        // Deprecated 경고 메시지 제거
        await this.connection?.invoke("LeftLiftLock", value);
    }

    async leftLiftUnlock(value = 1) {
        // Deprecated 경고 메시지 제거
        await this.connection?.invoke("LeftLiftUnlock", value);
    }

    async rightLiftLock(value = 1) {
        // Deprecated 경고 메시지 제거
        await this.connection?.invoke("RightLiftLock", value);
    }

    async rightLiftUnlock(value = 1) {
        // Deprecated 경고 메시지 제거
        await this.connection?.invoke("RightLiftUnlock", value);
    }

    // SignalR 연결 종료
    async disconnect() {
        try {
            if (this.connection) {
                await this.connection.stop();
                this.connection = null;
                this.isConnected = false;
                console.log("SignalR 연결 종료");
            }
        } catch (error) {
            console.error("SignalR 연결 종료 실패:", error);
        }
    }
}

// 싱글톤 인스턴스 생성
const signalRService = new SignalRService();

export default signalRService;