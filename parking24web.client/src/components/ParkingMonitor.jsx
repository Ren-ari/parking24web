import React, { useState, useEffect, useRef } from "react";

const ParkingMonitor = ({ sensorData, isPLCConnected, onVehicleEdit }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [addressMapping, setAddressMapping] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const scrollContainerRef = useRef(null);

  // 박스 타입 정의
  const boxTypes = [
    "홀수차량",
    "홀수차판상태",
    "승강로정보",
    "짝수차판상태",
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
        scrollContainerRef.current.scrollTop =
          scrollContainerRef.current.scrollHeight;
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
        return level >= 1 && level <= 24; // 1단부터 24단까지
      case 2: // 승강로정보
        return level >= 0; // 진입층부터 38단까지
      default:
        return false;
    }
  };

  // 기본 주소 계산
  const getDefaultAddress = (level, box) => {
    switch (box) {
      case 0: // 홀수차량
        return level >= 1 ? `C${96 + (level - 1) * 2}` : "C96";
      case 1: // 홀수차판상태
        return level >= 1 ? `C${150 + (level - 1) * 2}` : "C150";
      case 2: // 승강로정보
        return `C${210 + level}`;
      case 3: // 짝수차판상태
        return level >= 1 ? `C${151 + (level - 1) * 2}` : "C151";
      case 4: // 짝수차량
        return level >= 1 ? `C${97 + (level - 1) * 2}` : "C97";
      default:
        return "C0";
    }
  };

  // 편집용 주소 계산 (D4000번대)
  const getEditAddress = (level, box) => {
    if (level === 0) {
      return box === 0 ? "D4001" : "D4002";
    } else if (level >= 1 && level <= 24) {
      if (box === 0) {
        // 홀수차량
        const address = 4001 + (level - 1) * 2;
        return `D${address}`;
      } else if (box === 4) {
        // 짝수차량
        const address = 4002 + (level - 1) * 2;
        return `D${address}`;
      }
    }
    return box === 0 ? "D4001" : "D4002";
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
      const orderNumber = box === 0 ? level * 2 - 1 : level * 2;
      return loadingPlateValue === orderNumber;
    }

    return false;
  };

  // 박스 색상 결정
  const getBoxColor = (level, box, value) => {
    const isOnLift = isVehicleOnLift(level, box);

    if (box === 2) {
      // 승강로정보 - 0이면 회색, 1이면 주황색
      const liftCounterAddress = `C${210 + level}`;
      const liftCounterValue = getPLCValue(liftCounterAddress);
      
      return liftCounterValue === 0 ? "bg-gray-400" : "bg-orange-400";
    } else if (box === 1 || box === 3) {
      // 차판상태
      return value === 0 ? "bg-gray-300" : "";
    } else if (box === 0 || box === 4) {
      // 차량
      if (isOnLift) return "bg-orange-400";
      return value === 0 ? "bg-gray-300" : "bg-blue-300";
    }

    return "bg-white";
  };

  // 박스 데이터 표시
  const getDisplayValue = (level, box, value) => {
    if (box === 1 || box === 3) {
      // 차판상태
      return value === 0 ? "차량없음" : "차량있음";
    }
    return value.toString();
  };

  // 차판상태 이미지 경로 가져오기
  const getPlateStateImage = (value) => {
    if (value === 1) {
      return "/images/carPlate_mini.png"; // 1이면 차판만
    } else if (value === 2) {
      return "/images/car_mini.png"; // 2이면 차량
    } else {
      return null; // 0이면 이미지 없음
    }
  };

  // 차량번호 편집
  const handleVehicleEdit = (level, box) => {
    if (box !== 0 && box !== 4) return; // 홀수/짝수 차량만
    if (!isPLCConnected) {
      alert("PLC가 연결되지 않았습니다.");
      return;
    }

    // C75 적재차판 상태 확인
    const loadingPlateValue = sensorData.rawData?.[75] || 0;
    if (level >= 1) {
      const orderNumber = box === 0 ? level * 2 - 1 : level * 2;
      if (loadingPlateValue === orderNumber) {
        alert("차판이 리프트에 적재되어 있습니다.");
        return;
      }
    }

    const key = `${level}_${box}`;
    const displayAddress = addressMapping[key];
    const editAddress = getEditAddress(level, box);
    const currentValue = getPLCValue(displayAddress);

    const vehicleType = box === 0 ? "홀수차량" : "짝수차량";
    const levelText = level === 0 ? "1층(진입층)" : level === 1 ? "B1" : `${level}층`;

    let orderText = "";
    if (level >= 1) {
      const orderNumber = box === 0 ? level * 2 - 1 : level * 2;
      orderText = ` (${orderNumber}번)`;
    }

    const newValue = prompt(
      `${levelText} ${vehicleType}${orderText} 편집\n편집주소: ${editAddress}\n현재값: ${currentValue}\n\n새로운 차량번호 (0-9999):`,
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
        `${levelText} ${vehicleType}${orderText}`
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
         <div className="rounded-2xl p-3 md:p-4 border border-white/20 shadow-xl shadow-black/20" style={{
             background: 'rgba(255, 255, 255, 0.95)',
             backdropFilter: 'blur(25px)',
             WebkitBackdropFilter: 'blur(25px)',
         }}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-4 gap-2">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent m-2 sm:mb-0">
              주차 현황 모니터링
            </h2>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">


          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isEditMode
                ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl"
                : "bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
            }`}
          >
            {isEditMode ? "✓ 수정 완료" : "주소 수정"}
          </button>
        </div>
      </div>

      
      {/* 주차장 레이아웃 */}
      <div className="border border-gray-300 rounded-lg h-64 md:h-96 lg:h-[800px]">
        <div
          ref={scrollContainerRef}
          className="h-[90%] overflow-y-auto p-2 sm:p-3 md:p-4 space-y-1 sm:space-y-2 md:space-y-3 mt-4 sm:mt-6 md:mt-8"
        >
          {/* 24층부터 2층까지 역순, 그 다음 1층, 마지막에 B1 표시 */}
          {[...Array.from({ length: 22 }, (_, i) => 23 - i), 0, 1].map((level) => {
            const levelText = level === 0 ? "진입층" : level === 1 ? "B1" : `${level}층`;

            return (
              <div
                key={level}
                className={`border border-white/20 rounded-lg p-2 sm:p-3 md:p-4 shadow-lg ${
                  level === 0
                    ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300"
                    : "bg-gradient-to-br from-blue-50 to-indigo-100 border-gray-200"
                }`}
                style={{
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                <div className="flex items-center space-x-4">
                  {/* 층 라벨 */}
                  <div className="w-12 sm:w-16 md:w-20 text-center flex-shrink-0">
                    <div
                      className={`font-bold text-xs sm:text-sm md:text-base ${
                        level === 0 ? "text-orange-600" : "text-gray-700"
                      }`}
                    >
                      {levelText}
                    </div>
                  </div>

                  {/* 5개 박스 */}
                  <div className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-2 md:gap-3 flex-1 justify-center items-center">
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

                        // 순서 번호 계산
                        let orderNumber = null;
                        if ((box === 0 || box === 4) && level >= 1) {
                          orderNumber = box === 0 ? level * 2 - 1 : level * 2;
                        }

                        return (
                          <div
                            key={box}
                            className="w-16 sm:w-20 md:w-24 lg:w-32 min-w-0"
                          >
                            <div
                              className={`border border-white/20 rounded p-1 sm:p-2 md:p-3 h-20 sm:h-18 md:h-20 lg:h-24 shadow-md ${boxColor} ${
                                box === 1 || box === 3
                                  ? "flex items-center justify-center"
                                  : ""
                              }`}
                              style={{
                                backdropFilter: 'blur(15px)',
                                WebkitBackdropFilter: 'blur(15px)',
                                ...((box === 1 || box === 3) && value !== 0
                                  ? { backgroundColor: "#F0F8FF" }
                                  : {})
                              }}
                            >
                              {/* 박스 타입 라벨 - 홀수차량, 짝수차량, 리프트카운터만 제외 */}
                              {box !== 0 &&
                                box !== 1 &&
                                box !== 2 &&
                                box !== 3 &&
                                box !== 4 && (
                                  <div className="text-[8px] sm:text-xs md:text-sm font-bold text-center text-blue-800 mb-1 leading-tight">
                                    {boxTypes[box]}
                                  </div>
                                )}

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
                                <div className="flex items-center justify-center bg-white border border-white/20 rounded-xl h-[50px] sm:h-[60px] md:h-[65px] lg:h-[70px] w-full shadow-sm" style={{
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
                                    <div className="text-xs sm:text-sm md:text-base text-gray-400">빈 공간</div>
                                  )}
                                </div>
                              ) : box === 2 ? (
                                // 승강로정보는 빈 공간으로 표시
                                <div className="flex items-center justify-center h-12 sm:h-14 md:h-16 w-full">
                                  {/* 빈 공간 */}
                                </div>
                              ) : (
                                // 다른 박스는 기존 텍스트 표시
                                <div
                                  className={`text-center font-bold px-1 sm:px-2 md:px-3 bg-white border border-white/20 rounded shadow-sm cursor-${
                                    box === 0 || box === 4
                                      ? "pointer"
                                      : "default"
                                  } ${
                                    box === 0 || box === 4
                                      ? "py-3 text-sm sm:text-base md:text-lg"
                                      : "py-0.5 text-xs sm:text-sm md:text-base"
                                  } flex items-center justify-center`}
                                  style={{
                                    backdropFilter: 'blur(10px)',
                                    WebkitBackdropFilter: 'blur(10px)',
                                  }}
                                  onDoubleClick={() =>
                                    handleVehicleEdit(level, box)
                                  }
                                  title={
                                    box === 0 || box === 4
                                      ? `${
                                          orderNumber ? `${orderNumber}번 ` : ""
                                        }차량번호 더블클릭으로 편집`
                                      : ""
                                  }
                                >
                                  {displayValue}
                                </div>
                              )}

                              {/* 순서 번호 표시 */}
                              {orderNumber && (
                                <div className="text-xs sm:text-sm md:text-base text-center mt-1">
                                  <span
                                    className={`px-1 sm:px-2 rounded text-white ${
                                      box === 0 ? "bg-blue-500" : "bg-red-500"
                                    }`}
                                  >
                                    {orderNumber}번
                                  </span>
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
  );
};

export default ParkingMonitor;
