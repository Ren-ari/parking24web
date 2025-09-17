import React, { useState, useEffect } from 'react';

const ManualControl = ({ isPLCConnected, isAuthenticated, sendCommand, sensorData }) => {
    const [activeCommand, setActiveCommand] = useState(null);
    const [isEmergencyMode, setIsEmergencyMode] = useState(false);
    const [activeTab, setActiveTab] = useState('page1');
    const [showSensors, setShowSensors] = useState(true);
    const [sensorStates, setSensorStates] = useState({});

    // AI parking 프로젝트의 센서 정의를 기반으로 한 센서 상태 업데이트
    const updateSensorStates = () => {
        if (!sensorData || !sensorData.rawData) return;
        
        // AI parking 프로젝트의 센서 정의를 기반으로 한 매핑
        const sensorMappings = {
            // 도어/턴테이블 탭 (page1) - 인풋 센서들
            'PC_Up': { wordIndex: 23, bitIndex: 0, address: 'm34.0', name: 'PC_상승' },
            'PC_Down': { wordIndex: 23, bitIndex: 1, address: 'm34.1', name: 'PC_하강' },
            'PC_ErrorReset': { wordIndex: 23, bitIndex: 5, address: 'm34.5', name: 'PC_에러해제' },
            'PC_TurnLeft': { wordIndex: 23, bitIndex: 7, address: 'm34.7', name: 'PC_턴좌회전' },
            'PC_TurnRight': { wordIndex: 23, bitIndex: 8, address: 'm34.8', name: 'PC_턴우회전' },
            'PC_TurnLock': { wordIndex: 23, bitIndex: 9, address: 'm34.9', name: 'PC_턴잠김' },
            'PC_TurnUnlock': { wordIndex: 23, bitIndex: 10, address: 'm34.A', name: 'PC_턴해제' },
            'PC_DoorOpen': { wordIndex: 23, bitIndex: 11, address: 'm34.B', name: 'PC_도어열림' },
            'PC_DoorClose': { wordIndex: 23, bitIndex: 12, address: 'm34.C', name: 'PC_도어닫힘' },
            'PC_Emergency': { wordIndex: 23, bitIndex: 13, address: 'm34.D', name: 'PC_비상스위치' },
            'LevelUp': { wordIndex: 64, bitIndex: 8, address: 'P14.8', name: '레벨 상' },
            'LevelDown': { wordIndex: 64, bitIndex: 9, address: 'P14.9', name: '레벨 하' },
            'HomePosition': { wordIndex: 63, bitIndex: 3, address: 'P13.3', name: '홈위치' },
            'TurnPosition': { wordIndex: 63, bitIndex: 15, address: 'P13.F', name: '턴회전위치' },
            'TurnLock': { wordIndex: 64, bitIndex: 6, address: 'P14.6', name: '턴잠김' },
            'TurnUnlock': { wordIndex: 64, bitIndex: 7, address: 'P14.7', name: '턴해제' },
            'Turn0Check': { wordIndex: 62, bitIndex: 0, address: 'P13.4', name: '턴0도확인' },
            'Turn180Check': { wordIndex: 62, bitIndex: 1, address: 'P13.5', name: '턴180도확인' },
            'Turn90Check': { wordIndex: 62, bitIndex: 2, address: 'P13.6', name: '턴90도확인' },
            'TurnLeftStop': { wordIndex: 62, bitIndex: 3, address: 'P13.7', name: '턴좌정지' },
            'TurnRightStop': { wordIndex: 62, bitIndex: 4, address: 'P13.8', name: '턴우정지' },
            'L_INV_RUN': { wordIndex: 61, bitIndex: 2, address: 'P11.2', name: 'L_INV RUN' },
            'L_INV_FLT': { wordIndex: 62, bitIndex: 6, address: 'P12.6', name: 'L_INV FLT' },
            'P_INV_RUN': { wordIndex: 63, bitIndex: 0, address: 'P13.0', name: 'P_INV RUN' },
            'P_INV_FLT': { wordIndex: 63, bitIndex: 1, address: 'P13.1', name: 'P_INV FLT' },
            'DoorOpenCheck': { wordIndex: 60, bitIndex: 10, address: 'P10.A', name: '도어열림확인' },
            'DoorCloseCheck': { wordIndex: 60, bitIndex: 11, address: 'P10.B', name: '도어닫힘확인' },
            'PitSensorOdd': { wordIndex: 61, bitIndex: 6, address: 'P11.6', name: '피트센서(홀)' },
            'PitSensorEven': { wordIndex: 61, bitIndex: 7, address: 'P11.7', name: '피트센서(짝)' },
            'HookCenterFront': { wordIndex: 64, bitIndex: 0, address: 'P14.0', name: '후크중앙(전)' },
            'HookCenterBack': { wordIndex: 64, bitIndex: 1, address: 'P14.1', name: '후크중앙(후)' },
            'OddPalletStop': { wordIndex: 64, bitIndex: 2, address: 'P14.2', name: '홀수파렛정지' },
            'EvenPalletStop': { wordIndex: 64, bitIndex: 3, address: 'P14.3', name: '짝수파렛정지' },
            'PalletDetectOdd': { wordIndex: 64, bitIndex: 4, address: 'P14.4', name: '파렛감지(홀)' },
            'PalletDetectEven': { wordIndex: 64, bitIndex: 5, address: 'P14.5', name: '파렛감지(짝)' },
            
            // 승강 제어 탭 (page2) - 인풋 센서들
            'PC_Up': { wordIndex: 23, bitIndex: 0, address: 'm34.0', name: 'PC_상승' },
            'PC_Down': { wordIndex: 23, bitIndex: 1, address: 'm34.1', name: 'PC_하강' },
            'PC_ErrorReset': { wordIndex: 23, bitIndex: 5, address: 'm34.5', name: 'PC_에러해제' },
            'PC_Emergency': { wordIndex: 23, bitIndex: 13, address: 'm34.D', name: 'PC_비상스위치' },
            'L_INV_RUN': { wordIndex: 61, bitIndex: 2, address: 'P11.2', name: 'L_INV RUN' },
            'L_INV_FLT': { wordIndex: 62, bitIndex: 6, address: 'P12.6', name: 'L_INV FLT' },
            'LevelUp': { wordIndex: 64, bitIndex: 8, address: 'P14.8', name: '레벨 상' },
            'LevelDown': { wordIndex: 64, bitIndex: 9, address: 'P14.9', name: '레벨 하' },
            'DoorCloseCheck': { wordIndex: 60, bitIndex: 11, address: 'P10.B', name: '도어닫힘확인' },
            'PitSensorOdd': { wordIndex: 61, bitIndex: 6, address: 'P11.6', name: '피트센서(홀)' },
            'PitSensorEven': { wordIndex: 61, bitIndex: 7, address: 'P11.7', name: '피트센서(짝)' },
            'Turn0Check': { wordIndex: 62, bitIndex: 0, address: 'P13.4', name: '턴0도확인' },
            'Turn180Check': { wordIndex: 62, bitIndex: 1, address: 'P13.5', name: '턴180도확인' },
            'Turn90Check': { wordIndex: 62, bitIndex: 2, address: 'P13.6', name: '턴90도확인' },
            'TurnLeftStop': { wordIndex: 62, bitIndex: 3, address: 'P13.7', name: '턴좌정지' },
            'TurnRightStop': { wordIndex: 62, bitIndex: 4, address: 'P13.8', name: '턴우정지' },
            'HookCenterFront': { wordIndex: 64, bitIndex: 0, address: 'P14.0', name: '후크중앙(전)' },
            'HookCenterBack': { wordIndex: 64, bitIndex: 1, address: 'P14.1', name: '후크중앙(후)' },
            'OddPalletStop': { wordIndex: 64, bitIndex: 2, address: 'P14.2', name: '홀수파렛정지' },
            'EvenPalletStop': { wordIndex: 64, bitIndex: 3, address: 'P14.3', name: '짝수파렛정지' },
            'PalletDetectOdd': { wordIndex: 64, bitIndex: 4, address: 'P14.4', name: '파렛감지(홀)' },
            'PalletDetectEven': { wordIndex: 64, bitIndex: 5, address: 'P14.5', name: '파렛감지(짝)' },
         
            // 횡행/락킹 탭 (page3) - 인풋 센서들
            'PC_LeftMove': { wordIndex: 23, bitIndex: 2, address: 'm34.2', name: 'PC_좌행' },
            'PC_RightMove': { wordIndex: 23, bitIndex: 3, address: 'm34.3', name: 'PC_우행' },
            'PC_ErrorReset': { wordIndex: 23, bitIndex: 5, address: 'm34.5', name: 'PC_에러해제' },
            'PC_Emergency': { wordIndex: 23, bitIndex: 13, address: 'm34.D', name: 'PC_비상스위치' },
            'LevelUp': { wordIndex: 64, bitIndex: 8, address: 'P14.8', name: '레벨 상' },
            'LevelDown': { wordIndex: 64, bitIndex: 9, address: 'P14.9', name: '레벨 하' },
            'PalletDetectOdd': { wordIndex: 64, bitIndex: 4, address: 'P14.4', name: '파렛감지(홀)' },
            'PalletDetectEven': { wordIndex: 64, bitIndex: 5, address: 'P14.5', name: '파렛감지(짝)' },
            'DoorCloseCheck': { wordIndex: 60, bitIndex: 11, address: 'P10.B', name: '도어닫힘확인' },
            'PitSensorOdd': { wordIndex: 61, bitIndex: 6, address: 'P11.6', name: '피트센서(홀)' },
            'PitSensorEven': { wordIndex: 61, bitIndex: 7, address: 'P11.7', name: '피트센서(짝)' },    
            'TurnLeftStop': { wordIndex: 62, bitIndex: 3, address: 'P13.7', name: '턴좌정지' },
            'TurnRightStop': { wordIndex: 62, bitIndex: 4, address: 'P13.8', name: '턴우정지' },
            'P_INV_RUN': { wordIndex: 63, bitIndex: 0, address: 'P13.0', name: 'P_INV RUN' },
            'P_INV_FLT': { wordIndex: 63, bitIndex: 1, address: 'P13.1', name: 'P_INV FLT' },
            'HookCenterFront': { wordIndex: 64, bitIndex: 0, address: 'P14.0', name: '후크중앙(전)' },
            'HookCenterBack': { wordIndex: 64, bitIndex: 1, address: 'P14.1', name: '후크중앙(후)' },
            'OddPalletStop': { wordIndex: 64, bitIndex: 2, address: 'P14.2', name: '홀수파렛정지' },
            'EvenPalletStop': { wordIndex: 64, bitIndex: 3, address: 'P14.3', name: '짝수파렛정지' },

            // 아웃풋 센서들 (출력 상태)
            // 도어/턴테이블 탭 아웃풋
            'L_INV_Forward': { wordIndex: 70, bitIndex: 0, address: 'P20.0', name: 'L_INV 정' },
            'L_INV_Reverse': { wordIndex: 70, bitIndex: 1, address: 'P20.1', name: 'L_INV 역' },
            'L_INV_S3': { wordIndex: 70, bitIndex: 2, address: 'P20.2', name: 'L_INV S3' },
            'L_INV_S4': { wordIndex: 70, bitIndex: 3, address: 'P20.3', name: 'L_INV S4' },
            'L_INV_S5': { wordIndex: 70, bitIndex: 4, address: 'P20.4', name: 'L_INV S5' },
            'L_INV_S6': { wordIndex: 70, bitIndex: 5, address: 'P20.5', name: 'L_INV S6' },
            'L_INV_S7': { wordIndex: 70, bitIndex: 6, address: 'P20.6', name: 'L_INV S7' },
            'L_INV_S8': { wordIndex: 70, bitIndex: 7, address: 'P20.7', name: 'L_INV S8' },
            'LiftMC': { wordIndex: 71, bitIndex: 0, address: 'P21.0', name: '리프트MC' },
            'LiftBK': { wordIndex: 71, bitIndex: 1, address: 'P21.1', name: '리프트BK' },
            'DoorOpenMC': { wordIndex: 71, bitIndex: 2, address: 'P21.2', name: '도어열림MC' },
            'DoorCloseMC': { wordIndex: 71, bitIndex: 3, address: 'P21.3', name: '도어닫힘MC' },
            'TurnMC': { wordIndex: 71, bitIndex: 4, address: 'P21.4', name: '턴MC' },
            'TurnBK': { wordIndex: 71, bitIndex: 5, address: 'P21.5', name: '턴BK' },
            'TurnLockMC': { wordIndex: 72, bitIndex: 12, address: 'P22.C', name: '턴락MC' },
            'TurnUnlockMC': { wordIndex: 72, bitIndex: 13, address: 'P22.D', name: '턴언락MC' },
            'P_INV_Forward': { wordIndex: 72, bitIndex: 0, address: 'P22.0', name: 'P_INV 정' },
            'P_INV_Reverse': { wordIndex: 72, bitIndex: 1, address: 'P22.1', name: 'P_INV 역' },
            'P_INV_S3': { wordIndex: 72, bitIndex: 2, address: 'P22.2', name: 'P_INV S3' },
            'P_INV_S4': { wordIndex: 72, bitIndex: 3, address: 'P22.3', name: 'P_INV S4' },
            'P_INV_S5': { wordIndex: 72, bitIndex: 4, address: 'P22.4', name: 'P_INV S5' },
            'P_INV_S6': { wordIndex: 72, bitIndex: 5, address: 'P22.5', name: 'P_INV S6' },
            'P_INV_S7': { wordIndex: 72, bitIndex: 6, address: 'P22.6', name: 'P_INV S7' },
   
            // 승강 제어 탭 아웃풋
            'L_INV_Forward': { wordIndex: 70, bitIndex: 0, address: 'P20.0', name: 'L_INV 정' },
            'L_INV_Reverse': { wordIndex: 70, bitIndex: 1, address: 'P20.1', name: 'L_INV 역' },
            'L_INV_S3': { wordIndex: 70, bitIndex: 2, address: 'P20.2', name: 'L_INV S3' },
            'L_INV_S4': { wordIndex: 70, bitIndex: 3, address: 'P20.3', name: 'L_INV S4' },
            'L_INV_S5': { wordIndex: 70, bitIndex: 4, address: 'P20.4', name: 'L_INV S5' },
            'L_INV_S6': { wordIndex: 70, bitIndex: 5, address: 'P20.5', name: 'L_INV S6' },
            'L_INV_S7': { wordIndex: 70, bitIndex: 6, address: 'P20.6', name: 'L_INV S7' },
            'L_INV_S8': { wordIndex: 70, bitIndex: 7, address: 'P20.7', name: 'L_INV S8' },
            'LiftMC': { wordIndex: 71, bitIndex: 0, address: 'P21.0', name: '리프트MC' },
            'LiftBK': { wordIndex: 71, bitIndex: 1, address: 'P21.1', name: '리프트BK' },
            
            // 횡행/락킹 탭 아웃풋
            'P_INV_Forward': { wordIndex: 72, bitIndex: 0, address: 'P22.0', name: 'P_INV 정' },
            'P_INV_Reverse': { wordIndex: 72, bitIndex: 1, address: 'P22.1', name: 'P_INV 역' },
            'P_INV_S3': { wordIndex: 72, bitIndex: 2, address: 'P22.2', name: 'P_INV S3' },
            'P_INV_S4': { wordIndex: 72, bitIndex: 3, address: 'P22.3', name: 'P_INV S4' },
            'P_INV_S5': { wordIndex: 72, bitIndex: 4, address: 'P22.4', name: 'P_INV S5' },
            'P_INV_S6': { wordIndex: 72, bitIndex: 5, address: 'P22.5', name: 'P_INV S6' },
            'P_INV_S7': { wordIndex: 72, bitIndex: 6, address: 'P22.6', name: 'P_INV S7' },
            'HorizontalMoveMC': { wordIndex: 72, bitIndex: 8, address: 'P22.8', name: '횡행MC' },
            'HorizontalMoveBK': { wordIndex: 72, bitIndex: 9, address: 'P22.9', name: '횡행BK' }
        };
        
        const newStates = {};
        
        Object.entries(sensorMappings).forEach(([key, mapping]) => {
            if (mapping.wordIndex < sensorData.rawData.length) {
                const wordValue = sensorData.rawData[mapping.wordIndex];
                const bitValue = (wordValue >> mapping.bitIndex) & 1;
                newStates[key] = {
                    value: bitValue === 1,
                    address: mapping.address,
                    bitIndex: mapping.bitIndex,
                    wordIndex: mapping.wordIndex
                };
            } else {
                newStates[key] = {
                    value: false,
                    address: mapping.address,
                    bitIndex: mapping.bitIndex,
                    wordIndex: mapping.wordIndex
                };
            }
        });
        
        setSensorStates(newStates);
    };  

    // 센서 코드와 비트 정보를 표시하는 헬퍼 함수
    const getSensorCode = (sensorKey) => {
        const sensor = sensorStates[sensorKey];
        if (sensor) {
            return sensor.address;
        }
        return '--';
    };

    // 센서 상태를 확인하는 헬퍼 함수
    const getSensorValue = (sensorKey) => {
        const sensor = sensorStates[sensorKey];
        return sensor ? sensor.value : false;
    };

    // sensorData가 변경될 때마다 센서 상태 업데이트
    useEffect(() => {
        updateSensorStates();
    }, [sensorData]);

    const handleCommand = async (commandName) => {  // displayName 파라미터 제거
        if (!isPLCConnected || !isAuthenticated) return;
        try {
            setActiveCommand(commandName);
            await sendCommand(commandName);
            // 명령 실행 후 1초 뒤 활성 상태 해제
            setTimeout(() => setActiveCommand(null), 1000);
        } catch (error) {
            console.error('명령 실행 실패:', error);
            setActiveCommand(null);
        }
    };

    const handleEmergencyStop = async () => {
        try {
            setIsEmergencyMode(true);
            await sendCommand('emergencyStop');

            // 비상정지는 5초간 활성 표시
            setTimeout(() => setIsEmergencyMode(false), 5000);
        } catch (error) {
            console.error('비상정지 실행 실패:', error);
            setIsEmergencyMode(false);
        }
    };

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
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    max-width: 300px;
                    margin: 0 auto;
                }

                @media (min-width: 768px) {
                    .common-buttons-grid {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 16px;
                        justify-content: center;
                        max-width: none;
                    }
                }
                
                .mobile-locking-btn {
                    padding: 16px 20px;
                    font-size: 0.75rem;
                    min-width: 100px;
                }
                @media (min-width: 768px) {
                    .mobile-locking-btn {
                        padding: 12px 20px;
                        font-size: 0.75rem;
                        min-width: 80px;
                    }
                }
                
                .mobile-move-btn {
                    padding: 16px 24px;
                    font-size: 0.8rem;
                    min-width: 100px;
                }
                @media (min-width: 768px) {
                    .mobile-move-btn {
                        padding: 20px 32px;
                        font-size: 0.875rem;
                        min-width: 120px;
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
                    height: 85vh; /* Increased height */
                    transform: translateY(-50%);
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    box-shadow: -5px 0 20px rgba(0, 0, 0, 0.1);
                    transition: right 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    z-index: 1000;
                    overflow-y: auto;
                    padding: 20px;
                    border-radius: 20px 0 0 20px;
                    /* Hide scrollbar */
                    scrollbar-width: none; /* Firefox */
                    -ms-overflow-style: none; /* IE and Edge */
                }
                
                /* 태블릿 디스플레이 - 센서 패널 크기 줄이기 */
                @media (min-width: 768px) and (max-width: 1024px) {
                    .sensor-panel-right {
                        width: 160px;
                        height: 50vh;
                        padding: 8px;
                        top: 65%;
                    }
                }
                
                /* 모바일 디스플레이 - 센서 패널 숨기기 */
                @media (max-width: 767px) {
                    .sensor-panel-right {
                        display: none;
                    }
                }
                .sensor-panel-right::-webkit-scrollbar {
                    display: none; /* Chrome, Safari, Opera */
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
                    height: 85vh; /* Increased height */
                    transform: translateY(-50%);
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    box-shadow: 5px 0 20px rgba(0, 0, 0, 0.1);
                    transition: left 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    z-index: 1000;
                    overflow-y: auto;
                    padding: 20px;
                    border-radius: 0 20px 20px 0;
                    /* Hide scrollbar */
                    scrollbar-width: none; /* Firefox */
                    -ms-overflow-style: none; /* IE and Edge */
                }
                
                /* 태블릿 디스플레이 - 센서 패널 크기 줄이기 */
                @media (min-width: 768px) and (max-width: 1024px) {
                    .sensor-panel-left {
                        width: 160px;
                        height: 50vh;
                        padding: 8px;
                        top: 65%;
                    }
                }
                
                /* 모바일 디스플레이 - 센서 패널 숨기기 */
                @media (max-width: 767px) {
                    .sensor-panel-left {
                        display: none;
                    }
                }
                .sensor-panel-left::-webkit-scrollbar {
                    display: none; /* Chrome, Safari, Opera */
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
                
                .sensor-panel h3 {
                    color: #1e40af;
                    font-size: 1.5rem;
                    font-weight: bold;
                    margin-bottom: 20px;
                    text-align: center;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #3b82f6;
                }
                
                /* 태블릿에서 센서 패널 제목 크기 줄이기 */
                @media (min-width: 768px) and (max-width: 1024px) {
                    .sensor-panel h3 {
                        font-size: 1.1rem;
                        margin-bottom: 12px;
                        padding-bottom: 6px;
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
                
                /* 태블릿에서 센서 아이템 크기 줄이기 */
                @media (min-width: 768px) and (max-width: 1024px) {
                    .sensor-item {
                        padding: 12px;
                        margin-bottom: 12px;
                        border-radius: 16px;
                    }
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
                
                /* 태블릿에서 센서 코드 크기 줄이기 */
                @media (min-width: 768px) and (max-width: 1024px) {
                    .sensor-code {
                        font-size: 0.75rem;
                        min-width: 35px;
                    }
                }
                
                
                .sensor-name {
                    font-weight: 600;
                    color: #1f2937;
                    font-size: 0.9rem;
                    flex: 1;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
                }
                
                /* 태블릿에서 센서 이름 크기 줄이기 */
                @media (min-width: 768px) and (max-width: 1024px) {
                    .sensor-name {
                        font-size: 0.7rem;
                    }
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
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    align-items: center;
                    flex-wrap: wrap;
                }

                @media (min-width: 768px) {
                    .page1-layout {
                        gap: 80px;
                    }
                }

                @media (max-width: 768px) {
                    .page1-layout {
                        flex-direction: column;
                        gap: 120px;
                    }
                }

                .turn-table-section {
                    flex: 0 0 auto;
                    min-width: 300px;
                }

                .door-section {
                    flex: 0 0 auto;
                    min-width: 200px;
                }

                .door-vertical {
                    display: flex;
                    flex-direction: column;
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
                        display: flex;
                        flex-direction: column;
                        gap: 40px;
                        max-width: 500px;
                        margin: 0 auto;
                        align-items: center;
                    }
                    
                    .turn-table-section {
                        width: 100%;
                        display: flex;
                        justify-content: center;
                    }
                    
                    .door-section {
                        width: 100%;
                        display: flex;
                        justify-content: center;
                    }
                    
                    .turn-table-grid {
                        gap: 12px;
                        justify-content: center;
                    }
                    
                    .door-vertical {
                        gap: 25px;
                        align-items: center;
                    }
                }
                
                @media (max-width: 480px) {
                    .page1-layout {
                        gap: 30px;
                        max-width: 100%;
                    }
                }

            `}</style>
            <div className="bg-white rounded-2xl shadow-lg p-3 md:p-4 overflow-hidden border-2 border-gray-300" style={{
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
            }}>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-4 space-y-2 md:space-y-0">
                <h2 className="text-base md:text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 md:mb-0">수동 제어</h2>
                <div className="flex items-center flex-wrap gap-3 justify-end sm:justify-start">
                    {isDisabled && (
                        <div className="bg-red-100 border border-red-300 px-3 py-2 rounded-2xl shadow-md">
                            <span className="text-red-700 font-semibold text-sm">🚫 제어 불가</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 엔코더값과 카운터값 표시 */}
            <div className="mb-12 flex justify-center gap-8 max-w-2xl mx-auto">
                <div className="p-4 rounded-2xl relative overflow-hidden flex-1" style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.12) 100%)',
                    backdropFilter: 'blur(15px)',
                    WebkitBackdropFilter: 'blur(15px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.2)'
                }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/6 to-blue-500/6 rounded-2xl"></div>
                    <label className="block text-sm font-medium text-gray-600 mb-2 relative z-10">엔코더값</label>
                    <div className="text-gray-700 text-center rounded-xl px-4 py-4 text-xl md:text-2xl font-bold relative z-10" style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        boxShadow: '0 2px 8px 0 rgba(31, 38, 135, 0.15)'
                    }}>
                        {sensorData.rawData?.[240] || '-'}
                    </div>
                </div>
                
                <div className="p-4 rounded-2xl relative overflow-hidden flex-1" style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.12) 100%)',
                    backdropFilter: 'blur(15px)',
                    WebkitBackdropFilter: 'blur(15px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.2)'
                }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/6 to-blue-500/6 rounded-2xl"></div>
                    <label className="block text-sm font-medium text-gray-600 mb-2 relative z-10">카운터값</label>
                    <div className="text-gray-700 text-center rounded-xl px-4 py-4 text-xl md:text-2xl font-bold relative z-10" style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        boxShadow: '0 2px 8px 0 rgba(31, 38, 135, 0.15)'
                    }}>
                        {sensorData.rawData?.[200] || '-'}
                    </div>
                </div>
            </div>

            {/* 공용 버튼들 */}
            <div className="mb-12 md:mb-20">
                <div className="flex flex-wrap gap-4 justify-center common-buttons-grid">
                    <button
                        onClick={() => sendCommand('errorReset')}
                        disabled={isDisabled}
                        className={`learn-more common-button ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        에러 리셋
                    </button>
                    <button
                        onClick={() => sendCommand('operationMode')}
                        disabled={isDisabled}
                        className={`learn-more common-button ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        운전 모드 전환
                    </button>
                    <button
                        onClick={() => sendCommand('recovery')}
                        disabled={isDisabled}
                        className={`learn-more common-button ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        복귀 운전
                    </button>
                    <button
                        onClick={handleEmergencyStop}
                        disabled={!isPLCConnected}
                        className={`learn-more emergency-button ${!isPLCConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        비상정지
                    </button>
                </div>
            </div>

            {/* 탭 컨텐츠 */}
            <div className="tab-content">
                {/* 1페이지: 도어/턴테이블 */}
                {activeTab === 'page1' && (
                    <div className="page1-layout">
                        {/* 턴테이블 제어 - 상하좌우 배치 */}
                        <div className="turn-table-section">
                            <div className="turn-table-grid">
                                <button
                                    onMouseDown={() => sendCommand('turnTableUp', 1)}
                                    onMouseUp={() => sendCommand('turnTableUp', 0)}
                                    disabled={isDisabled}
                                    className={`learn-more turn-table-btn up ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    상승
                                </button>
                                <button
                                    onMouseDown={() => sendCommand('turnTableLeft', 1)}
                                    onMouseUp={() => sendCommand('turnTableLeft', 0)}
                                    disabled={isDisabled}
                                    className={`learn-more turn-table-btn left ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    좌회전
                                </button>
                                <button
                                    onMouseDown={() => sendCommand('turnTableRight', 1)}
                                    onMouseUp={() => sendCommand('turnTableRight', 0)}
                                    disabled={isDisabled}
                                    className={`learn-more turn-table-btn right ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    우회전
                                </button>
                                <button
                                    onMouseDown={() => sendCommand('turnTableDown', 1)}
                                    onMouseUp={() => sendCommand('turnTableDown', 0)}
                                    disabled={isDisabled}
                                    className={`learn-more turn-table-btn down ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    하강
                                </button>
                            </div>
                        </div>

                        {/* 도어 제어 - 상하 배치 */}
                        <div className="door-section">
                            <div className="door-vertical">
                                <button
                                    onMouseDown={() => sendCommand('doorOpen', 1)}
                                    onMouseUp={() => sendCommand('doorOpen', 0)}
                                    disabled={isDisabled}
                                    className={`learn-more door-btn ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    도어 열림
                                </button>
                                <button
                                    onMouseDown={() => sendCommand('doorClose', 1)}
                                    onMouseUp={() => sendCommand('doorClose', 0)}
                                    disabled={isDisabled}
                                    className={`learn-more door-btn ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    도어 닫힘
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2페이지: 승강 제어 */}
                {activeTab === 'page2' && (
                    <div className="page1-layout">
                        {/* 승강 제어 */}
                        <div>
                            <div className="flex flex-row gap-6 md:gap-8 justify-center items-center">
                                <button
                                    onMouseDown={() => sendCommand('liftUp', 1)}
                                    onMouseUp={() => sendCommand('liftUp', 0)}
                                    onMouseLeave={() => sendCommand('liftUp', 0)}
                                    onTouchStart={() => sendCommand('liftUp', 1)}
                                    onTouchEnd={() => sendCommand('liftUp', 0)}
                                    disabled={isDisabled}
                                    className={`learn-more ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    상승
                                </button>

                                <button
                                    onMouseDown={() => sendCommand('liftDown', 1)}
                                    onMouseUp={() => sendCommand('liftDown', 0)}
                                    onMouseLeave={() => sendCommand('liftDown', 0)}
                                    onTouchStart={() => sendCommand('liftDown', 1)}
                                    onTouchEnd={() => sendCommand('liftDown', 0)}
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
                    <div className="space-y-7 md:space-y-12">
                        {/* 횡행 제어 */}
                        <div>
                            <div className="flex flex-wrap gap-6 md:gap-8 justify-center">
                                <button
                                    onMouseDown={() => sendCommand('moveLeft', 1)}
                                    onMouseUp={() => sendCommand('moveLeft', 0)}
                                    onMouseLeave={() => sendCommand('moveLeft', 0)}
                                    onTouchStart={() => sendCommand('moveLeft', 1)}
                                    onTouchEnd={() => sendCommand('moveLeft', 0)}
                                    disabled={isDisabled}
                                    className={`learn-more mobile-move-btn ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    좌행
                                </button>

                                <button
                                    onMouseDown={() => sendCommand('moveRight', 1)}
                                    onMouseUp={() => sendCommand('moveRight', 0)}
                                    onMouseLeave={() => sendCommand('moveRight', 0)}
                                    onTouchStart={() => sendCommand('moveRight', 1)}
                                    onTouchEnd={() => sendCommand('moveRight', 0)}
                                    disabled={isDisabled}
                                    className={`learn-more mobile-move-btn ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    우행
                                </button>
                            </div>
                        </div>

                        {/* 락킹 제어 */}
                        <div>
                            <div className="flex justify-center">
                                {/* 모바일용 그리드 레이아웃 */}
                                <div className="md:hidden grid grid-cols-2 gap-4 max-w-xs">
                                    {/* 좌측 열 */}
                                    <div className="flex flex-col gap-6">
                                        <button
                                            onMouseDown={() => sendCommand('leftLiftLock', 1)}
                                            onMouseUp={() => sendCommand('leftLiftLock', 0)}
                                            disabled={isDisabled}
                                            className={`learn-more mobile-locking-btn ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            좌측락킹 잠금
                                        </button>
                                        <button
                                            onMouseDown={() => sendCommand('leftLiftUnlock', 1)}
                                            onMouseUp={() => sendCommand('leftLiftUnlock', 0)}
                                            disabled={isDisabled}
                                            className={`learn-more mobile-locking-btn ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            좌측락킹 해제
                                        </button>
                                    </div>
                                    
                                    {/* 우측 열 */}
                                    <div className="flex flex-col gap-6">
                                        <button
                                            onMouseDown={() => sendCommand('rightLiftLock', 1)}
                                            onMouseUp={() => sendCommand('rightLiftLock', 0)}
                                            disabled={isDisabled}
                                            className={`learn-more mobile-locking-btn ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            우측락킹 잠금
                                        </button>
                                        <button
                                            onMouseDown={() => sendCommand('rightLiftUnlock', 1)}
                                            onMouseUp={() => sendCommand('rightLiftUnlock', 0)}
                                            disabled={isDisabled}
                                            className={`learn-more mobile-locking-btn ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            우측락킹 해제
                                        </button>
                                    </div>
                                </div>

                                {/* PC용 좌우 배치 */}
                                <div className="hidden md:flex gap-12 justify-center">
                                    {/* 좌측 락킹 */}
                                    <div className="flex flex-col gap-8 items-center">
                                        <button
                                            onMouseDown={() => sendCommand('leftLiftLock', 1)}
                                            onMouseUp={() => sendCommand('leftLiftLock', 0)}
                                            disabled={isDisabled}
                                            className={`learn-more ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            좌측락킹 잠금
                                        </button>
                                        <button
                                            onMouseDown={() => sendCommand('leftLiftUnlock', 1)}
                                            onMouseUp={() => sendCommand('leftLiftUnlock', 0)}
                                            disabled={isDisabled}
                                            className={`learn-more ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            좌측락킹 해제
                                        </button>
                                    </div>

                                    {/* 우측 락킹 */}
                                    <div className="flex flex-col gap-8 items-center">
                                        <button
                                            onMouseDown={() => sendCommand('rightLiftLock', 1)}
                                            onMouseUp={() => sendCommand('rightLiftLock', 0)}
                                            disabled={isDisabled}
                                            className={`learn-more ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            우측락킹 잠금
                                        </button>
                                        <button
                                            onMouseDown={() => sendCommand('rightLiftUnlock', 1)}
                                            onMouseUp={() => sendCommand('rightLiftUnlock', 0)}
                                            disabled={isDisabled}
                                            className={`learn-more ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            우측락킹 해제
                                        </button>
                                    </div>
                                </div>
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

            {/* 사용법 안내 */}
            <div className="mt-8 md:mt-12 p-3 md:p-4 bg-blue-50 rounded-2xl">
                <h4 className="text-xs md:text-sm font-semibold text-blue-800 mb-2">사용법</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                    <li>• PLC 연결과 인증이 완료되어야 제어 가능합니다</li>
                    <li>• 버튼을 누르면 해당 명령이 PLC로 전송됩니다</li>
                    <li>• 명령 실행 중에는 버튼이 강조 표시됩니다</li>
                    <li>• 비상정지는 PLC 연결만 되어도 실행 가능합니다</li>
                </ul>
            </div>

            {/* 디버그 정보 (개발용) */}
            {/* eslint-disable-next-line no-undef */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-3 bg-gray-100 rounded-2xl text-xs">
                    <div>PLC 연결: {isPLCConnected ? 'O' : 'X'}</div>
                    <div>인증 상태: {isAuthenticated ? 'O' : 'X'}</div>
                    <div>활성 명령: {activeCommand || 'None'}</div>
                    <div>비상모드: {isEmergencyMode ? 'O' : 'X'}</div>
                </div>
            )}
            </div>

            {/* 좌측 센서 패널 (PC만) */}
            {showSensors && (
                <div className="sensor-panel-left show">
                        {activeTab === 'page1' && (
                            <div>
                            <div className={`sensor-item ${getSensorValue('PC_Up') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PC_Up')}</div>
                                <div className="sensor-name">PC_상승</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PC_Down') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PC_Down')}</div>
                                <div className="sensor-name">PC_하강</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PC_ErrorReset') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PC_ErrorReset')}</div>
                                <div className="sensor-name">PC_에러해제</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PC_TurnLeft') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PC_TurnLeft')}</div>
                                <div className="sensor-name">PC_턴좌회전</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PC_TurnRight') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PC_TurnRight')}</div>
                                <div className="sensor-name">PC_턴우회전</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PC_TurnLock') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PC_TurnLock')}</div>
                                <div className="sensor-name">PC_턴잠김</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PC_TurnUnlock') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PC_TurnUnlock')}</div>
                                <div className="sensor-name">PC_턴해제</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PC_DoorOpen') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PC_DoorOpen')}</div>
                                <div className="sensor-name">PC_도어열림</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PC_DoorClose') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PC_DoorClose')}</div>
                                <div className="sensor-name">PC_도어닫힘</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PC_Emergency') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PC_Emergency')}</div>
                                <div className="sensor-name">PC_비상스위치</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('LevelUp') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('LevelUp')}</div>
                                <div className="sensor-name">레벨 상</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('LevelDown') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('LevelDown')}</div>
                                <div className="sensor-name">레벨 하</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('HomePosition') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('HomePosition')}</div>
                                <div className="sensor-name">홈위치</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('TurnPosition') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('TurnPosition')}</div>
                                <div className="sensor-name">턴회전위치</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('TurnLock') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('TurnLock')}</div>
                                <div className="sensor-name">턴잠김</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('TurnUnlock') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('TurnUnlock')}</div>
                                <div className="sensor-name">턴해제</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('Turn0Check') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('Turn0Check')}</div>
                                <div className="sensor-name">턴0도확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('Turn180Check') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('Turn180Check')}</div>
                                <div className="sensor-name">턴180도확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('Turn90Check') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('Turn90Check')}</div>
                                <div className="sensor-name">턴90도확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('TurnLeftStop') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('TurnLeftStop')}</div>
                                <div className="sensor-name">턴좌정지</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('TurnRightStop') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('TurnRightStop')}</div>
                                <div className="sensor-name">턴우정지</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('L_INV_RUN') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('L_INV_RUN')}</div>
                                <div className="sensor-name">L_INV RUN</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('L_INV_FLT') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('L_INV_FLT')}</div>
                                <div className="sensor-name">L_INV FLT</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('P_INV_RUN') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P_INV_RUN')}</div>
                                <div className="sensor-name">P_INV RUN</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('P_INV_FLT') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P_INV_FLT')}</div>
                                <div className="sensor-name">P_INV FLT</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('DoorOpenCheck') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('DoorOpenCheck')}</div>
                                <div className="sensor-name">도어열림확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('DoorCloseCheck') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('DoorCloseCheck')}</div>
                                <div className="sensor-name">도어닫힘확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PitSensorOdd') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PitSensorOdd')}</div>
                                <div className="sensor-name">피트센서(홀)'</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PitSensorEven') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PitSensorEven')}</div>
                                <div className="sensor-name">피트센서(짝)</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('HookCenterFront') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('HookCenterFront')}</div>
                                <div className="sensor-name">후크중앙(전)</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('HookCenterBack') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('HookCenterBack')}</div>
                                <div className="sensor-name">후크중앙(후)</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('OddPalletStop') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('OddPalletStop')}</div>
                                <div className="sensor-name">홀수파렛정지</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('EvenPalletStop') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('EvenPalletStop')}</div>
                                <div className="sensor-name">짝수파렛정지</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PalletDetectOdd') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PalletDetectOdd')}</div>
                                <div className="sensor-name">파렛감지(홀)</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PalletDetectEven') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PalletDetectEven')}</div>
                                <div className="sensor-name">파렛감지(짝)</div>
                            </div>  
                        </div>
                    )}
                    
                        {activeTab === 'page2' && (
                            <div>
                            <div className={`sensor-item ${getSensorValue('PC_Up') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PC_Up')}</div>
                                <div className="sensor-name">PC_상승</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PC_Down') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PC_Down')}</div>
                                <div className="sensor-name">PC_하강</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PC_ErrorReset') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PC_ErrorReset')}</div>
                                <div className="sensor-name">PC_에러해제</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PC_Emergency') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PC_Emergency')}</div>
                                <div className="sensor-name">PC_비상스위치</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('L_INV_RUN') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('L_INV_RUN')}</div>
                                <div className="sensor-name">L_INV RUN</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('L_INV_FLT') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('L_INV_FLT')}</div>
                                <div className="sensor-name">L_INV FLT</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('LevelUp') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('LevelUp')}</div>
                                <div className="sensor-name">레벨 상</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('LevelDown') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('LevelDown')}</div>
                                <div className="sensor-name">레벨 하</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('DoorCloseCheck') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('DoorCloseCheck')}</div>
                                <div className="sensor-name">도어닫힘확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PitSensorOdd') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PitSensorOdd')}</div>
                                <div className="sensor-name">피트센서(홀)</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PitSensorEven') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PitSensorEven')}</div>
                                <div className="sensor-name">피트센서(짝)</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('Turn0Check') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('Turn0Check')}</div>
                                <div className="sensor-name">턴0도확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('Turn180Check') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('Turn180Check')}</div>
                                <div className="sensor-name">턴180도확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('Turn90Check') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('Turn90Check')}</div>
                                <div className="sensor-name">턴90도확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('TurnLeftStop') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('TurnLeftStop')}</div>
                                <div className="sensor-name">턴좌정지</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('TurnRightStop') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('TurnRightStop')}</div>
                                <div className="sensor-name">턴우정지</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('HookCenterFront') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('HookCenterFront')}</div>
                                <div className="sensor-name">후크중앙(전)</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('HookCenterBack') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('HookCenterBack')}</div>
                                <div className="sensor-name">후크중앙(후)</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('OddPalletStop') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('OddPalletStop')}</div>
                                <div className="sensor-name">홀수파렛정지</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('EvenPalletStop') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('EvenPalletStop')}</div>
                                <div className="sensor-name">짝수파렛정지</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PalletDetectOdd') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PalletDetectOdd')}</div>
                                <div className="sensor-name">파렛감지(홀)</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PalletDetectEven') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PalletDetectEven')}</div>
                                <div className="sensor-name">파렛감지(짝)</div>
                            </div>
                        </div>
                    )}
                    
                        {activeTab === 'page3' && (
                            <div>
                            <div className={`sensor-item ${getSensorValue('PC_LeftMove') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PC_LeftMove')}</div>
                                <div className="sensor-name">PC_좌행</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PC_RightMove') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PC_RightMove')}</div>
                                <div className="sensor-name">PC_우행</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PC_ErrorReset') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PC_ErrorReset')}</div>
                                <div className="sensor-name">PC_에러해제</div>
                            </div>                   
                            <div className={`sensor-item ${getSensorValue('PC_Emergency') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PC_Emergency')}</div>
                                <div className="sensor-name">PC_비상스위치</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('LevelUp') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('LevelUp')}</div>
                                <div className="sensor-name">레벨 상</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('LevelDown') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('LevelDown')}</div>
                                <div className="sensor-name">레벨 하</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PalletDetectOdd') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PalletDetectOdd')}</div>
                                <div className="sensor-name">파렛감지(홀)</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PalletDetectEven') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PalletDetectEven')}</div>
                                <div className="sensor-name">파렛감지(짝)</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('DoorCloseCheck') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('DoorCloseCheck')}</div>
                                <div className="sensor-name">도어닫힘확인</div>
                            </div> 
                            <div className={`sensor-item ${getSensorValue('PitSensorOdd') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PitSensorOdd')}</div>
                                <div className="sensor-name">피트센서(홀)</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('PitSensorEven') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('PitSensorEven')}</div>
                                <div className="sensor-name">피트센서(짝)</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('TurnLeftStop') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('TurnLeftStop')}</div>
                                <div className="sensor-name">턴좌정지</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('TurnRightStop') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('TurnRightStop')}</div>
                                <div className="sensor-name">턴우정지</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('P_INV_RUN') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P_INV_RUN')}</div>
                                <div className="sensor-name">P_INV RUN</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('P_INV_FLT') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P_INV_FLT')}</div>
                                <div className="sensor-name">P_INV FLT</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('HookCenterFront') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('HookCenterFront')}</div>
                                <div className="sensor-name">후크중앙(전)</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('HookCenterBack') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('HookCenterBack')}</div>
                                <div className="sensor-name">후크중앙(후)</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('OddPalletStop') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('OddPalletStop')}</div>
                                <div className="sensor-name">홀수파렛정지</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('EvenPalletStop') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('EvenPalletStop')}</div>
                                <div className="sensor-name">짝수파렛정지</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 우측 센서 패널 (PC만) */}
            {showSensors && (
                <div className="sensor-panel-right show">
                    
                        {activeTab === 'page1' && (
                            <div>
                            <div className={`sensor-item ${getSensorValue('L_INV_Forward') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('L_INV_Forward')}</div>
                                <div className="sensor-name">L_INV 정</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('L_INV_Reverse') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('L_INV_Reverse')}</div>
                                <div className="sensor-name">L_INV 역</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('L_INV_S3') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('L_INV_S3')}</div>
                                <div className="sensor-name">L_INV S3</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('L_INV_S4') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('L_INV_S4')}</div>
                                <div className="sensor-name">L_INV S4</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('L_INV_S5') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('L_INV_S5')}</div>
                                <div className="sensor-name">L_INV S5</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('L_INV_S6') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('L_INV_S6')}</div>
                                <div className="sensor-name">L_INV S6</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('L_INV_S7') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('L_INV_S7')}</div>
                                <div className="sensor-name">L_INV S7</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('L_INV_S8') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('L_INV_S8')}</div>
                                <div className="sensor-name">L_INV S8</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('LiftMC') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('LiftMC')}</div>
                                <div className="sensor-name">리프트MC</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('LiftBK') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('LiftBK')}</div>
                                <div className="sensor-name">리프트BK</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('DoorOpenMC') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('DoorOpenMC')}</div>
                                <div className="sensor-name">도어열림MC</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('DoorCloseMC') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('DoorCloseMC')}</div>
                                <div className="sensor-name">도어닫힘MC</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('TurnMC') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('TurnMC')}</div>
                                <div className="sensor-name">턴MC</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('TurnBK') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('TurnBK')}</div>
                                <div className="sensor-name">턴BK</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('TurnLockMC') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('TurnLockMC')}</div>
                                <div className="sensor-name">턴락MC</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('TurnUnlockMC') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('TurnUnlockMC')}</div>
                                <div className="sensor-name">턴언락MC</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('P_INV_Forward') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P_INV_Forward')}</div>
                                <div className="sensor-name">P_INV 정</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('P_INV_Reverse') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P_INV_Reverse')}</div>
                                <div className="sensor-name">P_INV 역</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('P_INV_S3') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P_INV_S3')}</div>
                                <div className="sensor-name">P_INV S3</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('P_INV_S4') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P_INV_S4')}</div>
                                <div className="sensor-name">P_INV S4</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('P_INV_S5') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P_INV_S5')}</div>
                                <div className="sensor-name">P_INV S5</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('P_INV_S6') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P_INV_S6')}</div>
                                <div className="sensor-name">P_INV S6</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('P_INV_S7') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P_INV_S7')}</div>
                                <div className="sensor-name">P_INV S7</div>
                            </div>
                        </div>
                    )}
                    
                        {activeTab === 'page2' && (
                            <div>
                            <div className={`sensor-item ${getSensorValue('L_INV_Forward') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('L_INV_Forward')}</div>
                                <div className="sensor-name">L_INV 정</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('L_INV_Reverse') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('L_INV_Reverse')}</div>
                                <div className="sensor-name">L_INV 역</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('L_INV_S3') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('L_INV_S3')}</div>
                                <div className="sensor-name">L_INV S3</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('L_INV_S4') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('L_INV_S4')}</div>
                                <div className="sensor-name">L_INV S4</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('L_INV_S5') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('L_INV_S5')}</div>
                                <div className="sensor-name">L_INV S5</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('L_INV_S6') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('L_INV_S6')}</div>
                                <div className="sensor-name">L_INV S6</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('L_INV_S7') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('L_INV_S7')}</div>
                                <div className="sensor-name">L_INV S7</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('L_INV_S8') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('L_INV_S8')}</div>
                                <div className="sensor-name">L_INV S8</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('LiftMC') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('LiftMC')}</div>
                                <div className="sensor-name">리프트MC</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('LiftBK') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('LiftBK')}</div>
                                <div className="sensor-name">리프트BK</div>
                            </div>
                        </div>
                    )}
                    
                        {activeTab === 'page3' && (
                            <div>
                            <div className={`sensor-item ${getSensorValue('P_INV_Forward') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P_INV_Forward')}</div>
                                <div className="sensor-name">P_INV 정</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('P_INV_Reverse') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P_INV_Reverse')}</div>
                                <div className="sensor-name">P_INV 역</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('P_INV_S3') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P_INV_S3')}</div>
                                <div className="sensor-name">P_INV S3</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('P_INV_S4') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P_INV_S4')}</div>
                                <div className="sensor-name">P_INV S4</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('P_INV_S5') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P_INV_S5')}</div>
                                <div className="sensor-name">P_INV S5</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('P_INV_S6') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P_INV_S6')}</div>
                                <div className="sensor-name">P_INV S6</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('P_INV_S7') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('P_INV_S7')}</div>
                                <div className="sensor-name">P_INV S7</div>
                            </div>                     
                            <div className={`sensor-item ${getSensorValue('HorizontalMoveMC') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('HorizontalMoveMC')}</div>
                                <div className="sensor-name">횡행MC</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('HorizontalMoveBK') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('HorizontalMoveBK')}</div>
                                <div className="sensor-name">횡행BK</div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default ManualControl;