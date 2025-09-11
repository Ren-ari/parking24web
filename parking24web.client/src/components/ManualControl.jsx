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
            'Turn0': { wordIndex: 28, bitIndex: 0, address: 'C28', name: '턴 0도 확인정지' },
            'Turn180': { wordIndex: 29, bitIndex: 0, address: 'C29', name: '턴 180도 확인정지' },
            'Turnup': { wordIndex: 31, bitIndex: 0, address: 'C31', name: '턴 상승확인' },
            'Turndown': { wordIndex: 32, bitIndex: 0, address: 'C32', name: '턴 하강확인' },
            'DoorOpen': { wordIndex: 39, bitIndex: 0, address: 'C39', name: '도어열림확인' },
            'DoorClose': { wordIndex: 40, bitIndex: 0, address: 'C40', name: '도어닫힘확인' },
            'DoorCloseCheck': { wordIndex: 41, bitIndex: 0, address: 'C41', name: '도어잠김확인' },
            'LeftDoorCheck': { wordIndex: 44, bitIndex: 0, address: 'C44', name: '좌도어확인' },
            'RightDoorCheck': { wordIndex: 45, bitIndex: 0, address: 'C45', name: '우도어확인' },
            'IndoorCheck': { wordIndex: 53, bitIndex: 0, address: 'C53', name: '도어내확인' },
            'LeftMoveCheck1': { wordIndex: 42, bitIndex: 0, address: 'C42', name: '좌측동작감지확인1' },
            'RightMoveCheck1': { wordIndex: 43, bitIndex: 0, address: 'C43', name: '우측동작감지확인1' },
            'CarLocation': { wordIndex: 47, bitIndex: 0, address: 'C47', name: '차량정위치' },
            'FrontBumpCheck': { wordIndex: 46, bitIndex: 0, address: 'C46', name: '앞범퍼확인' },
            'BackBumpCheck': { wordIndex: 50, bitIndex: 0, address: 'C50', name: '뒷범퍼확인' },
            'RVheight': { wordIndex: 48, bitIndex: 0, address: 'C48', name: 'RV높이확인' },
            'Carheight': { wordIndex: 49, bitIndex: 0, address: 'C49', name: '승용높이확인' },
            
            // 승강 제어 탭 (page2) - 인풋 센서들
            'LiftLevel1': { wordIndex: 20, bitIndex: 0, address: 'C20', name: '리프트 레벨1' },
            'LiftLevel2': { wordIndex: 21, bitIndex: 0, address: 'C21', name: '리프트 레벨2' },
            'LiftHome': { wordIndex: 30, bitIndex: 0, address: 'C30', name: '리프트 홈 확인' },
            'LiftDownDecel': { wordIndex: 37, bitIndex: 0, address: 'C37', name: '리프트 하강감속확인' },
            'LiftDownLimit': { wordIndex: 38, bitIndex: 0, address: 'C38', name: '리프트 하강비상확인' },
            'LiftUpLimit': { wordIndex: 51, bitIndex: 0, address: 'C51', name: '리프트 상승비상확인' },
            'LiftUpDecel': { wordIndex: 52, bitIndex: 0, address: 'C52', name: '리프트 상승감속확인' },
            'wireCut': { wordIndex: 61, bitIndex: 11, address: 'C61', name: '와이어 절단' },
            
            // 횡행/락킹 탭 (page3) - 인풋 센서들
            'HookCenter': { wordIndex: 22, bitIndex: 0, address: 'C22', name: '후크중앙확인' },
            'OddHookSensor': { wordIndex: 24, bitIndex: 0, address: 'C24', name: '홀수 후크 감지' },
            'EvenHookSensor': { wordIndex: 25, bitIndex: 0, address: 'C25', name: '짝수 후크 감지' },
            'OddLockingOn': { wordIndex: 33, bitIndex: 0, address: 'C33', name: '홀수측 록킹잠김확인' },
            'OddLockingOff': { wordIndex: 34, bitIndex: 0, address: 'C34', name: '홀수측 록킹풀림확인' },
            'EvenLockingOn': { wordIndex: 35, bitIndex: 0, address: 'C35', name: '짝수측 록킹잠김확인' },
            'EvenLockingOff': { wordIndex: 36, bitIndex: 0, address: 'C36', name: '짝수측 록킹풀림확인' },
            'LeftFit': { wordIndex: 26, bitIndex: 0 , address: 'C26', name: '좌측 피트확인' },
            'RightFit': { wordIndex: 27, bitIndex: 0, address: 'C27', name: '우측 피트확인' },

            // 아웃풋 센서들 (출력 상태)
            // 도어/턴테이블 탭 아웃풋
            'redLight': { wordIndex: 69, bitIndex: 2, address: 'C69', name: '적색신호등' },
            'greenLight': { wordIndex: 69, bitIndex: 3, address: 'C69', name: '녹색신호등' },
            'guideFwd': { wordIndex: 69, bitIndex: 4, address: 'C69', name: '유도등 전진' },
            'guideStop': { wordIndex: 69, bitIndex: 5, address: 'C69', name: '유도등 정지' },
            'guideRev': { wordIndex: 69, bitIndex: 6, address: 'C69', name: '유도등 후진' },
            'doorRotFwdMc': { wordIndex: 69, bitIndex: 8, address: 'C69', name: '도어모터 정회전 MC' },
            'doorRotRightMc': { wordIndex: 69, bitIndex: 9, address: 'C69', name: '도어모터 우회전 MC' },
            'turnLiftUp': { wordIndex: 68, bitIndex: 6, address: 'C68', name: '턴리프팅 상승' },
            'turnLiftDown': { wordIndex: 68, bitIndex: 7, address: 'C68', name: '턴리프팅 하강' },
            'turnMortor': { wordIndex: 68, bitIndex: 11, address: 'C68', name: '턴 모터' },
            'turnMortorBK': { wordIndex: 68, bitIndex: 12, address: 'C68', name: '턴 모터 BK' },
            'turnTableRotFwd': { wordIndex: 71, bitIndex: 0, address: 'C71', name: '턴테이블 인버터 정회전' },
            'turnTableRotRev': { wordIndex: 71, bitIndex: 1, address: 'C71', name: '턴테이블 인버터 역회전' },
            'turnTableReset': { wordIndex: 71, bitIndex: 7, address: 'C71', name: '턴테이블 인버터 리셋' },
            'turnTableSp1': { wordIndex: 71, bitIndex: 2, address: 'C71', name: '턴테이블 인버터 SP1' },
            'turnTableSp2': { wordIndex: 71, bitIndex: 3, address: 'C71', name: '턴테이블 인버터 SP2' },
            'turnTableSp3': { wordIndex: 71, bitIndex: 4, address: 'C71', name: '턴테이블 인버터 SP3' },
            'turnRotLeftStop': { wordIndex: 64, bitIndex: 3, address: 'C64', name: '턴 좌회전정지' },
            'turnRotRightStop': { wordIndex: 64, bitIndex: 1, address: 'C64', name: '턴 우회전정지' },
            'turnTableUpStop': { wordIndex: 66, bitIndex: 14, address: 'C66', name: '턴테이블 상승정지' },
            'turnTableDownStop': { wordIndex: 66, bitIndex: 15, address: 'C66', name: '턴테이블 하강정지' },
            
            // 승강 제어 탭 아웃풋
            'liftRotFwd': { wordIndex: 70, bitIndex: 0, address: 'C70', name: '리프트 인버터 정회전' },
            'liftRotRev': { wordIndex: 70, bitIndex: 1, address: 'C70', name: '리프트 인버터 역회전' },
            'liftReset': { wordIndex: 70, bitIndex: 7, address: 'C70', name: '리프트 인버터 리셋' },
            'liftSp1': { wordIndex: 70, bitIndex: 2, address: 'C70', name: '리프트 인버터 SP1' },
            'liftSp2': { wordIndex: 70, bitIndex: 3, address: 'C70', name: '리프트 인버터 SP2' },
            'liftSp3': { wordIndex: 70, bitIndex: 4, address: 'C70', name: '리프트 인버터 SP3' },
            'liftEmgLine': { wordIndex: 70, bitIndex: 6, address: 'C70', name: '리프트 인버터 비상라인' },
            'liftBk': { wordIndex: 69, bitIndex: 10, address: 'C69', name: '리프트 인버터 리프트BK' },
            
            // 횡행/락킹 탭 아웃풋
            'latRotFwd': { wordIndex: 71, bitIndex: 0, address: 'C71', name: '횡행 인버터 정회전' },
            'latRotRev': { wordIndex: 71, bitIndex: 1, address: 'C71', name: '횡행 인버터 역회전' },
            'latReset': { wordIndex: 71, bitIndex: 7, address: 'C71', name: '횡행 인버터 리셋' },
            'latSp1': { wordIndex: 71, bitIndex: 2, address: 'C71', name: '횡행 인버터 SP1' },
            'latSp2': { wordIndex: 71, bitIndex: 3, address: 'C71', name: '횡행 인버터 SP2' },
            'latSp3': { wordIndex: 71, bitIndex: 4, address: 'C71', name: '횡행 인버터 SP3' },
            'latMortor': { wordIndex: 68, bitIndex: 5, address: 'C68', name: '횡행 모터BK' },
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
            return `C${sensor.wordIndex}.${sensor.bitIndex}`;
        }
        return 'C--.--';
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
                        width: 200px;
                        height: 60vh;
                        padding: 12px;
                        top: 63%;
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
                        width: 200px;
                        height: 60vh;
                        padding: 12px;
                        top: 63%;
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
                
                
                .sensor-name {
                    font-weight: 600;
                    color: #1f2937;
                    font-size: 0.9rem;
                    flex: 1;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
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
                        flex-direction: column;
                        gap: 30px;
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
                    <div className="space-y-6">
                        {/* 승강 제어 */}
                        <div>
                            <div className="flex flex-col gap-6 md:gap-8 justify-center items-center">
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
                            <div className={`sensor-item ${getSensorValue('Turn0') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('Turn0')}</div>
                                <div className="sensor-name">턴 0도 확인정지</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('Turn180') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('Turn180')}</div>
                                <div className="sensor-name">턴 180도 확인정지</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('Turnup') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('Turnup')}</div>
                                <div className="sensor-name">턴 상승확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('Turndown') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('Turndown')}</div>
                                <div className="sensor-name">턴 하강확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('DoorOpen') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('DoorOpen')}</div>
                                <div className="sensor-name">도어열림확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('DoorClose') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('DoorClose')}</div>
                                <div className="sensor-name">도어닫힘확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('DoorCloseCheck') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('DoorCloseCheck')}</div>
                                <div className="sensor-name">도어잠확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('LeftDoorCheck') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('LeftDoorCheck')}</div>
                                <div className="sensor-name">좌도어확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('RightDoorCheck') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('RightDoorCheck')}</div>
                                <div className="sensor-name">우도어확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('IndoorCheck') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('IndoorCheck')}</div>
                                <div className="sensor-name">도어내확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('LeftMoveCheck1') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('LeftMoveCheck1')}</div>
                                <div className="sensor-name">좌측동작감지확인1</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('RightMoveCheck1') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('RightMoveCheck1')}</div>
                                <div className="sensor-name">우측동작감지확인1</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('CarLocation') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('CarLocation')}</div>
                                <div className="sensor-name">차량정위치</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('FrontBumpCheck') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('FrontBumpCheck')}</div>
                                <div className="sensor-name">앞범퍼확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('BackBumpCheck') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('BackBumpCheck')}</div>
                                <div className="sensor-name">뒷범퍼확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('RVheight') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('RVheight')}</div>
                                <div className="sensor-name">RV높이확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('Carheight') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('Carheight')}</div>
                                <div className="sensor-name">승용높이확인</div>
                            </div>
                        </div>
                    )}
                    
                        {activeTab === 'page2' && (
                            <div>
                            <div className={`sensor-item ${getSensorValue('LiftLevel1') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('LiftLevel1')}</div>
                                <div className="sensor-name">리프트 레벨1</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('LiftLevel2') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('LiftLevel2')}</div>
                                <div className="sensor-name">리프트 레벨2</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('LiftHome') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('LiftHome')}</div>
                                <div className="sensor-name">리프트 홈 확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('LiftDownDecel') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('LiftDownDecel')}</div>
                                <div className="sensor-name">리프트 하강감속확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('LiftDownLimit') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('LiftDownLimit')}</div>
                                <div className="sensor-name">리프트 하강비상확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('LiftUpLimit') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('LiftUpLimit')}</div>
                                <div className="sensor-name">리프트 상승비상확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('LiftUpDecel') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('LiftUpDecel')}</div>
                                <div className="sensor-name">리프트 상승감속확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('wireCut') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('wireCut')}</div>
                                <div className="sensor-name">와이어 절단</div>
                            </div>
                        </div>
                    )}
                    
                        {activeTab === 'page3' && (
                            <div>
                            <div className={`sensor-item ${getSensorValue('HookCenter') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('HookCenter')}</div>
                                <div className="sensor-name">후크중앙확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('OddHookSensor') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('OddHookSensor')}</div>
                                <div className="sensor-name">홀수 후크 감지</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('EvenHookSensor') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('EvenHookSensor')}</div>
                                <div className="sensor-name">짝수 후크 감지</div>
                            </div>                   
                            <div className={`sensor-item ${getSensorValue('OddLockingOn') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('OddLockingOn')}</div>
                                <div className="sensor-name">홀수측 록킹잠김확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('OddLockingOff') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('OddLockingOff')}</div>
                                <div className="sensor-name">홀수측 록킹풀림확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('EvenLockingOn') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('EvenLockingOn')}</div>
                                <div className="sensor-name">짝수측 록킹잠김확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('EvenLockingOff') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('EvenLockingOff')}</div>
                                <div className="sensor-name">짝수측 록킹풀림확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('LeftFit') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('LeftFit')}</div>
                                <div className="sensor-name">좌측 피트확인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('RightFit') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('RightFit')}</div>
                                <div className="sensor-name">우측 피트확인</div>
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
                            <div className={`sensor-item ${getSensorValue('redLight') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('redLight')}</div>
                                <div className="sensor-name">적색신호등</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('greenLight') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('greenLight')}</div>
                                <div className="sensor-name">녹색신호등</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('guideFwd') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('guideFwd')}</div>
                                <div className="sensor-name">유도등 전진</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('guideStop') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('guideStop')}</div>
                                <div className="sensor-name">유도등 정지</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('guideRev') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('guideRev')}</div>
                                <div className="sensor-name">유도등 후진</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('doorRotFwdMc') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('doorRotFwdMc')}</div>
                                <div className="sensor-name">도어모터 정회전 MC</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('doorRotRightMc') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('doorRotRightMc')}</div>
                                <div className="sensor-name">도어모터 우회전 MC</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('turnLiftUp') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('turnLiftUp')}</div>
                                <div className="sensor-name">턴리프팅 상승</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('turnLiftDown') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('turnLiftDown')}</div>
                                <div className="sensor-name">턴리프팅 하강</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('turnMortor') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('turnMortor')}</div>
                                <div className="sensor-name">턴 모터</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('turnMortorBK') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('turnMortorBK')}</div>
                                <div className="sensor-name">턴 모터 BK</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('turnTableRotFwd') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('turnTableRotFwd')}</div>
                                <div className="sensor-name">턴테이블 인버터 정회전</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('turnTableRotRev') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('turnTableRotRev')}</div>
                                <div className="sensor-name">턴테이블 인버터 역회전</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('turnTableReset') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('turnTableReset')}</div>
                                <div className="sensor-name">턴테이블 인버터 리셋</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('turnTableSp1') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('turnTableSp1')}</div>
                                <div className="sensor-name">턴테이블 인버터 SP1</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('turnTableSp2') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('turnTableSp2')}</div>
                                <div className="sensor-name">턴테이블 인버터 SP2</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('turnTableSp3') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('turnTableSp3')}</div>
                                <div className="sensor-name">턴테이블 인버터 SP3</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('turnRotLeftStop') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('turnRotLeftStop')}</div>
                                <div className="sensor-name">턴 좌회전정지</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('turnRotRightStop') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('turnRotRightStop')}</div>
                                <div className="sensor-name">턴 우회전정지</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('turnTableUpStop') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('turnTableUpStop')}</div>
                                <div className="sensor-name">턴테이블 상승정지</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('turnTableDownStop') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('turnTableDownStop')}</div>
                                <div className="sensor-name">턴테이블 하강정지</div>
                            </div>
                        </div>
                    )}
                    
                        {activeTab === 'page2' && (
                            <div>
                            <div className={`sensor-item ${getSensorValue('liftRotFwd') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('liftRotFwd')}</div>
                                <div className="sensor-name">리프트 인버터 정회전</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('liftRotRev') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('liftRotRev')}</div>
                                <div className="sensor-name">리프트 인버터 역회전</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('liftReset') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('liftReset')}</div>
                                <div className="sensor-name">리프트 인버터 리셋</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('liftSp1') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('liftSp1')}</div>
                                <div className="sensor-name">리프트 인버터 SP1</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('liftSp2') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('liftSp2')}</div>
                                <div className="sensor-name">리프트 인버터 SP2</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('liftSp3') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('liftSp3')}</div>
                                <div className="sensor-name">리프트 인버터 SP3</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('liftEmgLine') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('liftEmgLine')}</div>
                                <div className="sensor-name">리프트 인버터 비상라인</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('liftBk') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('liftBk')}</div>
                                <div className="sensor-name">리프트 인버터 리프트BK</div>
                            </div>
                        </div>
                    )}
                    
                        {activeTab === 'page3' && (
                            <div>
                            <div className={`sensor-item ${getSensorValue('latRotFwd') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('latRotFwd')}</div>
                                <div className="sensor-name">횡행 인버터 정회전</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('latRotRev') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('latRotRev')}</div>
                                <div className="sensor-name">횡행 인버터 역회전</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('latReset') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('latReset')}</div>
                                <div className="sensor-name">횡행 인버터 리셋</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('latSp1') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('latSp1')}</div>
                                <div className="sensor-name">횡행 인버터 SP1</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('latSp2') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('latSp2')}</div>
                                <div className="sensor-name">횡행 인버터 SP2</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('latSp3') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('latSp3')}</div>
                                <div className="sensor-name">횡행 인버터 SP3</div>
                            </div>
                            <div className={`sensor-item ${getSensorValue('latMortor') ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">{getSensorCode('latMortor')}</div>
                                <div className="sensor-name">횡행 모터BK</div>
                            </div>               
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default ManualControl;