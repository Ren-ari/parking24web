import React, { useState, useEffect } from "react";
import { useAuth } from '../hooks/useAuth';
import siteConfig from '../../config/gapEulMyeongGaConfig.js';
import { useTheme } from '../contexts/ThemeContext';

const ParkingMonitor = ({ sensorData, isPLCConnected }) => {
    const [activeTab, setActiveTab] = useState('cart1');
    const [isMobile, setIsMobile] = useState(false);
    const { theme } = useTheme();

    // 화면 크기 감지
    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkIsMobile();
        window.addEventListener("resize", checkIsMobile);
        return () => window.removeEventListener("resize", checkIsMobile);
    }, []);

    // 카트별 차량 주소 계산
    // 하단 제거 후: 각 카트당 15개 슬롯만 사용 (상단만)
    const getVehicleAddress = (cartIndex, slotIndex) => {
        const baseAddress = siteConfig.parkingMonitor.vehicleAddressStart;
        return baseAddress + (cartIndex * 15) + slotIndex;
    };

    // 슬롯 번호를 주소 인덱스로 변환 (각 카트 내부 인덱스 0~14, 하단 제거)
    const getSlotIndexFromNumber = (slotNumber, cartNumber, position) => {
        // 슬롯 번호를 카트 내부 슬롯 번호로 변환 (1~15)
        const slotInCart = ((slotNumber - 1) % 15) + 1;
        
        // 하단 제거 후: 상단만 사용, 슬롯 1~15 → 인덱스 0~14 (순차)
        // P211부터 시작하므로: 슬롯 1번 → 인덱스 0 (P211), 슬롯 15번 → 인덱스 14 (P225)
        return slotInCart - 1;
    };

    // 슬롯 번호 계산 (1단: 1~15, 2단: 16~30, ..., 6단: 76~90)
    const getSlotNumber = (cartNumber, position, index) => {
        const baseSlot = (cartNumber - 1) * 15 + 1; // 각 단의 시작 슬롯 번호
        
        if (position === 'upper') {
            // 상단: 큰 슬롯 4개 + 중간 작은 슬롯 11개 = 총 15개
            // 큰 슬롯 4개: baseSlot+14, baseSlot+13, baseSlot+12, baseSlot+11
            // 중간 작은 슬롯 11개: baseSlot+10 ~ baseSlot+0
            return baseSlot + 14 - index;
        } else {
            // 하단: 큰 슬롯 4개 + 하단 작은 슬롯 11개 = 총 15개
            // 큰 슬롯 4개: baseSlot+14, baseSlot+13, baseSlot+12, baseSlot+11
            // 하단 작은 슬롯 11개: baseSlot+10 ~ baseSlot+0
            return baseSlot + 14 - index;
        }
    };

    // PLC 값 가져오기
    const getPLCValue = (address) => {
        if (!sensorData?.rawData || address >= sensorData.rawData.length) return 0;
        return sensorData.rawData[address];
    };

    // 차량 상태 색상 (개선된 디자인)
    const getVehicleColor = (value) => {
        if (value === 0) {
            // 빈 슬롯 - 회색 계열 + 패턴
            return theme === 'space'
                ? "bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 border-2 border-dashed border-gray-500/50 text-gray-300 shadow-xl transform hover:scale-102 transition-all duration-300"
                : "bg-gradient-to-br from-gray-50 via-white to-gray-100 border-2 border-dashed border-gray-400/60 text-gray-600 shadow-lg transform hover:scale-102 transition-all duration-300";
        } else {
            // 차량 있음 - 더 화려한 디자인
            return theme === 'space'
                ? "bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 border-2 border-solid border-purple-300 text-white shadow-2xl shadow-purple-500/40 slot-pattern animate-float animate-pulse-slow transform hover:scale-105 transition-all duration-300"
                : "bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 border-2 border-solid border-blue-300 text-white shadow-2xl shadow-blue-500/40 slot-pattern animate-float animate-pulse-slow transform hover:scale-105 transition-all duration-300";
        }
    };



    // 카트 영역 렌더링 (상단/하단 공통)
    const renderCartSection = (cartNumber, position, isLower = false) => {
        const cartIndex = cartNumber - 1;
        
        return (
            <div 
                className={`p-6 rounded-2xl border shadow-2xl overflow-x-auto sm:overflow-x-visible scrollbar-hide cart-box-transition ${theme === 'space' ? 'border-purple-500/30' : 'border-blue-300/50'}`}
                style={{
                    background: theme === 'space' 
                        ? 'linear-gradient(145deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.9) 100%)'
                        : 'rgba(248, 250, 255, 0.5)',
                    backdropFilter: 'blur(25px)',
                    WebkitBackdropFilter: 'blur(25px)',
                    ...(isLower && { animationDelay: '0.15s' })
                }}
            >
                {/* 큰 슬롯 4개 + 리프트 */}
                <div className="mb-6">
                    <div className="flex justify-center items-center gap-1 md:gap-1 lg:gap-2 min-w-max sm:min-w-0">
                        {/* 큰 슬롯 4개 */}
                        {Array.from({ length: 4 }, (_, i) => {
                            const slotNumber = getSlotNumber(cartNumber, position, i);
                            const slotIndex = getSlotIndexFromNumber(slotNumber, cartNumber, position);
                            const address = getVehicleAddress(cartIndex, slotIndex);
                            const value = getPLCValue(address);
                            const colorClass = getVehicleColor(value);

                            return (
                                <div
                                    key={`${position}-large-${i}`} 
                                    className={`w-20 h-28 md:w-16 md:h-24 lg:w-24 lg:h-32 flex flex-col items-center justify-center rounded-lg border-2 ${colorClass} text-xs font-bold transition-all duration-300 hover:scale-105 relative`}
                                    style={{
                                        backdropFilter: 'blur(15px)',
                                        WebkitBackdropFilter: 'blur(15px)'
                                    }}
                                >
                                    <div className="font-bold text-xs absolute top-2">{slotNumber}</div>
                                    <div className="text-xl md:text-lg lg:text-2xl font-bold">
                                        {value ? String(value).padStart(4, '0') : ''}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* 리프트 영역 */}
                        <div className={`w-20 h-28 md:w-16 md:h-24 lg:w-24 lg:h-32 flex flex-col items-center justify-center rounded-lg border-2 transition-all duration-300 relative ${
                            theme === 'space' 
                                ? 'bg-gradient-to-br from-cyan-400 via-cyan-500 to-cyan-600 border-cyan-500 text-cyan-100'
                                : 'bg-gradient-to-br from-orange-300 via-orange-400 to-orange-500 border-orange-600 text-orange-900'
                        }`}
                        style={{
                            backdropFilter: 'blur(15px)',
                            WebkitBackdropFilter: 'blur(15px)'
                        }}>
                            <div className="font-bold text-sm md:text-xs lg:text-sm">리프트</div>
                        </div>
                    </div>
                </div>
                
                {/* 작은 슬롯들 */}
                <div className={isLower ? '' : 'mb-4'}>
                    <div className="grid grid-cols-11 gap-1 md:gap-0.5 lg:gap-1 justify-center min-w-max sm:min-w-0">
                        {Array.from({ length: 11 }, (_, i) => {
                            const slotNumber = getSlotNumber(cartNumber, position, i + 4);
                            const slotIndex = getSlotIndexFromNumber(slotNumber, cartNumber, position);
                            const address = getVehicleAddress(cartIndex, slotIndex);
                            const value = getPLCValue(address);
                            const colorClass = getVehicleColor(value);

                            return (
                                <div
                                    key={`${position}-small-${i}`} 
                                    className={`w-16 h-20 md:w-14 md:h-16 lg:w-20 lg:h-24 flex flex-col items-center justify-center rounded-lg border-2 ${colorClass} text-xs font-bold transition-all duration-300 hover:scale-105 relative`}
                                    style={{
                                        backdropFilter: 'blur(15px)',
                                        WebkitBackdropFilter: 'blur(15px)'
                                    }}
                                >
                                    <div className="font-bold text-[8px] md:text-[8px] lg:text-[10px] absolute top-1">{slotNumber}</div>
                                    <div className="text-base md:text-sm lg:text-xl font-bold">
                                        {value ? String(value).padStart(4, '0') : ''}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    // 카트 렌더링
    const renderCart = (cartNumber) => {
        return (
            <div className="space-y-6">
                {renderCartSection(cartNumber, 'upper', false)}
            </div>
        );
    };

    return (
        <>
            <style>
                {`
                    @keyframes pulse-slow {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.85; }
                    }
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-3px); }
                    }
                    @keyframes shimmer {
                        0% { background-position: -200% 0; }
                        100% { background-position: 200% 0; }
                    }
                    .hover\\:scale-102:hover { 
                        transform: scale(1.02); 
                    }
                    @keyframes slideInSmoothly {
                        0% { 
                            opacity: 0; 
                            transform: translateY(30px) scale(0.95);
                        }
                        50% { 
                            opacity: 0.7; 
                            transform: translateY(-5px) scale(1.02);
                        }
                        100% { 
                            opacity: 1; 
                            transform: translateY(0px) scale(1);
                        }
                    }
                    .cart-box-transition {
                        animation: slideInSmoothly 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                    }
                    .scrollbar-hide {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                    .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                    }
                    .slot-pattern {
                        position: relative;
                        overflow: hidden;
                    }
                    .slot-pattern::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: linear-gradient(
                            45deg,
                            transparent 30%,
                            rgba(255,255,255,0.1) 50%,
                            transparent 70%
                        );
                        background-size: 200% 200%;
                        animation: shimmer 3s ease-in-out infinite;
                        pointer-events: none;
                    }
                    .animate-float {
                        animation: float 4s ease-in-out infinite;
                    }
                    .animate-pulse-slow {
                        animation: pulse-slow 2s ease-in-out infinite;
                    }
                `}
            </style>
            <div className={`rounded-2xl shadow-lg p-4 overflow-hidden border-2 ${theme === 'space' ? 'border-purple-500/30' : 'border-white/20'}`} 
                 style={{
                     background: theme === 'space' ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                     backdropFilter: 'blur(25px)',
                     WebkitBackdropFilter: 'blur(25px)',
                 }}>
            
            {/* 헤더 */}
            <div className="mb-10">          
                
                {/* 탭 네비게이션 - 내부 탭 스타일 */}
                <div className="mb-6">
                    {/* 모바일: 3x2 내부 탭 */}
                    <div className="sm:hidden">
                        <div className={`rounded-xl p-2 ${theme === 'space' ? 'bg-gray-800/50' : 'bg-gray-100/80'}`}>
                            <div className="grid grid-cols-3 gap-1">
                                {[1, 2, 3, 4, 5, 6].map(cartNumber => (
                                    <button
                                        key={cartNumber}
                                        onClick={() => setActiveTab(`cart${cartNumber}`)}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                            activeTab === `cart${cartNumber}` 
                                                ? theme === 'space' 
                                                    ? 'bg-purple-600 text-white shadow-md' 
                                                    : 'bg-blue-600 text-white shadow-md'
                                                : theme === 'space'
                                                    ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                                        }`}
                                    >
                                        {cartNumber}단
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* 태블릿/데스크톱: 가로 내부 탭 */}
                    <div className="hidden sm:flex sm:justify-center">
                        <div className={`inline-flex rounded-xl p-1  ${theme === 'space' ? 'bg-gray-800/50' : 'bg-gray-100/80'}`}>
                            {[1, 2, 3, 4, 5, 6].map(cartNumber => (
                                <button
                                    key={cartNumber}
                                    onClick={() => setActiveTab(`cart${cartNumber}`)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        activeTab === `cart${cartNumber}` 
                                            ? theme === 'space' 
                                                ? 'bg-purple-600 text-white shadow-md' 
                                                : 'bg-blue-600 text-white shadow-md'
                                            : theme === 'space'
                                                ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                                    }`}
                                >
                                    {cartNumber}단 카트
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 탭 컨텐츠 */}
            <div className="min-h-96">
                {[1, 2, 3, 4, 5, 6].map(cartNumber => (
                    activeTab === `cart${cartNumber}` && (
                        <div key={cartNumber}>
                            {renderCart(cartNumber)}
                        </div>
                    )
                ))}
            </div>
        </div>
        </>
    );
};

export default ParkingMonitor;