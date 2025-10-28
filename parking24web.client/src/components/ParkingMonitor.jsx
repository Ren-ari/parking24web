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
    const getVehicleAddress = (cartIndex, slotIndex) => {
        const baseAddress = siteConfig.parkingMonitor.vehicleAddressStart;
        return baseAddress + (cartIndex * 30) + slotIndex;
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



    // 카트 렌더링
    const renderCart = (cartNumber) => {
        const cartIndex = cartNumber - 1;

    return (
            <div className="space-y-6">
                {/* 첫 번째 칸 - 상단 영역 */}
                <div 
                    className={`p-6 rounded-2xl border shadow-2xl ${theme === 'space' ? 'border-purple-500/30' : 'border-blue-300/50'}`}
                    style={{
                        background: theme === 'space' 
                            ? 'linear-gradient(145deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.9) 100%)'
                            : 'rgba(248, 250, 255, 0.5)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                    }}
                >
                    <h3 className={`text-lg font-bold mb-4 ${theme === 'space' ? 'text-purple-300' : 'text-blue-600'}`}>
                        상단 영역
                    </h3>
                    
                    {/* 상단 큰 슬롯 4개 + 리프트 */}
                    <div className="mb-6">
                        <div className="flex justify-center items-center gap-2">
                            {/* 큰 슬롯 4개 (30, 29, 28, 27) */}
                            {Array.from({ length: 4 }, (_, i) => {
                                const slotNumber = 30 - i;
                                const address = getVehicleAddress(cartIndex, slotNumber - 1);
                                const value = getPLCValue(address);
                                const colorClass = getVehicleColor(value);

                        return (
                            <div
                                        key={`upper-${i}`} 
                                        className={`w-24 h-32 flex flex-col items-center justify-center rounded-lg border-2 ${colorClass} text-xs font-bold transition-all duration-300 hover:scale-105 relative`}
                                style={{
                                            backdropFilter: 'blur(15px)',
                                            WebkitBackdropFilter: 'blur(15px)'
                                        }}
                                    >
                                        <div className="font-bold text-xs absolute top-2">{slotNumber}</div>
                                        <div className="text-2xl font-bold">
                                            {value ? String(value).padStart(4, '0') : ''}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {/* 리프트 영역 */}
                            <div className={`w-24 h-32 flex flex-col items-center justify-center rounded-lg border-2 transition-all duration-300 relative ${
                                theme === 'space' 
                                    ? 'bg-gradient-to-br from-cyan-400 via-cyan-500 to-cyan-600 border-cyan-500 text-cyan-100'
                                    : 'bg-gradient-to-br from-orange-300 via-orange-400 to-orange-500 border-orange-600 text-orange-900'
                            }`}
                            style={{
                                backdropFilter: 'blur(15px)',
                                WebkitBackdropFilter: 'blur(15px)'
                            }}>
                                <div className="font-bold text-sm">리프트</div>
                            </div>
                        </div>
                    </div>
                    
                    {/* 중간 작은 슬롯들 (26-16번) */}
                    <div className="mb-4">
                        <div className="grid grid-cols-11 gap-1 justify-center">
                            {Array.from({ length: 11 }, (_, i) => {
                                const slotNumber = 26 - i;
                                const address = getVehicleAddress(cartIndex, slotNumber - 1);
                                                const value = getPLCValue(address);
                                const colorClass = getVehicleColor(value);

                                                return (
                                                    <div
                                        key={`middle-${i}`} 
                                        className={`w-20 h-24 flex flex-col items-center justify-center rounded-lg border-2 ${colorClass} text-xs font-bold transition-all duration-300 hover:scale-105 relative`}
                                                            style={{
                                                                backdropFilter: 'blur(15px)',
                                            WebkitBackdropFilter: 'blur(15px)'
                                        }}
                                    >
                                        <div className="font-bold text-[10px] absolute top-1">{slotNumber}</div>
                                        <div className="text-xl font-bold">
                                            {value ? String(value).padStart(4, '0') : ''}
                                        </div>
                                    </div>
                                );
                            })}
                                                                </div>
                                                                        </div>

                                                                </div>

                {/* 두 번째 칸 - 하단 영역 */}
                <div 
                    className={`p-6 rounded-2xl border shadow-2xl ${theme === 'space' ? 'border-purple-500/30' : 'border-blue-300/50'}`}
                                                                    style={{
                        background: theme === 'space' 
                            ? 'linear-gradient(145deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.9) 100%)'
                            : 'rgba(248, 250, 255, 0.5)',
                        backdropFilter: 'blur(25px)',
                        WebkitBackdropFilter: 'blur(25px)',
                    }}
                >
                    <h3 className={`text-lg font-bold mb-4 ${theme === 'space' ? 'text-purple-300' : 'text-blue-600'}`}>
                        하단 영역
                    </h3>

                    {/* 상단 큰 슬롯 4개 (15, 14, 13, 12) + 리프트 */}
                    <div className="mb-6">
                        <div className="flex justify-center items-center gap-2">
                            {[15, 14, 13, 12].map((slotNumber, i) => {
                                const address = getVehicleAddress(cartIndex, slotNumber - 1);
                                const value = getPLCValue(address);
                                const colorClass = getVehicleColor(value);
                                
                                return (
                                    <div 
                                        key={`second-upper-${i}`} 
                                        className={`w-24 h-32 flex flex-col items-center justify-center rounded-lg border-2 ${colorClass} text-xs font-bold transition-all duration-300 hover:scale-105 relative`}
                                        style={{
                                            backdropFilter: 'blur(15px)',
                                            WebkitBackdropFilter: 'blur(15px)'
                                        }}
                                    >
                                        <div className="font-bold text-xs absolute top-2">{slotNumber}</div>
                                        <div className="text-2xl font-bold">
                                            {value ? String(value).padStart(4, '0') : ''}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {/* 리프트 영역 */}
                            <div className={`w-24 h-32 flex flex-col items-center justify-center rounded-lg border-2 transition-all duration-300 relative ${
                                theme === 'space' 
                                    ? 'bg-gradient-to-br from-cyan-400 via-cyan-500 to-cyan-600 border-cyan-500 text-cyan-100'
                                    : 'bg-gradient-to-br from-orange-300 via-orange-400 to-orange-500 border-orange-600 text-orange-900'
                            }`}
                            style={{
                                backdropFilter: 'blur(15px)',
                                WebkitBackdropFilter: 'blur(15px)'
                            }}>
                                <div className="font-bold text-sm">리프트</div>
                            </div>
                                                                </div>
                                                        </div>

                    {/* 하단 작은 슬롯들 (11-1번) */}
                    <div>
                        <div className="grid grid-cols-11 gap-1 justify-center">
                            {Array.from({ length: 11 }, (_, i) => {
                                const slotNumber = 11 - i;
                                const address = getVehicleAddress(cartIndex, slotNumber - 1);
                                const value = getPLCValue(address);
                                const colorClass = getVehicleColor(value);
                                
                                return (
                                    <div 
                                        key={`second-lower-${i}`} 
                                        className={`w-20 h-24 flex flex-col items-center justify-center rounded-lg border-2 ${colorClass} text-xs font-bold transition-all duration-300 hover:scale-105 relative`}
                                        style={{
                                            backdropFilter: 'blur(15px)',
                                            WebkitBackdropFilter: 'blur(15px)'
                                        }}
                                    >
                                        <div className="font-bold text-[10px] absolute top-1">{slotNumber}</div>
                                        <div className="text-lg font-bold">
                                            {value || ''}
                                                            </div>
                                                    </div>
                                                );
                            })}
                        </div>
                                    </div>
                                </div>
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
                
                {/* 탭 네비게이션 */}
                <div className="flex flex-wrap gap-3 mb-4">
                    {[1, 2, 3, 4, 5, 6].map(cartNumber => (
                        <button
                            key={cartNumber}
                            onClick={() => setActiveTab(`cart${cartNumber}`)}
                            className={`px-4 py-2 rounded-full font-bold hover:scale-105 transition-all duration-200 ${
                                activeTab === `cart${cartNumber}` 
                                    ? theme === 'space' ? 'text-white' : 'text-white'
                                    : 'text-gray-800'
                            }`}
                            style={activeTab === `cart${cartNumber}`
                                ? theme === 'space'
                                    ? {
                                        background: 'linear-gradient(145deg, #8b5cf6 0%, #7c3aed 100%)',
                                        border: '1px solid rgba(139, 92, 246, 0.8)',
                                        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 6px 16px rgba(124,58,237,0.4)',
                                        fontSize: '0.875rem'
                                    }
                                    : {
                                        background: 'linear-gradient(145deg, #3b82f6 0%, #2563eb 100%)',
                                        border: '1px solid rgba(59, 130, 246, 0.8)',
                                        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 6px 16px rgba(37,99,235,0.4)',
                                        fontSize: '0.875rem'
                                    }
                                : theme === 'space'
                                    ? {
                                        background: 'linear-gradient(145deg, #e5e7eb 0%, #9ca3af 100%)',
                                        border: '1px solid rgba(156, 163, 175, 0.8)',
                                        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.7), 0 6px 16px rgba(0,0,0,0.25)',
                                        fontSize: '0.875rem'
                                    }
                                    : {
                                        background: 'rgba(255, 255, 255, 0.9)',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                        fontSize: '0.875rem'
                                    }
                            }
                        >
                            {cartNumber}단 카트
                        </button>
                    ))}
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