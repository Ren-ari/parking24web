import * as signalR from "@microsoft/signalr";

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
    }

    // SignalR 연결 초기화
    async initialize() {
        try {
            // 연결 빌더 설정
            this.connection = new signalR.HubConnectionBuilder()
                .withUrl("http://localhost:5124/plcHub", {
                    withCredentials: true,
                    transport: signalR.HttpTransportType.WebSockets
                })
                .withAutomaticReconnect([0, 2000, 10000, 30000])
                .configureLogging(signalR.LogLevel.Information)
                .build();

            // 이벤트 핸들러 등록
            this.setupEventHandlers();

            // 연결 시작
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
            console.log("센서 데이터 업데이트:", data);
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
            console.log("명령 실행 완료:", command);
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

        // 현장 설정 로드 완료
        this.connection.on("SiteConfigLoaded", (config) => {
            console.log("현장 설정 로드:", config);
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

    // PLC 명령 전송
    async sendPLCCommand(commandType, deviceType, address, value, bitPosition = 0) {
        try {
            if (!this.connection || !this.isConnected) {
                throw new Error("SignalR 연결이 필요합니다");
            }

            const command = {
                commandType,
                deviceType,
                address,
                bitPosition,
                value
            };

            await this.connection.invoke("SendPLCCommand", command);
        } catch (error) {
            console.error("PLC 명령 전송 실패:", error);
            throw error;
        }
    }

    // 수동 제어 명령들
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

    async emergencyStop() {
        await this.connection?.invoke("EmergencyStop");
    }

    // 현장 설정 로드
    async loadSiteConfig(config) {
        try {
            if (!this.connection || !this.isConnected) return;
            
            await this.connection.invoke("LoadSiteConfig", config);
        } catch (error) {
            console.error("현장 설정 로드 실패:", error);
            throw error;
        }
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