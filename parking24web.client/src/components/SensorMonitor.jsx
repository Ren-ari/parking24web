import React, { useState, useMemo, useEffect } from 'react';
// 속초 1호기 config import

import siteConfig from '../../config/sokcho1Config.js';
import { useTheme } from '../contexts/ThemeContext';

const SensorMonitor = ({ sensorData, isPLCConnected }) => {
    const { theme, isSpaceTheme, isDarkTheme, isOceanTheme } = useTheme();
    const [viewMode, setViewMode] = useState('parsed'); // 'parsed' or 'raw' or 'hex' or 'bits'
    const [showZeroValues, setShowZeroValues] = useState(false);
    const [searchFilter, setSearchFilter] = useState('');
    const [rawLog, setRawLog] = useState([]);
    const [showRawStream, setShowRawStream] = useState(false);
    const [showPLCChecklist, setShowPLCChecklist] = useState(false);
    const [sortField, setSortField] = useState('address'); // 정렬 필드
    const [sortDirection, setSortDirection] = useState('asc'); // 정렬 방향

    // 센서 데이터 필터링 및 정렬
    const filteredData = useMemo(() => {
        let data = [];

        if (viewMode === 'parsed' && sensorData.parsedData) {
            // 파싱된 데이터 표시
            data = Object.entries(sensorData.parsedData).map(([key, value]) => ({
                address: key,
                value: value,
                displayValue: value.toString(),
                type: 'parsed'
            }));
        } else if (viewMode === 'raw' && sensorData.rawData) {
            // 원시 데이터 표시 (C0 ~ C255)
            data = sensorData.rawData.map((value, index) => ({
                address: `C${index}`,
                value: value,
                displayValue: value.toString(),
                type: 'raw'
            }));
        } else if (viewMode === 'hex' && sensorData.rawData) {
            // 16진수로 표시
            data = sensorData.rawData.map((value, index) => ({
                address: `C${index}`,
                value: value,
                displayValue: `0x${value.toString(16).toUpperCase().padStart(4, '0')}`,
                type: 'hex'
            }));
        } else if (viewMode === 'bits' && sensorData.rawData) {
            // 비트 모니터 모드 - 속초 센서 매핑 사용
            data = [];

            // 속초 config의 센서 매핑을 기반으로 비트 데이터 생성
            Object.entries(siteConfig.sensorMapping).forEach(([  , configData]) => {
                const { address, sensors } = configData;

                if (address < sensorData.rawData.length) {
                    const wordValue = sensorData.rawData[address];

                    // 각 비트별 센서 상태 확인
                    Object.entries(sensors).forEach(([bitIndex, sensorInfo]) => {
                        const bitValue = (wordValue >> parseInt(bitIndex)) & 1;

                        data.push({
                            address: `C${address}.${bitIndex}`,
                            name: sensorInfo.name,
                            description: sensorInfo.description,
                            category: sensorInfo.category,
                            value: bitValue,
                            wordValue: wordValue,
                            displayValue: bitValue ? 'ON' : 'OFF',
                            type: 'bits',
                            status: bitValue ? 'active' : 'inactive',
                            wordIndex: address,
                            bitIndex: parseInt(bitIndex)
                        });
                    });
                }
            });
        }

        // 0값 필터링
        if (!showZeroValues) {
            data = data.filter(item => item.value !== 0);
        }

        // 검색 필터
        if (searchFilter) {
            data = data.filter(item =>
                item.address.toLowerCase().includes(searchFilter.toLowerCase()) ||
                item.displayValue.toLowerCase().includes(searchFilter.toLowerCase()) ||
                (item.name && item.name.toLowerCase().includes(searchFilter.toLowerCase())) ||
                (item.category && item.category.toLowerCase().includes(searchFilter.toLowerCase()))
            );
        }

        return data;
    }, [sensorData, viewMode, showZeroValues, searchFilter]);

    // PLC 체크리스트용 데이터 (비트 모니터 기반)
    const plcChecklistData = useMemo(() => {
        let data = [];

        if (sensorData.rawData) {
            // 속초 config의 센서 매핑을 기반으로 비트 데이터 생성
            Object.entries(siteConfig.sensorMapping).forEach(([  , configData]) => {
                const { address, sensors } = configData;

                if (address < sensorData.rawData.length) {
                    const wordValue = sensorData.rawData[address];

                    // 각 비트별 센서 상태 확인
                    Object.entries(sensors).forEach(([bitIndex, sensorInfo]) => {
                        const bitValue = (wordValue >> parseInt(bitIndex)) & 1;

                        data.push({
                            address: `C${address}.${bitIndex}`,
                            name: sensorInfo.name,
                            description: sensorInfo.description,
                            category: sensorInfo.category,
                            value: bitValue,
                            displayValue: bitValue ? 'ON' : 'OFF',
                            status: bitValue ? 'active' : 'inactive',
                            rawValue: bitValue
                        });
                    });
                }
            });
        }

        // 정렬 로직
        data.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortField) {
                case 'address':
                    const aAddr = a.address.split('.');
                    const bAddr = b.address.split('.');
                    const aWord = parseInt(aAddr[0].substring(1));
                    const bWord = parseInt(bAddr[0].substring(1));
                    const aBit = parseInt(aAddr[1]);
                    const bBit = parseInt(bAddr[1]);
                    
                    if (aWord !== bWord) {
                        aValue = aWord;
                        bValue = bWord;
                    } else {
                        aValue = aBit;
                        bValue = bBit;
                    }
                    break;
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'status':
                    aValue = a.status === 'active' ? 1 : 0;
                    bValue = b.status === 'active' ? 1 : 0;
                    break;
                case 'category':
                    aValue = a.category.toLowerCase();
                    bValue = b.category.toLowerCase();
                    break;
                default:
                    aValue = a[sortField];
                    bValue = b[sortField];
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return data;
    }, [sensorData, sortField, sortDirection]);

    // 실시간 raw 데이터 로그 업데이트
    useEffect(() => {
        if (sensorData.rawData && sensorData.timestamp) {
            const logEntry = {
                timestamp: new Date(sensorData.timestamp).toLocaleTimeString(),
                data: sensorData.rawData.slice(0, 20), // 처음 20개만
                fullData: sensorData.rawData
            };
            setRawLog(prev => [logEntry, ...prev.slice(0, 49)]); // 최대 50개 유지
        }
    }, [sensorData.rawData, sensorData.timestamp]);

    // 비트 분석 함수
    const getBitAnalysis = (value) => {
        const bits = [];
        for (let i = 15; i >= 0; i--) {
            bits.push((value >> i) & 1);
        }
        return bits;
    };

    const _formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleTimeString();
    };

    // 정렬 핸들러
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // 테마별 스타일링 함수들
    const getMainBackgroundStyle = () => {
        switch (theme) {
            case 'space':
                return {
                    background: 'rgba(20, 20, 20, 0.95)',
                    backdropFilter: 'blur(25px)',
                    WebkitBackdropFilter: 'blur(25px)',
                };
            case 'dark':
                return {
                    background: 'rgba(20, 20, 20, 0.95)',
                    backdropFilter: 'blur(25px)',
                    WebkitBackdropFilter: 'blur(25px)',
                };
            case 'ocean':
                return {
                    background: 'rgba(0, 20, 40, 0.95)',
                    backdropFilter: 'blur(25px)',
                    WebkitBackdropFilter: 'blur(25px)',
                };
            default:
                return {
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(25px)',
                    WebkitBackdropFilter: 'blur(25px)',
                };
        }
    };

    const getMainBorderClass = () => {
        switch (theme) {
            case 'space': return 'border-purple-500/30';
            case 'dark': return 'border-gray-600/30';
            case 'ocean': return 'border-blue-500/30';
            default: return 'border-white/20';
        }
    };

    const getTitleGradient = () => {
        switch (theme) {
            case 'space': return 'bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent';
            case 'dark': return 'bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-transparent';
            case 'ocean': return 'bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent';
            default: return 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent';
        }
    };

    const getControlPanelStyle = () => {
        switch (theme) {
            case 'space':
                return 'bg-gradient-to-br from-purple-600/80 via-purple-700/70 to-purple-800/80 border-purple-500/90 shadow-lg shadow-purple-600/30';
            case 'dark':
                return 'bg-gradient-to-br from-gray-700/50 via-gray-800/40 to-gray-900/50 border-gray-600/50 shadow-lg shadow-gray-500/20';
            case 'ocean':
                return 'bg-gradient-to-br from-blue-800/50 via-blue-900/40 to-cyan-900/50 border-blue-500/50 shadow-lg shadow-blue-500/20';
            default:
                return 'bg-gradient-to-br from-blue-50 to-indigo-100 border-gray-200 shadow-lg shadow-blue-500/10';
        }
    };

    const getButtonActiveStyle = () => {
        switch (theme) {
            case 'space': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg scale-105 shadow-purple-500/25';
            case 'dark': return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg scale-105 shadow-gray-500/25';
            case 'ocean': return 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg scale-105 shadow-blue-500/25';
            default: return 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105 shadow-blue-500/25';
        }
    };

    const getButtonInactiveStyle = () => {
        switch (theme) {
            case 'space': return 'text-gray-300 hover:text-gray-200 hover:bg-gray-500/50 hover:scale-102';
            case 'dark': return 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30 hover:scale-102';
            case 'ocean': return 'text-blue-300 hover:text-blue-200 hover:bg-blue-800/30 hover:scale-102';
            default: return 'text-gray-600 hover:text-purple-600 hover:bg-purple-50 hover:scale-102';
        }
    };

    const getToggleActiveStyle = () => {
        switch (theme) {
            case 'space':
                return {
                    background: 'linear-gradient(135deg, rgba(196, 181, 253, 0.9) 0%, rgba(167, 139, 250, 0.9) 100%)', // 밝은 보라색
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    minHeight: '4px'
                };
            case 'dark':
                return {
                    background: 'linear-gradient(135deg, rgba(196, 181, 253, 0.9) 0%, rgba(167, 139, 250, 0.9) 100%)', // 밝은 보라색
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    minHeight: '4px'
                };
            case 'ocean':
                return {
                    background: 'linear-gradient(135deg, rgba(196, 181, 253, 0.9) 0%, rgba(167, 139, 250, 0.9) 100%)', // 밝은 보라색
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    minHeight: '4px'
                };
            default:
                return {
                    background: 'linear-gradient(135deg, rgba(196, 181, 253, 0.9) 0%, rgba(167, 139, 250, 0.9) 100%)', // 밝은 보라색
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    minHeight: '4px'
                };
        }
    };

    const getToggleInactiveStyle = () => {
        switch (theme) {
            case 'space':
                return {
                    background: 'rgba(107, 114, 128, 0.5)', // 더 진한 회색
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    minHeight: '4px'
                };
            case 'dark':
                return {
                    background: 'rgba(75, 85, 99, 0.5)', // 더 진한 회색
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    minHeight: '4px'
                };
            case 'ocean':
                return {
                    background: 'rgba(75, 85, 99, 0.5)', // 더 진한 회색
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    minHeight: '4px'
                };
            default:
                return {
                    background: 'rgba(107, 114, 128, 0.5)', // 더 진한 회색
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    minHeight: '4px'
                };
        }
    };

    const getLabelTextColor = () => {
        switch (theme) {
            case 'space': return 'text-purple-200';
            case 'dark': return 'text-gray-300';
            case 'ocean': return 'text-blue-200';
            default: return 'text-gray-700';
        }
    };

    const getSearchInputStyle = () => {
        switch (theme) {
            case 'space':
                return 'w-full pl-10 pr-4 py-3 border border-gray-500/70 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300 hover:border-gray-400 bg-gradient-to-br from-gray-600/80 to-gray-700/80 focus:bg-gradient-to-br from-gray-500/80 to-gray-600/80 text-gray-200';
            case 'dark':
                return 'w-full pl-10 pr-4 py-3 border border-gray-600/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-300 hover:border-gray-500 bg-gradient-to-br from-gray-800/50 to-gray-900/50 focus:bg-gradient-to-br from-gray-700/50 to-gray-800/50 text-gray-200';
            case 'ocean':
                return 'w-full pl-10 pr-4 py-3 border border-blue-500/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-400 bg-gradient-to-br from-blue-900/50 to-cyan-900/50 focus:bg-gradient-to-br from-blue-800/50 to-blue-900/50 text-blue-100';
            default:
                return 'w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-400 bg-gray-50 focus:bg-white text-gray-900';
        }
    };

    // 카테고리별 색상 정의 (속초용)
    const getCategoryColor = (category) => {
        switch (category) {
            case '시스템': return 'from-purple-500 to-indigo-600';
            case '도어': return 'from-blue-500 to-cyan-600';
            case '안전센서': return 'from-red-500 to-pink-600';
            case '위치센서': return 'from-green-500 to-emerald-600';
            case '리프트': return 'from-yellow-500 to-orange-600';
            case '턴테이블': return 'from-indigo-500 to-purple-600';
            case '후크': return 'from-gray-500 to-slate-600';
            case '횡행': return 'from-teal-500 to-cyan-600';
            case '출력': return 'from-orange-500 to-red-600';
            default: return 'from-gray-400 to-gray-600';
        }
    };

    return (

        <div className="rounded-2xl p-3 md:p-4 overflow-hidden border border-white/20 shadow-xl shadow-black/20" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
        }}>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-4 space-y-2 md:space-y-0">
                <h2 className="text-base md:text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 md:mb-0">
                    센서 데이터 모니터 - {siteConfig.siteInfo.name} {siteConfig.siteInfo.unitNumber}

                </h2>
            </div>

            {/* 컨트롤 패널 */}
            <div className="mb-6 space-y-4">
                {/* 표시 모드 선택 - 세련된 탭 스타일 */}
                <div className={`${getControlPanelStyle()} p-1 rounded-2xl shadow-lg`}>
                    <div className="grid grid-cols-4 gap-1">
                        <button
                            onClick={() => setViewMode('parsed')}
                            className={`flex-shrink-0 px-4 md:px-6 py-2 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all duration-500 ease-in-out transform ${viewMode === 'parsed'
                                ? getButtonActiveStyle()
                                : getButtonInactiveStyle()
                                }`}
                        >
                            파싱된 데이터
                        </button>
                        <button
                            onClick={() => setViewMode('raw')}
                            className={`flex-shrink-0 px-4 md:px-6 py-2 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all duration-500 ease-in-out transform ${viewMode === 'raw'
                                ? getButtonActiveStyle()
                                : getButtonInactiveStyle()
                                }`}
                        >
                            원시 데이터
                        </button>
                        <button
                            onClick={() => setViewMode('hex')}
                            className={`flex-shrink-0 px-4 md:px-6 py-2 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all duration-500 ease-in-out transform ${viewMode === 'hex'
                                ? getButtonActiveStyle()
                                : getButtonInactiveStyle()
                                }`}
                        >
                            16진수
                        </button>
                        <button
                            onClick={() => setViewMode('bits')}
                            className={`flex-shrink-0 px-4 md:px-6 py-2 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all duration-500 ease-in-out transform ${viewMode === 'bits'
                                ? getButtonActiveStyle()
                                : getButtonInactiveStyle()
                                }`}
                        >
                            속초 비트 모니터
                        </button>
                    </div>
                </div>

                {/* 필터 및 검색 영역 */}
                <div className={`${getControlPanelStyle()} p-4 rounded-2xl shadow-lg`}>
                    <div className="flex flex-col gap-4">
                        {/* 0값 표시 토글, 실시간 스트림 토글, PLC 체크리스트 토글 */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-8 justify-start sm:justify-center">
                                <div className="flex items-center justify-between w-full sm:w-auto space-x-2 sm:space-x-4">
                                <span className={`text-xs sm:text-sm font-semibold ${getLabelTextColor()}`}>0값 표시</span>
                                <button
                                    onClick={() => setShowZeroValues(!showZeroValues)}
                                    className={`relative inline-flex h-6 w-16 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 ${showZeroValues
                                        ? 'shadow-lg shadow-blue-500/25'
                                        : 'shadow-md shadow-gray-400/20'
                                        }`}
                                    style={showZeroValues ? getToggleActiveStyle() : getToggleInactiveStyle()}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full transition-all duration-300 ease-in-out ${showZeroValues ? 'translate-x-10' : 'translate-x-1'
                                            }`}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.95)',
                                            backdropFilter: 'blur(5px)',
                                            WebkitBackdropFilter: 'blur(5px)',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                                        }}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between w-full sm:w-auto space-x-2 sm:space-x-4">
                                <span className={`text-xs sm:text-sm font-semibold ${getLabelTextColor()}`}>실시간 스트림</span>
                                <button
                                    onClick={() => setShowRawStream(!showRawStream)}
                                    className={`relative inline-flex h-6 w-16 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 ${showRawStream
                                        ? 'shadow-lg shadow-blue-500/25'
                                        : 'shadow-md shadow-gray-400/20'
                                        }`}
                                    style={showRawStream ? getToggleActiveStyle() : getToggleInactiveStyle()}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full transition-all duration-300 ease-in-out ${showRawStream ? 'translate-x-10' : 'translate-x-1'
                                            }`}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.95)',
                                            backdropFilter: 'blur(5px)',
                                            WebkitBackdropFilter: 'blur(5px)',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                                        }}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between w-full sm:w-auto space-x-2 sm:space-x-4">
                                <span className={`text-xs sm:text-sm font-semibold ${getLabelTextColor()}`}>PLC 체크리스트</span>
                                <button
                                    onClick={() => setShowPLCChecklist(!showPLCChecklist)}
                                    className={`relative inline-flex h-6 w-16 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 ${showPLCChecklist
                                        ? 'shadow-lg shadow-green-500/25'
                                        : 'shadow-md shadow-gray-400/20'
                                        }`}
                                    style={showPLCChecklist ? getToggleActiveStyle() : getToggleInactiveStyle()}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full transition-all duration-300 ease-in-out ${showPLCChecklist ? 'translate-x-10' : 'translate-x-1'
                                            }`}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.95)',
                                            backdropFilter: 'blur(5px)',
                                            WebkitBackdropFilter: 'blur(5px)',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                                        }}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* 검색창 - 세련된 디자인 */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className={`h-4 w-4 ${theme === 'space' ? 'text-purple-500' : theme === 'dark' ? 'text-gray-400' : theme === 'ocean' ? 'text-blue-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"                      
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                className={getSearchInputStyle()}
                            />
                            {searchFilter && (
                                <button
                                    onClick={() => setSearchFilter('')}
                                    className={`absolute inset-y-0 right-0 pr-3 flex items-center ${theme === 'space' ? 'text-purple-500 hover:text-purple-600' : theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : theme === 'ocean' ? 'text-blue-400 hover:text-blue-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 실시간 바이트 스트림 */}
            {showRawStream && (
                <div className="mb-6 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-green-400 p-6 rounded-2xl shadow-2xl border border-gray-700 transform transition-all duration-700 ease-in-out">
                    <div className="mb-4 flex items-center space-x-2">
                        <div className="animate-pulse w-3 h-3 bg-green-500 rounded-full"></div>
                        <div className="text-yellow-400 font-semibold">실시간 속초 PLC 데이터 스트림</div>
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                    <div className="h-64 overflow-y-auto font-mono text-xs space-y-1 custom-scrollbar">
                        {rawLog.map((entry, index) => (
                            <div
                                key={index}
                                className={`transition-all duration-500 ease-in-out transform ${index === 0 ? 'scale-105 bg-green-900/30 rounded px-2 py-1' : ''
                                    }`}
                                style={{
                                    animationDelay: `${index * 50}ms`
                                }}
                            >
                                <span className="text-blue-400 font-semibold">[{entry.timestamp}]</span>
                                <span className="ml-2 text-green-300">
                                    {entry.data.map((byte, byteIndex) => (
                                        <span
                                            key={byteIndex}
                                            className="hover:bg-yellow-400 hover:text-black rounded px-1 transition-colors duration-200"
                                        >
                                            {byte.toString(16).padStart(2, '0')}
                                        </span>
                                    )).reduce((prev, curr, index) => [prev, <span key={`sep-${index}`} className="text-gray-500"> </span>, curr])}
                                    <span className="text-purple-400">...</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PLC 체크리스트 */}
            {showPLCChecklist && (
                <div className={`mb-6 p-6 rounded-2xl shadow-2xl transform transition-all duration-700 ease-in-out ${theme === 'space' ? 'bg-gradient-to-br from-purple-900/80 to-indigo-900/80 border-purple-500/30' : theme === 'dark' ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-600/30' : theme === 'ocean' ? 'bg-gradient-to-br from-blue-900/80 to-cyan-900/80 border-blue-500/30' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}>
                    <div className="mb-4 flex items-center space-x-2">
                        <div className={`animate-pulse w-3 h-3 rounded-full ${theme === 'space' ? 'bg-purple-500' : theme === 'dark' ? 'bg-green-500' : theme === 'ocean' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                        <div className={`font-bold text-lg ${theme === 'space' ? 'text-purple-200' : theme === 'dark' ? 'text-gray-200' : theme === 'ocean' ? 'text-blue-200' : 'text-gray-800'}`}>속초 1호기 PLC 체크리스트 (C060~C072)</div>
                        <div className="flex space-x-1">
                            <div className={`w-2 h-2 rounded-full animate-ping ${theme === 'space' ? 'bg-purple-400' : theme === 'dark' ? 'bg-green-400' : theme === 'ocean' ? 'bg-blue-400' : 'bg-green-400'}`}></div>
                            <div className={`w-2 h-2 rounded-full animate-ping ${theme === 'space' ? 'bg-purple-300' : theme === 'dark' ? 'bg-indigo-500' : theme === 'ocean' ? 'bg-cyan-400' : 'bg-indigo-500'}`} style={{ animationDelay: '200ms' }}></div>
                        </div>
                    </div>

                    <div className={`rounded-xl overflow-hidden shadow-lg ${theme === 'space' ? 'bg-gradient-to-br from-purple-700/60 via-purple-800/50 to-purple-900/60 border-purple-500/30 shadow-xl shadow-purple-500/20' : theme === 'dark' ? 'bg-gradient-to-br from-gray-700/60 via-gray-800/50 to-gray-900/60 border-gray-600/30 shadow-xl shadow-gray-500/20' : theme === 'ocean' ? 'bg-gradient-to-br from-blue-700/60 via-blue-800/50 to-blue-900/60 border-blue-500/30 shadow-xl shadow-blue-500/20' : 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-200 shadow-xl shadow-gray-500/10'}`}>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className={`text-white ${theme === 'space' ? 'bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-500/25' : theme === 'dark' ? 'bg-gradient-to-br from-gray-500 to-gray-700 shadow-lg shadow-gray-500/25' : theme === 'ocean' ? 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/25' : 'bg-gradient-to-br from-gray-400 to-gray-600 shadow-lg shadow-gray-500/25'}`}>
                                    <tr>
                                        <th 
                                            className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors duration-200 select-none ${theme === 'space' ? 'hover:bg-purple-700' : theme === 'dark' ? 'hover:bg-gray-700' : theme === 'ocean' ? 'hover:bg-blue-700' : 'hover:bg-gray-600'}`}
                                            onClick={() => handleSort('address')}
                                        >
                                            <div className="flex items-center justify-center space-x-1">
                                                <span>주소</span>
                                                {sortField === 'address' && (
                                                    <span className="text-yellow-300">
                                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                        <th 
                                            className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors duration-200 select-none ${theme === 'space' ? 'hover:bg-purple-700' : theme === 'dark' ? 'hover:bg-gray-700' : theme === 'ocean' ? 'hover:bg-blue-700' : 'hover:bg-gray-600'}`}
                                            onClick={() => handleSort('name')}
                                        >
                                            <div className="flex items-center justify-center space-x-1">
                                                <span>설명</span>
                                                {sortField === 'name' && (
                                                    <span className="text-yellow-300">
                                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                        <th 
                                            className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors duration-200 select-none ${theme === 'space' ? 'hover:bg-purple-700' : theme === 'dark' ? 'hover:bg-gray-700' : theme === 'ocean' ? 'hover:bg-blue-700' : 'hover:bg-gray-600'}`}
                                            onClick={() => handleSort('status')}
                                        >
                                            <div className="flex items-center justify-center space-x-1">
                                                <span>상태</span>
                                                {sortField === 'status' && (
                                                    <span className="text-yellow-300">
                                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">값</th>
                                        <th 
                                            className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors duration-200 select-none ${theme === 'space' ? 'hover:bg-purple-700' : theme === 'dark' ? 'hover:bg-gray-700' : theme === 'ocean' ? 'hover:bg-blue-700' : 'hover:bg-gray-600'}`}
                                            onClick={() => handleSort('category')}
                                        >
                                            <div className="flex items-center justify-center space-x-1">
                                                <span>카테고리</span>
                                                {sortField === 'category' && (
                                                    <span className="text-yellow-300">
                                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${theme === 'space' ? 'divide-purple-600/30 bg-gray-900/95' : theme === 'dark' ? 'divide-gray-600/30 bg-gray-900/95' : theme === 'ocean' ? 'divide-blue-600/30 bg-gray-900/95' : 'divide-gray-200 bg-gradient-to-br from-gray-50 to-gray-100'}`}>
                                    {plcChecklistData.map((item, index) => (
                                        <tr
                                            key={index}
                                            className={`transition-all duration-300 ${theme === 'space' ? `hover:bg-purple-800/50 ${item.status === 'active' ? 'bg-purple-700/50' : ''}` : theme === 'dark' ? `hover:bg-gray-700/50 ${item.status === 'active' ? 'bg-gray-600/50' : ''}` : theme === 'ocean' ? `hover:bg-blue-800/50 ${item.status === 'active' ? 'bg-blue-700/50' : ''}` : `hover:bg-gray-50 ${item.status === 'active' ? 'bg-green-50' : ''}`}`}
                                        >
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`text-sm font-mono font-semibold ${theme === 'space' ? 'text-purple-300' : theme === 'dark' ? 'text-blue-400' : theme === 'ocean' ? 'text-blue-300' : 'text-blue-600'}`}>
                                                    {item.address}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className={`text-sm font-medium ${theme === 'space' ? 'text-purple-100' : theme === 'dark' ? 'text-gray-200' : theme === 'ocean' ? 'text-blue-100' : 'text-gray-900'}`}>{item.name}</div>
                                                <div className={`text-xs ${theme === 'space' ? 'text-purple-300' : theme === 'dark' ? 'text-gray-400' : theme === 'ocean' ? 'text-blue-300' : 'text-gray-500'}`}>{item.description}</div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'active'
                                                        ? theme === 'space' ? 'bg-purple-200 text-purple-800 border border-purple-300' : theme === 'dark' ? 'bg-purple-200 text-purple-800 border border-purple-300' : theme === 'ocean' ? 'bg-purple-200 text-purple-800 border border-purple-300' : 'bg-purple-100 text-purple-800 border border-purple-300'
                                                        : theme === 'space' ? 'bg-purple-800/50 text-purple-300 border border-purple-600/50' : theme === 'dark' ? 'bg-gray-200 text-gray-600 border border-gray-300' : theme === 'ocean' ? 'bg-blue-800/50 text-blue-300 border border-blue-600/50' : 'bg-gray-100 text-gray-600 border border-gray-300'
                                                    }`}>
                                                    {item.displayValue}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-xs font-bold ${item.status === 'active'
                                                        ? theme === 'space' ? 'bg-purple-500 text-white animate-pulse' : theme === 'dark' ? 'bg-purple-500 text-white animate-pulse' : theme === 'ocean' ? 'bg-purple-500 text-white animate-pulse' : 'bg-purple-500 text-white animate-pulse'
                                                        : theme === 'space' ? 'bg-purple-700 text-purple-300' : theme === 'dark' ? 'bg-gray-500 text-gray-300' : theme === 'ocean' ? 'bg-blue-700 text-blue-300' : 'bg-gray-300 text-gray-600'
                                                    }`}>
                                                    {item.rawValue}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r ${getCategoryColor(item.category)} text-white`}>
                                                    {item.category}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>  

                    <div className="mt-4 text-center">
                        <p className={`text-sm ${theme === 'space' ? 'text-purple-300' : theme === 'dark' ? 'text-gray-400' : theme === 'ocean' ? 'text-blue-300' : 'text-gray-600'}`}>
                            총 {plcChecklistData.length}개 센서 |
                            <span className={`font-semibold ${theme === 'space' ? 'text-purple-400' : theme === 'dark' ? 'text-green-400' : theme === 'ocean' ? 'text-blue-400' : 'text-green-600'}`}> {plcChecklistData.filter(item => item.status === 'active').length}개 활성화</span> |
                            <span className={`${theme === 'space' ? 'text-purple-400' : theme === 'dark' ? 'text-gray-500' : theme === 'ocean' ? 'text-blue-400' : 'text-gray-500'}`}> {plcChecklistData.filter(item => item.status === 'inactive').length}개 비활성화</span>
                        </p>
                    </div>
                </div>
            )}

            {/* 데이터 표시 */}
            {!isPLCConnected ? (
                <div className={`text-center py-8 ${theme === 'space' ? 'text-purple-400' : theme === 'dark' ? 'text-gray-400' : theme === 'ocean' ? 'text-blue-400' : 'text-gray-500'}`}>
                    PLC에 연결되지 않았습니다
                </div>
            ) : filteredData.length === 0 ? (
                <div className={`text-center py-8 ${theme === 'space' ? 'text-purple-400' : theme === 'dark' ? 'text-gray-400' : theme === 'ocean' ? 'text-blue-400' : 'text-gray-500'}`}>
                    {searchFilter ? '검색 결과가 없습니다' : '표시할 데이터가 없습니다'}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* 속초 비트 모니터 모드 */}
                    {viewMode === 'bits' ? (
                        <div className={`p-6 rounded-2xl shadow-2xl ${theme === 'space' ? 'bg-gradient-to-br from-purple-900 via-black to-purple-900 border-purple-700' : theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900 border-gray-700' : theme === 'ocean' ? 'bg-gradient-to-br from-blue-900 via-black to-blue-900 border-blue-700' : 'bg-gradient-to-br from-gray-900 via-black to-gray-900 border-gray-700'}`}>
                            <div className="mb-6 flex items-center space-x-3">
                                <div className={`animate-pulse w-4 h-4 rounded-full ${theme === 'space' ? 'bg-purple-500' : theme === 'dark' ? 'bg-green-500' : theme === 'ocean' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                                <div className={`font-mono text-lg font-semibold ${theme === 'space' ? 'text-purple-400' : theme === 'dark' ? 'text-green-400' : theme === 'ocean' ? 'text-blue-400' : 'text-green-400'}`}>
                                    속초 1호기 센서 상태 모니터링 (C060~C072)
                                </div>
                                <div className="flex space-x-1">
                                    <div className={`w-2 h-2 rounded-full animate-ping ${theme === 'space' ? 'bg-purple-400' : theme === 'dark' ? 'bg-cyan-400' : theme === 'ocean' ? 'bg-blue-400' : 'bg-cyan-400'}`}></div>
                                    <div className={`w-2 h-2 rounded-full animate-ping ${theme === 'space' ? 'bg-purple-300' : theme === 'dark' ? 'bg-yellow-400' : theme === 'ocean' ? 'bg-cyan-400' : 'bg-yellow-400'}`} style={{ animationDelay: '200ms' }}></div>
                                </div>
                            </div>

                            {/* 카테고리별 그룹화 */}
                            {Object.entries(
                                filteredData.reduce((groups, item) => {
                                    const category = item.category || '기타';
                                    if (!groups[category]) groups[category] = [];
                                    groups[category].push(item);
                                    return groups;
                                }, {})
                            ).map(([category, items]) => (
                                <div key={category} className="mb-8">
                                    <div className={`mb-4 p-3 rounded-xl bg-gradient-to-r ${getCategoryColor(category)} text-white shadow-lg`}>
                                        <h3 className="text-lg font-bold">{category} ({items.length}개)</h3>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                        {items.map((item, index) => (
                                            <div
                                                key={index}
                                                className={`p-4 rounded-xl border-2 transition-all duration-700 ease-in-out transform hover:scale-110 ${item.status === 'active'
                                                    ? 'bg-gradient-to-br from-purple-500 to-purple-600 border-purple-400 text-white shadow-2xl shadow-purple-500/25 animate-pulse-slow'
                                                    : 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 text-gray-300 hover:border-gray-500 hover:shadow-lg'
                                                    }`}
                                                style={{
                                                    animationDelay: `${index * 30}ms`,
                                                    opacity: 0,
                                                    animation: `slideInScale 0.8s ease-out ${index * 30}ms forwards`
                                                }}
                                            >
                                                <div className="text-center space-y-1">
                                                    <div className="text-xs font-mono font-bold">
                                                        {item.address}
                                                    </div>
                                                    <div className="text-xs font-medium">
                                                        {item.name}
                                                    </div>
                                                    <div className="text-xs opacity-75">
                                                        {item.description}
                                                    </div>
                                                    <div className={`text-xs px-2 py-1 rounded-full ${item.status === 'active'
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-gray-600 text-gray-300'
                                                        }`}>
                                                        {item.displayValue}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="text-center mt-6">
                                <p className={`text-sm ${theme === 'space' ? 'text-purple-300' : theme === 'dark' ? 'text-gray-400' : theme === 'ocean' ? 'text-blue-300' : 'text-gray-400'}`}>
                                    총 {filteredData.length}개 센서 표시 중 | 속초 1호기 전용 센서 매핑
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* 기존 그리드 표시 - 애니메이션 카드 */
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
                            {filteredData.slice(0, 50).map((item, index) => (
                                <div
                                    key={index}
                                    className={`rounded-xl p-3 md:p-4 transition-all duration-500 ease-in-out transform hover:scale-105 hover:shadow-xl hover:-translate-y-1 group ${theme === 'space' ? 'bg-purple-100/80 border-purple-300/50 hover:border-purple-400' : theme === 'dark' ? 'bg-gray-800/80 border-gray-600/50 hover:border-gray-500' : theme === 'ocean' ? 'bg-blue-100/80 border-blue-300/50 hover:border-blue-400' : 'bg-white border-gray-200 hover:border-blue-300'}`}
                                    style={{
                                        animationDelay: `${index * 50}ms`,
                                        opacity: 0,
                                        animation: `fadeInUp 0.6s ease-out ${index * 50}ms forwards`
                                    }}
                                >
                                    <div className="flex flex-col space-y-2">
                                        <span className={`text-xs md:text-sm font-semibold transition-colors duration-300 ${theme === 'space' ? 'text-purple-700 group-hover:text-purple-600' : theme === 'dark' ? 'text-blue-400 group-hover:text-blue-300' : theme === 'ocean' ? 'text-blue-600 group-hover:text-blue-500' : 'text-blue-600 group-hover:text-purple-600'}`}>
                                            {item.address}
                                        </span>
                                        <span className={`text-base md:text-xl font-mono break-words rounded-lg px-2 py-1 transition-colors duration-300 ${theme === 'space' ? 'text-purple-900 bg-purple-50 group-hover:bg-purple-100' : theme === 'dark' ? 'text-gray-200 bg-gray-700/50 group-hover:bg-gray-600/50' : theme === 'ocean' ? 'text-blue-900 bg-blue-50 group-hover:bg-blue-100' : 'text-gray-900 bg-gray-50 group-hover:bg-purple-50'}`}>
                                            {item.displayValue}
                                        </span>
                                    </div>

                                    {/* 비트 분석 (원시 데이터일 때만) */}
                                    {(viewMode === 'raw' || viewMode === 'hex') && item.value > 0 && (
                                        <div className="mt-2">
                                            <div className={`text-xs mb-1 ${theme === 'space' ? 'text-purple-600' : theme === 'dark' ? 'text-gray-400' : theme === 'ocean' ? 'text-blue-600' : 'text-gray-500'}`}>비트 분석:</div>
                                            <div className="grid grid-cols-16 gap-px">
                                                {getBitAnalysis(item.value).map((bit, bitIndex) => (
                                                    <div
                                                        key={bitIndex}
                                                        className={`w-4 h-4 text-xs flex items-center justify-center rounded ${bit ? (theme === 'space' ? 'bg-purple-500 text-white' : theme === 'dark' ? 'bg-green-400 text-white' : theme === 'ocean' ? 'bg-blue-500 text-white' : 'bg-green-400 text-white') : (theme === 'space' ? 'bg-purple-200 text-purple-700' : theme === 'dark' ? 'bg-gray-600 text-gray-300' : theme === 'ocean' ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-600')
                                                            }`}
                                                        title={`비트 ${15 - bitIndex}: ${bit}`}
                                                    >
                                                        {bit}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 더 많은 데이터가 있을 때 (비트 모니터 제외) */}
                    {viewMode !== 'bits' && filteredData.length > 50 && (
                        <div className="text-center py-4">
                            <p className={`text-sm ${theme === 'space' ? 'text-purple-400' : theme === 'dark' ? 'text-gray-400' : theme === 'ocean' ? 'text-blue-400' : 'text-gray-500'}`}>
                                {filteredData.length}개 중 50개 표시됨
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SensorMonitor;