import * as signalR from "@microsoft/signalr";
import siteConfig from '../../config/sokcho2Config.js';

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
        this.onCurrentSiteConfiguration = null;
    }

    // SignalR 연결 초기화
    async initialize() {
        try {
            const getSignalRUrl = () => {
                const currentHost = window.location.host;
                const currentProtocol = window.location.protocol;

                if (currentHost.includes(':5173')) {
                    const signalRPort = siteConfig.api.devPort || '5123';
                    return `${currentProtocol}//localhost:${signalRPort}/plcHub`;
                }

                return "/plcHub";
            };

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

        this.connection.on("PLCConnectionChanged", (connected) => {
            console.log(`PLC 연결 상태: ${connected ? "연결됨" : "연결해제"}`);
            if (this.onConnectionChanged) {
                this.onConnectionChanged(connected);
            }
        });

        this.connection.on("SensorDataUpdate", (data) => {
            if (this.onSensorDataUpdate) {
                this.onSensorDataUpdate(data);
            }
        });

        this.connection.on("PLCAuthenticated", (authenticated) => {
            console.log(`PLC 인증: ${authenticated ? "성공" : "실패"}`);
            if (this.onPLCAuthenticated) {
                this.onPLCAuthenticated(authenticated);
            }
        });

        this.connection.on("CommandExecuted", (command) => {
            console.log("명령 실행 완료:", command);
            if (this.onCommandExecuted) {
                this.onCommandExecuted(command);
            }
        });

        this.connection.on("Error", (message) => {
            console.error("서버 에러:", message);
            if (this.onError) {
                this.onError(message);
            }
        });

        this.connection.on("CurrentSiteConfiguration", (config) => {
            console.log("현장 설정 정보:", config);
            if (this.onCurrentSiteConfiguration) {
                this.onCurrentSiteConfiguration(config);
            }
        });

        this.connection.on("SiteConfigLoaded", (config) => {
            console.log("현장 설정 로드:", config);
        });

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

    // Config 기반 PLC 연결
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

    // 현재 사이트 설정 요청
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

    /**
     * Config 기반 명령 전송 (개선 버전)
     * @param {string} commandName - 명령 이름
     * @param {number} value - 명령 값 (0 or 1)
     * @param {object} options - 추가 옵션
     * @param {string} options.commandId - 명령 고유 ID
     * @param {string} options.idempotencyKey - 멱등성 키
     * @param {string} options.resourceKey - 리소스 키
     * @param {boolean} options.immediate - 즉시 실행 플래그
     * @returns {Promise<CommandResult>}
     */
    async sendConfigCommand(commandName, value, options = {}) {
        try {
            if (!this.connection || !this.isConnected) {
                throw new Error("SignalR 연결이 필요합니다");
            }

            // 기본값 설정
            const commandId = options.commandId || this.generateCommandId();
            const idempotencyKey = options.idempotencyKey || this.generateIdempotencyKey(commandName, value);
            const resourceKey = options.resourceKey || this.getResourceKey(commandName);
            const immediate = options.immediate !== undefined ? options.immediate : (value === 0);

            const request = {
                commandName,
                value,
                commandId,
                idempotencyKey,
                resourceKey,
                immediate
            };

            console.log(`[${commandId}] 명령 전송 요청:`, request);

            // SignalR invoke (CommandResult 반환)
            const result = await this.connection.invoke("SendConfigCommand", request);

            console.log(`[${commandId}] 명령 응답:`, result);

            return result;

        } catch (error) {
            console.error("Config 명령 전송 실패:", error);
            throw error;
        }
    }

    /**
     * 명령 ID 생성
     */
    generateCommandId() {
        return `cmd_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    /**
     * 멱등성 키 생성
     */
    generateIdempotencyKey(commandName, value) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        return `${commandName}_${value}_${timestamp}_${random}`;
    }

    /**
     * 명령 이름에서 리소스 키 추출
     */
    getResourceKey(commandName) {
        const cmd = commandName.toLowerCase();
        if (cmd.includes('lift')) return 'lift';
        if (cmd.includes('door')) return 'door';
        if (cmd.includes('turn')) return 'turn';
        if (cmd.includes('move')) return 'traverse';
        if (cmd.includes('locking')) return 'locking';
        return 'system';
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