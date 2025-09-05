import React, { useState, useMemo, useEffect } from 'react';

const SensorMonitor = ({ sensorData, isPLCConnected }) => {
    const [viewMode, setViewMode] = useState('parsed'); // 'parsed' or 'raw' or 'hex' or 'bits'
    const [showZeroValues, setShowZeroValues] = useState(false);
    const [searchFilter, setSearchFilter] = useState('');
    const [rawLog, setRawLog] = useState([]);
    const [showRawStream, setShowRawStream] = useState(false);

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
            // 비트 모니터 모드 - 실제 PLC 비트 주소별 ON/OFF 상태
            data = [];
            
                        // 실제 PLC 주소의 비트들을 개별적으로 표시
            const bitMappings = [
                // C23 - PC 명령
                { wordIndex: 23, bitIndex: 0, address: 'm340', name: 'PC_상승', category: 'PC명령' },
                { wordIndex: 23, bitIndex: 1, address: 'm341', name: 'PC_하강', category: 'PC명령' },
                { wordIndex: 23, bitIndex: 2, address: 'm342', name: 'PC_좌행', category: 'PC명령' },
                { wordIndex: 23, bitIndex: 3, address: 'm343', name: 'PC_우행', category: 'PC명령' },
                { wordIndex: 23, bitIndex: 5, address: 'm345', name: 'PC_에러해제', category: 'PC명령' },
                { wordIndex: 23, bitIndex: 7, address: 'm347', name: 'PC_턴좌회전', category: 'PC명령' },
                { wordIndex: 23, bitIndex: 8, address: 'm348', name: 'PC_턴우회전', category: 'PC명령' },
                { wordIndex: 23, bitIndex: 9, address: 'm349', name: 'PC_턴잠김', category: 'PC명령' },
                { wordIndex: 23, bitIndex: 10, address: 'm34a', name: 'PC_턴해제', category: 'PC명령' },
                { wordIndex: 23, bitIndex: 11, address: 'm34b', name: 'PC_도어열림', category: 'PC명령' },
                { wordIndex: 23, bitIndex: 12, address: 'm34c', name: 'PC_도어닫힘', category: 'PC명령' },
                { wordIndex: 23, bitIndex: 13, address: 'm34d', name: 'PC_비상스위치', category: 'PC명령' },
                
                // C60 - 센서/스위치
                { wordIndex: 60, bitIndex: 0, address: 'P100', name: 'OP 수동', category: '조작' },
                { wordIndex: 60, bitIndex: 1, address: 'P101', name: 'OP 자동', category: '조작' },
                { wordIndex: 60, bitIndex: 2, address: 'P102', name: 'OP 도어열림SW', category: '조작' },
                { wordIndex: 60, bitIndex: 3, address: 'P103', name: 'OP 도어닫힘SW', category: '조작' },
                { wordIndex: 60, bitIndex: 4, address: 'P104', name: '앞범퍼센서', category: '안전센서' },
                { wordIndex: 60, bitIndex: 5, address: 'P105', name: '뒷범퍼센서', category: '안전센서' },
                { wordIndex: 60, bitIndex: 6, address: 'P106', name: '차량정위치', category: '위치센서' },
                { wordIndex: 60, bitIndex: 7, address: 'P107', name: '일반높이', category: '위치센서' },
                { wordIndex: 60, bitIndex: 9, address: 'P109', name: '도어내센서', category: '안전센서' },
                { wordIndex: 60, bitIndex: 10, address: 'P10A', name: '도어열림확인', category: '상태센서' },
                { wordIndex: 60, bitIndex: 11, address: 'P10B', name: '도어닫힘확인', category: '상태센서' },
                { wordIndex: 60, bitIndex: 13, address: 'P10D', name: '보행자문열림', category: '안전센서' },
                { wordIndex: 60, bitIndex: 14, address: 'P10E', name: '동작감지', category: '안전센서' },
                { wordIndex: 60, bitIndex: 15, address: 'P10F', name: '일반후미', category: '위치센서' },
                
                // C61 - 리프트 관련
                { wordIndex: 61, bitIndex: 0, address: 'P110', name: '비상정지', category: '안전센서' },
                { wordIndex: 61, bitIndex: 2, address: 'P112', name: 'L_INV RUN', category: '시스템' },
                { wordIndex: 61, bitIndex: 3, address: 'P113', name: 'L_INV FLT', category: '시스템' },
                { wordIndex: 61, bitIndex: 4, address: 'P114', name: 'L_EOCR', category: '시스템' },
                { wordIndex: 61, bitIndex: 5, address: 'P115', name: '와이어절단', category: '안전센서' },
                { wordIndex: 61, bitIndex: 6, address: 'P116', name: '피트센서(홀)', category: '위치센서' },
                { wordIndex: 61, bitIndex: 7, address: 'P117', name: '피트센서(짝)', category: '위치센서' },
                { wordIndex: 61, bitIndex: 8, address: 'P118', name: '상승비상', category: '안전센서' },
                { wordIndex: 61, bitIndex: 9, address: 'P119', name: '상승감속2', category: '위치센서' },
                { wordIndex: 61, bitIndex: 10, address: 'P11A', name: '상승감속', category: '위치센서' },
                { wordIndex: 61, bitIndex: 11, address: 'P11B', name: '하강감속', category: '위치센서' },
                { wordIndex: 61, bitIndex: 12, address: 'P11C', name: '하강감속2', category: '위치센서' },
                { wordIndex: 61, bitIndex: 13, address: 'P11D', name: '하강비상', category: '안전센서' },
                { wordIndex: 61, bitIndex: 14, address: 'P11E', name: '좌,우미러', category: '위치센서' },
                
                // C62 - 턴테이블 관련
                { wordIndex: 62, bitIndex: 0, address: 'P120', name: '턴0도확인', category: '위치센서' },
                { wordIndex: 62, bitIndex: 1, address: 'P121', name: '턴180확인', category: '위치센서' },
                { wordIndex: 62, bitIndex: 3, address: 'P123', name: '턴좌정지', category: '위치센서' },
                { wordIndex: 62, bitIndex: 4, address: 'P124', name: '턴우정지', category: '위치센서' },
                { wordIndex: 62, bitIndex: 5, address: 'P125', name: '보행자문열림2', category: '안전센서' },
                { wordIndex: 62, bitIndex: 13, address: 'P12D', name: '외장턴정SW', category: '조작' },
                { wordIndex: 62, bitIndex: 14, address: 'P12E', name: '외장턴역SW', category: '조작' },
                
                // C63 - 시스템 상태
                { wordIndex: 63, bitIndex: 0, address: 'P130', name: 'P_INV RUN', category: '시스템' },
                { wordIndex: 63, bitIndex: 1, address: 'P131', name: 'P_INV FLT', category: '시스템' },
                { wordIndex: 63, bitIndex: 2, address: 'P132', name: 'P_EOCR', category: '시스템' },
                { wordIndex: 63, bitIndex: 3, address: 'P133', name: '홈위치', category: '위치센서' },
                { wordIndex: 63, bitIndex: 9, address: 'P139', name: '상승SW', category: '조작' },
                { wordIndex: 63, bitIndex: 10, address: 'P13A', name: '고속SW', category: '조작' },
                { wordIndex: 63, bitIndex: 11, address: 'P13B', name: '하강SW', category: '조작' },
                { wordIndex: 63, bitIndex: 12, address: 'P13C', name: '비상SW', category: '조작' },
                { wordIndex: 63, bitIndex: 15, address: 'P13F', name: '턴회전위치', category: '위치센서' },
                
                // C64 - 파렛/미러 센서
                { wordIndex: 64, bitIndex: 0, address: 'P140', name: '후크중앙(전)', category: '위치센서' },
                { wordIndex: 64, bitIndex: 1, address: 'P141', name: '후크중앙(후)', category: '위치센서' },
                { wordIndex: 64, bitIndex: 2, address: 'P142', name: '홀수파렛정지', category: '위치센서' },
                { wordIndex: 64, bitIndex: 3, address: 'P143', name: '짝수파렛정지', category: '위치센서' },
                { wordIndex: 64, bitIndex: 4, address: 'P144', name: '파렛감지(홀)', category: '위치센서' },
                { wordIndex: 64, bitIndex: 5, address: 'P145', name: '파렛감지(짝)', category: '위치센서' },
                { wordIndex: 64, bitIndex: 8, address: 'P148', name: '레벨 상', category: '위치센서' },
                { wordIndex: 64, bitIndex: 9, address: 'P149', name: '레벨 하', category: '위치센서' },
                { wordIndex: 64, bitIndex: 10, address: 'P14A', name: '리프트내RV감지', category: '안전센서' },
                { wordIndex: 64, bitIndex: 11, address: 'P14B', name: '좌미러센서', category: '위치센서' },
                { wordIndex: 64, bitIndex: 12, address: 'P14C', name: '우미러센서', category: '위치센서' },
                
                // C70 - 출력/표시등
                { wordIndex: 70, bitIndex: 0, address: 'P200', name: 'L_INV 정', category: '출력' },
                { wordIndex: 70, bitIndex: 1, address: 'P201', name: 'L_INV 역', category: '출력' },
                { wordIndex: 70, bitIndex: 2, address: 'P202', name: 'L_INV S3', category: '출력' },
                { wordIndex: 70, bitIndex: 3, address: 'P203', name: 'L_INV S4', category: '출력' },
                { wordIndex: 70, bitIndex: 4, address: 'P204', name: 'L_INV S5', category: '출력' },
                { wordIndex: 70, bitIndex: 5, address: 'P205', name: 'L_INV S6', category: '출력' },
                { wordIndex: 70, bitIndex: 6, address: 'P206', name: 'L_INV S7', category: '출력' },
                { wordIndex: 70, bitIndex: 7, address: 'P207', name: 'L_INV S8', category: '출력' },
                { wordIndex: 70, bitIndex: 8, address: 'P208', name: '유도등1', category: '표시등' },
                { wordIndex: 70, bitIndex: 9, address: 'P209', name: '유도등2', category: '표시등' },
                { wordIndex: 70, bitIndex: 10, address: 'P20A', name: '유도등4', category: '표시등' },
                { wordIndex: 70, bitIndex: 11, address: 'P20B', name: '유도등8', category: '표시등' },
                { wordIndex: 70, bitIndex: 12, address: 'P20C', name: '부저', category: '표시등' },
                { wordIndex: 70, bitIndex: 13, address: 'P20D', name: '입고중', category: '표시등' },
                { wordIndex: 70, bitIndex: 14, address: 'P20E', name: '대기중', category: '표시등' },
                { wordIndex: 70, bitIndex: 15, address: 'P20F', name: '출고중', category: '표시등' },
                
                // C71 - 모터제어
                { wordIndex: 71, bitIndex: 0, address: 'P210', name: '리프트MC', category: '출력' },
                { wordIndex: 71, bitIndex: 1, address: 'P211', name: '리프트BK', category: '출력' },
                { wordIndex: 71, bitIndex: 2, address: 'P212', name: '도어열림MC', category: '출력' },
                { wordIndex: 71, bitIndex: 3, address: 'P213', name: '도어닫힘MC', category: '출력' },
                { wordIndex: 71, bitIndex: 4, address: 'P214', name: '턴MC', category: '출력' },
                { wordIndex: 71, bitIndex: 5, address: 'P215', name: '턴BK', category: '출력' },
                { wordIndex: 71, bitIndex: 6, address: 'P216', name: '외장턴 정', category: '출력' },
                { wordIndex: 71, bitIndex: 7, address: 'P217', name: '외장턴 역', category: '출력' },
                { wordIndex: 71, bitIndex: 15, address: 'P21F', name: '저항FAN', category: '출력' },
                
                // C72 - 횡행제어
                { wordIndex: 72, bitIndex: 0, address: 'P220', name: 'P_INV 정', category: '출력' },
                { wordIndex: 72, bitIndex: 1, address: 'P221', name: 'P_INV 역', category: '출력' },
                { wordIndex: 72, bitIndex: 2, address: 'P222', name: 'P_INV S3', category: '출력' },
                { wordIndex: 72, bitIndex: 3, address: 'P223', name: 'P_INV S4', category: '출력' },
                { wordIndex: 72, bitIndex: 4, address: 'P224', name: 'P_INV S5', category: '출력' },
                { wordIndex: 72, bitIndex: 5, address: 'P225', name: 'P_INV S6', category: '출력' },
                { wordIndex: 72, bitIndex: 6, address: 'P226', name: 'P_INV S7', category: '출력' },
                { wordIndex: 72, bitIndex: 8, address: 'P228', name: '횡행MC', category: '출력' },
                { wordIndex: 72, bitIndex: 9, address: 'P229', name: '횡행BK', category: '출력' }
            ];
            
            bitMappings.forEach(mapping => {
                if (mapping.wordIndex < sensorData.rawData.length) {
                    const wordValue = sensorData.rawData[mapping.wordIndex];
                    const bitValue = (wordValue >> mapping.bitIndex) & 1;
                    
                    data.push({
                        address: mapping.address,
                        name: mapping.name,
                        category: mapping.category,
                        value: bitValue,
                        wordValue: wordValue,
                        displayValue: bitValue ? 'ON' : 'OFF',
                        type: 'bits',
                        status: bitValue ? 'active' : 'inactive'
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
                item.displayValue.toLowerCase().includes(searchFilter.toLowerCase())
            );
        }

        return data;
    }, [sensorData, viewMode, showZeroValues, searchFilter]);

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

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleTimeString();
    };

    return (
                 <div className="bg-white rounded-2xl shadow-lg p-3 md:p-4 overflow-hidden border-2 border-gray-300">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-4 space-y-2 md:space-y-0">
                <h2 className="text-base md:text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 md:mb-0">센서 데이터 모니터</h2>
            </div>

            {/* 컨트롤 패널 */}
            <div className="mb-6 space-y-4">
                {/* 표시 모드 선택 - 세련된 탭 스타일 */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-1 rounded-2xl shadow-lg border border-gray-200">
                    <div className="grid grid-cols-4 gap-1">
                        <button
                            onClick={() => setViewMode('parsed')}
                            className={`flex-shrink-0 px-4 md:px-6 py-2 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all duration-500 ease-in-out transform ${viewMode === 'parsed'
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105 shadow-blue-500/25'
                                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:scale-102'
                                }`}
                        >
                            파싱된 데이터
                        </button>
                        <button
                            onClick={() => setViewMode('raw')}
                            className={`flex-shrink-0 px-4 md:px-6 py-2 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all duration-500 ease-in-out transform ${viewMode === 'raw'
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105 shadow-blue-500/25'
                                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:scale-102'
                                }`}
                        >
                            원시 데이터
                        </button>
                        <button
                            onClick={() => setViewMode('hex')}
                            className={`flex-shrink-0 px-4 md:px-6 py-2 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all duration-500 ease-in-out transform ${viewMode === 'hex'
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105 shadow-blue-500/25'
                                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:scale-102'
                                }`}
                        >
                            16진수
                        </button>
                        <button
                            onClick={() => setViewMode('bits')}
                            className={`flex-shrink-0 px-4 md:px-6 py-2 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all duration-500 ease-in-out transform ${viewMode === 'bits'
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105 shadow-blue-500/25'
                                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:scale-102'
                                }`}
                        >
                            비트 모니터
                        </button>
                    </div>
                </div>



                {/* 필터 및 검색 영역 */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-2xl shadow-lg border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* 0값 표시 토글과 실시간 스트림 토글 */}
                        <div className="flex items-center gap-6">
                            <div className="flex items-center space-x-3">
                                <span className="text-sm font-medium text-gray-700">0값 표시</span>
                                <button
                                    onClick={() => setShowZeroValues(!showZeroValues)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                        showZeroValues 
                                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600' 
                                            : 'bg-gray-300'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
                                            showZeroValues ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center space-x-3">
                                <span className="text-sm font-medium text-gray-700">실시간 스트림</span>
                                <button
                                    onClick={() => setShowRawStream(!showRawStream)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                        showRawStream 
                                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600' 
                                            : 'bg-gray-300'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
                                            showRawStream ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* 검색창 - 세련된 디자인 */}
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="주소 또는 값으로 검색..."
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-400 bg-gray-50 focus:bg-white"
                            />
                            {searchFilter && (
                                <button
                                    onClick={() => setSearchFilter('')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
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
                        <div className="text-yellow-400 font-semibold">실시간 PLC 데이터 스트림</div>
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                    </div>
                    <div className="h-64 overflow-y-auto font-mono text-xs space-y-1 custom-scrollbar">
                        {rawLog.map((entry, index) => (
                            <div 
                                key={index} 
                                className={`transition-all duration-500 ease-in-out transform ${
                                    index === 0 ? 'scale-105 bg-green-900/30 rounded px-2 py-1' : ''
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

            {/* 데이터 표시 */}
            {!isPLCConnected ? (
                <div className="text-center py-8 text-gray-500">
                    PLC에 연결되지 않았습니다
                </div>
            ) : filteredData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    {searchFilter ? '검색 결과가 없습니다' : '표시할 데이터가 없습니다'}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* 비트 모니터 모드 */}
                    {viewMode === 'bits' ? (
                        <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-700">
                            <div className="mb-6 flex items-center space-x-3">
                                <div className="animate-pulse w-4 h-4 bg-green-500 rounded-full"></div>
                                <div className="text-green-400 font-mono text-lg font-semibold">
                                    PLC 비트 상태 모니터링
                                </div>
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{animationDelay: '200ms'}}></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                {filteredData.map((item, index) => (
                                    <div 
                                        key={index} 
                                        className={`p-4 rounded-xl border-2 transition-all duration-700 ease-in-out transform hover:scale-110 ${
                                            item.status === 'active' 
                                                ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-400 text-white shadow-2xl shadow-green-500/25 animate-pulse-slow' 
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
                                            {item.category && (
                                                <div className={`text-xs px-2 py-1 rounded-full ${
                                                    item.status === 'active'
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-gray-600 text-gray-300'
                                                }`}>
                                                    {item.category}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="text-center mt-4">
                                <p className="text-sm text-gray-400">
                                    총 {filteredData.length}개 비트 표시 중
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* 기존 그리드 표시 - 애니메이션 카드 */
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
                            {filteredData.slice(0, 50).map((item, index) => (
                                <div 
                                    key={index} 
                                    className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 transition-all duration-500 ease-in-out transform hover:scale-105 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 group"
                                    style={{
                                        animationDelay: `${index * 50}ms`,
                                        opacity: 0,
                                        animation: `fadeInUp 0.6s ease-out ${index * 50}ms forwards`
                                    }}
                                >
                                    <div className="flex flex-col space-y-2">
                                        <span className="text-xs md:text-sm font-semibold text-blue-600 group-hover:text-purple-600 transition-colors duration-300">
                                            {item.address}
                                        </span>
                                        <span className="text-sm md:text-lg font-mono text-gray-900 break-words bg-gray-50 rounded-lg px-2 py-1 group-hover:bg-blue-50 transition-colors duration-300">
                                            {item.displayValue}
                                        </span>
                                    </div>

                                    {/* 비트 분석 (원시 데이터일 때만) */}
                                    {(viewMode === 'raw' || viewMode === 'hex') && item.value > 0 && (
                                        <div className="mt-2">
                                            <div className="text-xs text-gray-500 mb-1">비트 분석:</div>
                                            <div className="grid grid-cols-16 gap-px">
                                                {getBitAnalysis(item.value).map((bit, bitIndex) => (
                                                    <div
                                                        key={bitIndex}
                                                        className={`w-4 h-4 text-xs flex items-center justify-center rounded ${bit ? 'bg-green-400 text-white' : 'bg-gray-200 text-gray-600'
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
                            <p className="text-sm text-gray-500">
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