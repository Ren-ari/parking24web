import React, { useState, useEffect, useRef } from "react";
// 속초 1호기 config import
import siteConfig from '../../config/sokcho1Config.js';


    const ParkingMonitor = ({ sensorData, isPLCConnected, onVehicleEdit, theme }) => {
    const [isEditMode, setIsEditMode] = useState(false);

    const [addressMapping, setAddressMapping] = useState({});
    const [isMobile, setIsMobile] = useState(false);
    const scrollContainerRef = useRef(null);

    // 박스 타입 정의 (속초용)
    const _boxTypes = [
        "홀수차량",
        "홀수",  // 홀수 차판상태
        "승강로정보",
        "짝수",  // 짝수 차판상태
        "짝수차량",
    ];

    // 화면 크기 감지
    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };

        checkIsMobile();
        window.addEventListener("resize", checkIsMobile);

        return () => window.removeEventListener("resize", checkIsMobile);
    }, []);

    // 초기 주소 매핑 설정 (속초용)
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
                scrollContainerRef.current.scrollTop =
                    scrollContainerRef.current.scrollHeight;
            }
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    // 박스 표시 여부 결정 (속초용)
    const shouldShowBox = (level, box) => {
        switch (box) {
            case 0: // 홀수차량
            case 4: // 짝수차량
                return level >= 2 && level <= 38; // 2층부터 38층까지만 주차 가능
            case 1: // 홀수차판상태
            case 3: // 짝수차판상태
                return level >= 2 && level <= 38; // 2층부터만 차판상태 표시
            case 2: // 승강로정보
                return level >= 1; // 1층(진입층)부터 38층까지
            default:
                return false;
        }
    };

    // 기본 주소 계산 (속초용)
    const getDefaultAddress = (level, box) => {
        switch (box) {
            case 0: // 홀수차량 (C101, C103, C105...)
                if (level >= 2) {
                    const slotIndex = (level - 2) * 2; // 2층부터 시작
                    return `C${siteConfig.parkingMonitor.vehicleAddressStart + slotIndex}`;
                }
                return "C101";

            case 1: // 홀수차판상태 - 홀수차량 주소와 동일 (차량 있으면 차판 있음)
                if (level >= 2) {
                    const slotIndex = (level - 2) * 2; // 2층부터 시작
                    return `C${siteConfig.parkingMonitor.vehicleAddressStart + slotIndex}`;
                }
                return "C101";

            case 2: // 승강로정보 (C200~C245)
                if (level === 1) return `C${siteConfig.liftPositions.entrancePos}`; // 1층(진입층)
                if (level >= 2 && level <= 43) {
                    // 2층=C203, 3층=C204, ... 43층=C245
                    return `C${siteConfig.liftPositions.floor1 + (level - 2)}`;
                }
                return `C${siteConfig.liftPositions.counter}`;                     // 카운터

            case 3: // 짝수차판상태 - 짝수차량 주소와 동일 (차량 있으면 차판 있음)
                if (level >= 2) {
                    const slotIndex = (level - 2) * 2 + 1; // 2층부터 시작, 짝수는 +1
                    return `C${siteConfig.parkingMonitor.vehicleAddressStart + slotIndex}`;
                }
                return "C102";

            case 4: // 짝수차량 (C102, C104, C106...)
                if (level >= 2) {
                    const slotIndex = (level - 2) * 2 + 1; // 2층부터 시작, 짝수는 +1
                    return `C${siteConfig.parkingMonitor.vehicleAddressStart + slotIndex}`;
                }
                return "C102";

            default:
                return "C0";
        }
    };

    // 편집용 주소 계산 (속초용 D4000번대)
    const getEditAddress = (level, box) => {
        if (box === 0) { // 홀수차량
            const slotNumber = (level - 1) * 2 + 1;
            return `D${4000 + slotNumber}`;
        } else if (box === 4) { // 짝수차량
            const slotNumber = (level - 1) * 2 + 2;
            return `D${4000 + slotNumber}`;
        }
        return "D4001";
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

    // 리프트 현재 위치 확인 (속초용)
    const getCurrentLiftPosition = () => {
        if (!sensorData.rawData) return null;

        // 속초 리프트 위치 확인 (C203~C245가 1이면 해당 층에 리프트 있음)
        for (let floor = 1; floor <= 43; floor++) {
            const liftAddress = siteConfig.liftPositions.floor1 + (floor - 1); // C203~C245
            if (liftAddress < sensorData.rawData.length) {
                const liftValue = sensorData.rawData[liftAddress];
                if (liftValue === 1) {
                    return floor; // 해당 층에 리프트 있음
                }
            }
        }

        // 1층(진입층)(C201) 또는 턴회전층(C202) 확인
        const entranceValue = sensorData.rawData[siteConfig.liftPositions.entrancePos] || 0;
        const turnValue = sensorData.rawData[siteConfig.liftPositions.turnPos] || 0;

        if (entranceValue === 1) return 1; // 1층(진입층)
        if (turnValue === 1) return -1;    // 턴회전층 (별도 표시)

        return null; // 위치 불명
    };
    const isVehicleOnLift = (level, box) => {
        if (!sensorData.rawData || sensorData.rawData.length <= siteConfig.dataAddresses.loadedPallet) return false;

        const loadingPlateValue = sensorData.rawData[siteConfig.dataAddresses.loadedPallet]; // C75
        if (loadingPlateValue === 0) return false;

        if (level >= 1 && (box === 0 || box === 4)) {
            const slotNumber = box === 0 ? (level - 1) * 2 + 1 : (level - 1) * 2 + 2;
            return loadingPlateValue === slotNumber;
        }

        return false;
    };

    // 박스 색상 결정 (속초용)
    const getBoxColor = (level, box, value) => {
        const isOnLift = isVehicleOnLift(level, box);

        if (box === 2) {
            // 승강로정보 - 리프트 위치에 따라 색상
            const liftAddress = level === 1 ?
                `C${siteConfig.liftPositions.entrancePos}` :
                level >= 1 && level <= 43 ?
                    `C${siteConfig.liftPositions.floor1 + (level - 1)}` :
                    `C${siteConfig.liftPositions.counter}`;
            const liftValue = getPLCValue(liftAddress);
            if (theme === 'space') {
                return liftValue === 0 ? "bg-gray-800" : "bg-orange-400";
            } else {
                return liftValue === 0 ? "bg-gray-400" : "bg-orange-400";
            }
        } else if (box === 1 || box === 3) {
            // 차판상태 - 우주테마는 차량이 있으면 진한 카본, 없으면 회색
            if (theme === 'space') {
                return value === 0 ? "bg-gray-600" : "bg-gray-900";
            } else {
                return value === 0 ? "bg-gray-300" : "bg-green-300";
            }
        } else if (box === 0 || box === 4) {
            // 차량
            if (isOnLift) return "bg-orange-400";
            if (theme === 'space') {
                return value === 0 ? "bg-gray-600" : "bg-purple-400";
            } else {
                return value === 0 ? "bg-gray-300" : "bg-blue-300";
            }
        }

        return "bg-white";
    };

    // 박스 데이터 표시 (속초용)
    const getDisplayValue = (level, box, value) => {
        if (box === 1 || box === 3) {
            // 차판상태 - 차량이 있으면 "차량있음", 없으면 "차량없음"
            return value === 0 ? "차량없음" : "차량있음";
        } else if (box === 0 || box === 4) {
            // 차량번호 - 4자리로 포맷팅
            return value === 0 ? "0000" : value.toString().padStart(4, '0');
        }
        return value.toString();
    };

    // 차판상태 이미지 경로 가져오기 (속초용)
    const getPlateStateImage = (value) => {
        if (value !== 0) {
            return "/images/car_mini.png"; // 차량이 있으면 차량 이미지
        } else {
            return null; // 0이면 이미지 없음
        }
    };

    // 차량번호 편집 (속초용)
    const handleVehicleEdit = (level, box) => {
        if (box !== 0 && box !== 4) return; // 홀수/짝수 차량만
        if (!isPLCConnected) {
            alert("PLC가 연결되지 않았습니다.");
            return;
        }

        // 리프트 적재 상태 확인
        if (isVehicleOnLift(level, box)) {
            alert("차판이 리프트에 적재되어 있습니다.");
            return;
        }

        const key = `${level}_${box}`;
        const displayAddress = addressMapping[key];
        const editAddress = getEditAddress(level, box);
        const currentValue = getPLCValue(displayAddress);

        const vehicleType = box === 0 ? "홀수차량" : "짝수차량";
        const levelText = level === 1 ? "진입층" : `${level}층`;
        const slotNumber = box === 0 ? (level - 1) * 2 + 1 : (level - 1) * 2 + 2;

        const newValue = prompt(
            `${levelText} ${vehicleType} (${slotNumber}번) 편집\n표시주소: ${displayAddress}\n편집주소: ${editAddress}\n현재값: ${currentValue}\n\n새로운 차량번호 (0-9999):`,
            currentValue.toString()
        );

        if (newValue === null) return; // 취소

        const numValue = parseInt(newValue);
        if (isNaN(numValue) || numValue < 0 || numValue > 9999) {
            alert("차량번호는 0~9999 범위여야 합니다.");
            return;
        }

        if (onVehicleEdit) {
            onVehicleEdit(
                editAddress,
                numValue,
                `${levelText} ${vehicleType} (${slotNumber}번)`
            );
        }
    };

    // 주소 매핑 변경
    const handleAddressChange = (level, box, address) => {
        const key = `${level}_${box}`;
        setAddressMapping((prev) => ({
            ...prev,
            [key]: address,
        }));
    };

    return (
        <>
            <style jsx>{`
                .space-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .space-scrollbar::-webkit-scrollbar-track {
                    background: rgba(20, 20, 20, 0.8);
                    border-radius: 4px;
                }
                .space-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(145deg, rgba(147, 51, 234, 0.8) 0%, rgba(124, 58, 237, 0.7) 50%, rgba(76, 29, 149, 0.8) 100%);
                    border-radius: 4px;
                    border: 1px solid rgba(147, 51, 234, 0.3);
                }
                .space-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(145deg, rgba(147, 51, 234, 1) 0%, rgba(124, 58, 237, 0.9) 50%, rgba(76, 29, 149, 1) 100%);
                    box-shadow: 0 0 8px rgba(147, 51, 234, 0.5);
                }
                .space-scrollbar::-webkit-scrollbar-corner {
                    background: rgba(20, 20, 20, 0.8);
                }
            `}</style>
            <div className={`rounded-2xl p-3 md:p-4 border shadow-xl ${theme === 'space' ? 'border-white/20 shadow-black/20' : 'border-gray-300 shadow-gray-200'}`} style={{
            ...(theme === 'space' ? {
                background: 'linear-gradient(135deg, rgba(10, 10, 10, 1) 0%, rgba(5, 5, 5, 1) 100%)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
            } : {
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
            })
        }}>
           

            {/* 속초 주차장 레이아웃 (5개 박스 구조 유지) */}
            <div className={`border rounded-lg h-[60vh] sm:h-[55vh] md:h-[60vh] lg:h-[60vh] ${theme === 'space' ? 'border-gray-600' : 'border-gray-300'}`} style={{
                ...(theme === 'space' ? {
                    background: 'linear-gradient(135deg, rgba(15, 15, 15, 1) 0%, rgba(10, 10, 10, 1) 100%)',
                    backdropFilter: 'blur(15px)',
                    WebkitBackdropFilter: 'blur(15px)',
                } : {
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.7) 100%)',
                })
            }}>
               
                <div
                    ref={scrollContainerRef}
                    className={`h-[95%] overflow-y-auto p-1 sm:p-2 md:p-3 space-y-1 sm:space-y-2 md:space-y-3 ${theme === 'space' ? 'space-scrollbar' : ''}`}
                >
                    {/* 38층부터 2층까지 역순, 그 다음 진입층(1층) */}
                    {[...Array.from({ length: 37 }, (_, i) => 38 - i), 1].map((level) => {
                        const levelText = level === 1 ? "진입층" : `${level}층`;

                        return (
                            <div
                                key={level}
                                className={`border border-white/20 rounded-lg p-1 sm:p-2 md:p-3 shadow-lg ${level === 1
                                        ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300"
                                        : theme === 'space' 
                                            ? "bg-gradient-to-br from-purple-800 to-violet-900 border-purple-900"
                                            : "bg-gradient-to-br from-blue-50 to-indigo-100 border-gray-200"
                                    }`}
                                style={{
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    ...(level !== 1 && theme === 'space' ? {
                                        background: 'linear-gradient(145deg, rgba(76, 29, 149, 0.9) 0%, rgba(91, 33, 182, 0.85) 25%, rgba(109, 40, 217, 0.8) 50%, rgba(124, 58, 237, 0.85) 75%, rgba(147, 51, 234, 0.9) 100%)',
                                        border: '1px solid rgba(76, 29, 149, 1)',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(196, 181, 253, 0.4), inset 0 -1px 2px rgba(76, 29, 149, 0.6)'
                                    } : {})
                                }}
                            >
                                <div className="flex items-center space-x-4">
                                    {/* 층 라벨 */}
                                    <div className="w-12 sm:w-16 md:w-20 text-center flex-shrink-0">
                                        <div
                                            className={`font-bold text-xs sm:text-sm md:text-base ${level === 1 ? "text-orange-600" : theme === 'space' ? "text-white" : "text-gray-700"
                                                }`}
                                        >
                                            {levelText}
                                        </div>
                                    </div>

                                    {/* 5개 박스 */}
                                    <div className="flex flex-wrap sm:flex-nowrap gap-0.5 sm:gap-1 md:gap-2 flex-1 justify-center items-center">
                                        {/* 모바일: 홀수차량, 승강로정보, 짝수차량 / 데스크탑: 전체 */}
                                        {(isMobile ? [0, 2, 4] : [0, 1, 2, 3, 4]).map(
                                            (box) => {
                                                if (!shouldShowBox(level, box)) {
                                                    return (
                                                        <div
                                                            key={box}
                                                            className="w-16 sm:w-20 md:w-24 lg:w-32"
                                                        ></div>
                                                    );
                                                }

                                                const key = `${level}_${box}`;
                                                const address = addressMapping[key] || "";
                                                const value = getPLCValue(address);
                                                const displayValue = getDisplayValue(level, box, value);
                                                const boxColor = getBoxColor(level, box, value);

                                                // 슬롯 번호 계산
                                                let slotNumber = null;
                                                if ((box === 0 || box === 4) && level >= 1) {
                                                    slotNumber = box === 0 ? (level - 1) * 2 + 1 : (level - 1) * 2 + 2;
                                                }

                                                return (
                                                    <div
                                                        key={box}
                                                        className="w-16 sm:w-20 md:w-24 lg:w-32 min-w-0"
                                                    >
                                                        <div
                                                            className={`border border-white/20 rounded p-1 sm:p-2 md:p-3 h-16 sm:h-18 md:h-20 lg:h-24 shadow-md ${boxColor} ${box === 1 || box === 3
                                                                    ? "flex items-center justify-center"
                                                                    : ""
                                                                }`}
                                                            style={{
                                                                backdropFilter: 'blur(15px)',
                                                                WebkitBackdropFilter: 'blur(15px)',
                                                                ...((box === 1 || box === 3) && value !== 0 && theme !== 'space'
                                                                    ? { backgroundColor: "#F0F8FF" }
                                                                    : {})
                                                            }}
                                                        >
                                                            {/* 박스 타입 라벨 제거 - 상단 헤더에서 표시 */}
                                                            {/* 주소 입력 (편집 모드) */}
                                                            {isEditMode && (
                                                                <input
                                                                    type="text"
                                                                    value={address}
                                                                    onChange={(e) =>
                                                                        handleAddressChange(
                                                                            level,
                                                                            box,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    className="w-full text-[8px] sm:text-xs md:text-sm px-0.5 sm:px-1 md:px-2 py-0.5 border rounded mb-1"
                                                                    placeholder="주소"
                                                                />
                                                            )}

                                                            {/* 데이터 표시 */}
                                                            {box === 1 || box === 3 ? (
                                                                // 차판상태는 값에 따라 이미지 표시
                                                                <div className={`flex items-center justify-center ${theme === 'space' ? (value !== 0 ? 'bg-gray-900 border-gray-900' : 'bg-gray-700 border-gray-600') : 'bg-white border-white/20'} rounded-xl h-[32px] sm:h-[60px] md:h-[65px] lg:h-[70px] w-full shadow-sm`} style={{
                                                                    backdropFilter: 'blur(10px)',
                                                                    WebkitBackdropFilter: 'blur(10px)',
                                                                }}>
                                                                    {getPlateStateImage(value) ? (
                                                                        <img
                                                                            src={getPlateStateImage(value)}
                                                                            alt={`차판상태 ${value}`}
                                                                            className="object-contain max-w-full max-h-full"
                                                                            onError={(e) => {
                                                                                console.error(
                                                                                    "이미지 로딩 실패:",
                                                                                    e.target.src
                                                                                );
                                                                            }}
                                                                            onLoad={(e) => {
                                                                                console.log(
                                                                                    "이미지 로딩 성공:",
                                                                                    e.target.src
                                                                                );
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <span className="text-gray-400 text-xs"></span>
                                                                    )}
                                                                </div>
                                                            ) : box === 2 ? (
                                                                // 승강로정보 - 리프트 위치에 따라 carPlate_mini.png 표시
                                                                <div className="flex items-center justify-center h-10 sm:h-14 md:h-16 w-full">
                                                                    {getCurrentLiftPosition() === level ? (
                                                                        // 현재 층에 리프트가 있으면 carPlate_mini.png 표시
                                                                        <div className={`border border-white/20 rounded-xl p-2 w-full h-full flex items-center justify-center ${theme === 'space' ? 'bg-purple-200' : 'bg-white'}`} style={{
                                                                            backdropFilter: 'blur(10px)',
                                                                            WebkitBackdropFilter: 'blur(10px)',
                                                                        }}>
                                                                            <img
                                                                                src="/images/carPlate_mini.png"
                                                                                alt="리프트 위치"
                                                                                className="object-contain max-w-full max-h-full"
                                                                                onError={(e) => {
                                                                                    console.error("리프트 이미지 로딩 실패:", e.target.src);
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        // 다른 층은 빈 공간
                                                                        <div className="w-full h-full"></div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                // 홀수차량, 짝수차량
                                                                <div
                                                                    className={`text-center font-bold px-1 sm:px-2 md:px-3 ${theme === 'space' ? 'bg-black' : 'bg-white'} border ${theme === 'space' && value !== 0 ? 'border-purple-400' : 'border-white/20'} rounded shadow-sm cursor-${box === 0 || box === 4
                                                                            ? "pointer"
                                                                            : "default"
                                                                        } ${box === 0 || box === 4
                                                                            ? "py-1 sm:py-3 text-sm sm:text-base md:text-lg"
                                                                            : "py-0.5 text-xs sm:text-sm md:text-base"
                                                                        } flex items-center justify-center`}
                                                                    style={{
                                                                        backdropFilter: 'blur(10px)',
                                                                        WebkitBackdropFilter: 'blur(10px)',
                                                                        ...(theme === 'space' ? { backgroundColor: '#000000' } : { backgroundColor: '#ffffff' })
                                                                    }}
                                                                    onDoubleClick={() =>
                                                                        handleVehicleEdit(level, box)
                                                                    }
                                                                    title={
                                                                        box === 0 || box === 4
                                                                            ? `${slotNumber ? `${slotNumber}번 ` : ""
                                                                            }차량번호 더블클릭으로 편집`
                                                                            : ""
                                                                    }
                                                                >
                                                                    <span className={`${theme === 'space' ? 'text-white' : 'text-black'} font-bold text-lg`} style={{ fontWeight: 'bold', fontSize: '16px' }}>{displayValue}</span>
                                                                </div>
                                                            )}

                                                            {/* 슬롯 번호 표시 */}
                                                            {slotNumber && (
                                                                <div className="text-xs sm:text-sm md:text-base text-center mt-1">
                                                                    <span
                                                                        className={`px-1 sm:px-2 rounded text-white ${box === 0 ? (theme === 'space' ? "bg-purple-500" : "bg-blue-500") : "bg-red-500"
                                                                            }`}
                                                                    >
                                                                        {slotNumber}번
                                                                    </span>
                                                                    {isVehicleOnLift(level, box) && (
                                                                        <span className="ml-1 px-1 sm:px-2 rounded bg-orange-500 text-white text-xs">
                                                                            적재중
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* 편집 주소 표시 (편집 모드) */}
                                                        {isEditMode && (box === 0 || box === 4) && (
                                                            <div className="text-xs sm:text-sm md:text-base text-center text-gray-500 mt-1">
                                                                편집: {getEditAddress(level, box)}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
        </>
    );
};

export default ParkingMonitor;