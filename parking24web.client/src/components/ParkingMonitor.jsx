import React, { useState, useEffect, useRef } from 'react';

const ParkingMonitor = ({ sensorData, isPLCConnected, onVehicleEdit }) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [addressMapping, setAddressMapping] = useState({});
    const [isMobile, setIsMobile] = useState(false);
    const scrollContainerRef = useRef(null);

    // 박스 타입 정의
    const boxTypes = ['홀수차량', '홀수차판상태', '리프트카운터', '짝수차판상태', '짝수차량'];

    // 화면 크기 감지
    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };

        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);

        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    // 초기 주소 매핑 설정
    useEffect(() => {
        const defaultMapping = {};

        for (let level = 0; level <= 38; level++) {
            for (let box = 0; box < 5; box++) {
                if (shouldShowBox(level, box)) {
                    const key = `${level}_${box}`;
                    defaultMapping[key] = getDefaultAddress(level, box);
                }
            }
        }

        setAddressMapping(defaultMapping);
    }, []);

    // 진입층으로 자동 스크롤
    useEffect(() => {
        const timer = setTimeout(() => {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
            }
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    // 박스 표시 여부 결정
    const shouldShowBox = (level, box) => {
        switch (box) {
            case 0: // 홀수차량
            case 1: // 홀수차판상태  
            case 3: // 짝수차판상태
            case 4: // 짝수차량
                return level >= 1; // 1단부터 38단까지
            case 2: // 리프트카운터
                return level >= 0; // 진입층부터 38단까지
            default:
                return false;
        }
    };

    // 기본 주소 계산
    const getDefaultAddress = (level, box) => {
        switch (box) {
            case 0: // 홀수차량
                return level >= 1 ? `C${101 + (level - 1) * 2}` : 'C101';
            case 1: // 홀수차판상태
                return level >= 1 ? `C${101 + (level - 1) * 2}` : 'C101';
            case 2: // 리프트카운터
                return `C${201 + level}`;
            case 3: // 짝수차판상태
                return level >= 1 ? `C${102 + (level - 1) * 2}` : 'C102';
            case 4: // 짝수차량
                return level >= 1 ? `C${102 + (level - 1) * 2}` : 'C102';
            default:
                return 'C0';
        }
    };

    // 편집용 주소 계산 (D4000번대)
    const getEditAddress = (level, box) => {
        if (level === 0) {
            return box === 0 ? 'D4001' : 'D4002';
        } else if (level >= 1 && level <= 38) {
            if (box === 0) { // 홀수차량
                const address = 4001 + (level - 1) * 2;
                return `D${address}`;
            } else if (box === 4) { // 짝수차량
                const address = 4002 + (level - 1) * 2;
                return `D${address}`;
            }
        }
        return box === 0 ? 'D4001' : 'D4002';
    };

    // 주소 파싱
    const parseAddress = (address) => {
        if (!address || address.length < 2) return null;

        const deviceType = address.substring(0, 1);
        const addressNum = parseInt(address.substring(1));

        if (isNaN(addressNum)) return null;

        return { deviceType, addressNum };
    };

    // PLC 값 가져오기
    const getPLCValue = (address) => {
        const parsed = parseAddress(address);
        if (!parsed || !sensorData.rawData) return 0;

        const { addressNum } = parsed;
        if (addressNum >= 0 && addressNum < sensorData.rawData.length) {
            return sensorData.rawData[addressNum];
        }
        return 0;
    };

    // 리프트 적재 여부 확인
    const isVehicleOnLift = (level, box) => {
        if (!sensorData.rawData || sensorData.rawData.length <= 75) return false;

        const loadingPlateValue = sensorData.rawData[75]; // C75
        if (loadingPlateValue === 0) return false;

        if (level >= 1) {
            const orderNumber = box === 0 ? (level * 2) - 1 : level * 2;
            return loadingPlateValue === orderNumber;
        }

        return false;
    };

    // 박스 색상 결정
    const getBoxColor = (level, box, value) => {
        const isOnLift = isVehicleOnLift(level, box);

        if (box === 2) { // 리프트카운터
            if (value === 0) return 'bg-gray-400';
            if (value <= 5) return 'bg-green-300';
            if (value <= 10) return 'bg-yellow-300';
            return 'bg-orange-300';
        } else if (box === 1 || box === 3) { // 차판상태
            return value === 0 ? 'bg-gray-300' : 'bg-pink-300';
        } else if (box === 0 || box === 4) { // 차량
            if (isOnLift) return 'bg-orange-400';
            return value === 0 ? 'bg-white' : 'bg-blue-300';
        }

        return 'bg-white';
    };

    // 박스 데이터 표시
    const getDisplayValue = (level, box, value) => {
        if (box === 1 || box === 3) { // 차판상태
            return value === 0 ? '차량없음' : '차량있음';
        }
        return value.toString();
    };

    // 차량번호 편집
    const handleVehicleEdit = (level, box) => {
        if (box !== 0 && box !== 4) return; // 홀수/짝수 차량만
        if (!isPLCConnected) {
            alert('PLC가 연결되지 않았습니다.');
            return;
        }

        // C75 적재차판 상태 확인
        const loadingPlateValue = sensorData.rawData?.[75] || 0;
        if (level >= 1) {
            const orderNumber = box === 0 ? (level * 2) - 1 : level * 2;
            if (loadingPlateValue === orderNumber) {
                alert('차판이 리프트에 적재되어 있습니다.');
                return;
            }
        }

        const key = `${level}_${box}`;
        const displayAddress = addressMapping[key];
        const editAddress = getEditAddress(level, box);
        const currentValue = getPLCValue(displayAddress);

        const vehicleType = box === 0 ? '홀수차량' : '짝수차량';
        const levelText = level === 0 ? '진입층' : `${level}단`;

        let orderText = '';
        if (level >= 1) {
            const orderNumber = box === 0 ? (level * 2) - 1 : level * 2;
            orderText = ` (${orderNumber}번)`;
        }

        const newValue = prompt(
            `${levelText} ${vehicleType}${orderText} 편집\n편집주소: ${editAddress}\n현재값: ${currentValue}\n\n새로운 차량번호 (0-9999):`,
            currentValue.toString()
        );

        if (newValue === null) return; // 취소

        const numValue = parseInt(newValue);
        if (isNaN(numValue) || numValue < 0 || numValue > 9999) {
            alert('차량번호는 0~9999 범위여야 합니다.');
            return;
        }

        if (onVehicleEdit) {
            onVehicleEdit(editAddress, numValue, `${levelText} ${vehicleType}${orderText}`);
        }
    };

    // 주소 매핑 변경
    const handleAddressChange = (level, box, address) => {
        const key = `${level}_${box}`;
        setAddressMapping(prev => ({
            ...prev,
            [key]: address
        }));
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">주차 현황 모니터링</h2>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center space-x-2 text-sm">
                        <div className={`w-3 h-3 rounded-full ${isPLCConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <span>PLC {isPLCConnected ? '연결됨' : '연결 안됨'}</span>
                    </div>

                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isEditMode
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-yellow-400 text-black hover:bg-yellow-500'
                            }`}
                    >
                        {isEditMode ? '수정 완료' : '주소 수정'}
                    </button>
                </div>
            </div>

            {/* 범례 */}
            <div className="hidden sm:block mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex flex-wrap gap-2 sm:gap-4 text-xs">
                    <div className="flex items-center space-x-1">
                        <div className="w-4 h-4 bg-blue-300 rounded"></div>
                        <span>차량있음</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="w-4 h-4 bg-orange-400 rounded"></div>
                        <span>리프트적재</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="w-4 h-4 bg-pink-300 rounded"></div>
                        <span>차량상태</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="w-4 h-4 bg-green-300 rounded"></div>
                        <span>카운터정상</span>
                    </div>
                    <div className="text-gray-600">* 홀수/짝수차량 더블클릭으로 편집 가능</div>
                </div>
            </div>

            {/* 주차장 레이아웃 */}
            <div className="border border-gray-300 rounded-lg">
                <div ref={scrollContainerRef} className="h-[70vh] sm:h-96 overflow-y-auto p-2 sm:p-4 space-y-1 sm:space-y-2">
                    {/* 38단부터 0단(진입층)까지 역순으로 표시 */}
                    {Array.from({ length: 39 }, (_, i) => 38 - i).map(level => {
                        const levelText = level === 0 ? '진입층' : `${level}단`;

                        return (
                            <div
                                key={level}
                                className={`border rounded-lg p-2 sm:p-3 ${level === 0 ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center space-x-4">
                                    {/* 층 라벨 */}
                                    <div className="w-12 sm:w-16 text-center flex-shrink-0">
                                        <div className={`font-bold text-xs sm:text-sm ${level === 0 ? 'text-orange-600' : 'text-gray-700'
                                            }`}>
                                            {levelText}
                                        </div>
                                    </div>

                                    {/* 5개 박스 */}
                                    <div className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-2 flex-1">
                                        {/* 모바일에서는 박스 순서 변경: 0,1,4,3,2 (리프트카운터를 맨 오른쪽으로) */}
                                        {(isMobile ? [0, 1, 4, 3, 2] : [0, 1, 2, 3, 4]).map((box) => {
                                            if (!shouldShowBox(level, box)) {
                                                return <div key={box} className="w-16 sm:w-24 md:w-32"></div>;
                                            }

                                            const key = `${level}_${box}`;
                                            const address = addressMapping[key] || '';
                                            const value = getPLCValue(address);
                                            const displayValue = getDisplayValue(level, box, value);
                                            const boxColor = getBoxColor(level, box, value);

                                            // 순서 번호 계산
                                            let orderNumber = null;
                                            if ((box === 0 || box === 4) && level >= 1) {
                                                orderNumber = box === 0 ? (level * 2) - 1 : level * 2;
                                            }

                                            return (
                                                <div key={box} className="w-16 sm:w-24 md:w-32 min-w-0">
                                                    <div className={`border border-gray-300 rounded p-1 sm:p-2 h-16 sm:h-14 md:h-16 ${boxColor}`}>
                                                        {/* 박스 타입 라벨 */}
                                                        <div className="text-[8px] sm:text-xs font-bold text-center text-blue-800 mb-1 leading-tight">
                                                            {boxTypes[box]}
                                                        </div>

                                                        {/* 주소 입력 (편집 모드) */}
                                                        {isEditMode && (
                                                            <input
                                                                type="text"
                                                                value={address}
                                                                onChange={(e) => handleAddressChange(level, box, e.target.value)}
                                                                className="w-full text-[8px] sm:text-xs px-0.5 sm:px-1 py-0.5 border rounded mb-1"
                                                                placeholder="주소"
                                                            />
                                                        )}

                                                        {/* 데이터 표시 */}
                                                        <div
                                                            className={`text-center font-bold text-xs px-1 py-0.5 bg-white border rounded cursor-${(box === 0 || box === 4) ? 'pointer' : 'default'
                                                                }`}
                                                            onDoubleClick={() => handleVehicleEdit(level, box)}
                                                            title={
                                                                (box === 0 || box === 4)
                                                                    ? `${orderNumber ? `${orderNumber}번 ` : ''}차량번호 더블클릭으로 편집`
                                                                    : ''
                                                            }
                                                        >
                                                            {displayValue}
                                                        </div>

                                                        {/* 순서 번호 표시 */}
                                                        {orderNumber && (
                                                            <div className="text-xs text-center mt-1">
                                                                <span className={`px-1 rounded text-white ${box === 0 ? 'bg-blue-500' : 'bg-red-500'
                                                                    }`}>
                                                                    {orderNumber}번
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* 편집 주소 표시 (편집 모드) */}
                                                    {isEditMode && (box === 0 || box === 4) && (
                                                        <div className="text-xs text-center text-gray-500 mt-1">
                                                            편집: {getEditAddress(level, box)}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 하단 정보 */}
            <div className="hidden sm:block mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <span className="font-medium">총 층수:</span> 39층 (진입층 + 38단)
                    </div>
                    <div>
                        <span className="font-medium">적재차판:</span> C75 = {sensorData.rawData?.[75] || 0}
                    </div>
                    <div>
                        <span className="font-medium">연결상태:</span>
                        <span className={isPLCConnected ? 'text-green-600' : 'text-red-600'}>
                            {isPLCConnected ? ' 정상' : ' 끊김'}
                        </span>
                    </div>
                    <div>
                        <span className="font-medium">업데이트:</span>
                        {sensorData.timestamp
                            ? new Date(sensorData.timestamp).toLocaleTimeString()
                            : 'N/A'
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParkingMonitor;