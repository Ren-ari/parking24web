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
                // 도어/턴테이블 탭 - 인풋 센서들
                { wordIndex: 28, bitIndex: 0, address: 'C28', name: '턴 0도 확인정지', category: '턴테이블' },
                { wordIndex: 29, bitIndex: 0, address: 'C29', name: '턴 180도 확인정지', category: '턴테이블' },
                { wordIndex: 31, bitIndex: 0, address: 'C31', name: '턴 상승확인', category: '턴테이블' },
                { wordIndex: 32, bitIndex: 0, address: 'C32', name: '턴 하강확인', category: '턴테이블' },
                { wordIndex: 39, bitIndex: 0, address: 'C39', name: '도어열림확인', category: '도어' },
                { wordIndex: 40, bitIndex: 0, address: 'C40', name: '도어닫힘확인', category: '도어' },
                { wordIndex: 41, bitIndex: 0, address: 'C41', name: '도어잠김확인', category: '도어' },
                { wordIndex: 44, bitIndex: 0, address: 'C44', name: '좌도어확인', category: '도어' },
                { wordIndex: 45, bitIndex: 0, address: 'C45', name: '우도어확인', category: '도어' },
                { wordIndex: 53, bitIndex: 0, address: 'C53', name: '도어내확인', category: '도어' },
                { wordIndex: 42, bitIndex: 0, address: 'C42', name: '좌측동작감지확인1', category: '안전센서' },
                { wordIndex: 43, bitIndex: 0, address: 'C43', name: '우측동작감지확인1', category: '안전센서' },
                { wordIndex: 47, bitIndex: 0, address: 'C47', name: '차량정위치', category: '위치센서' },
                { wordIndex: 46, bitIndex: 0, address: 'C46', name: '앞범퍼확인', category: '안전센서' },
                { wordIndex: 50, bitIndex: 0, address: 'C50', name: '뒷범퍼확인', category: '안전센서' },
                { wordIndex: 48, bitIndex: 0, address: 'C48', name: 'RV높이확인', category: '위치센서' },
                { wordIndex: 49, bitIndex: 0, address: 'C49', name: '승용높이확인', category: '위치센서' },
                
                // 승강 제어 탭 - 인풋 센서들
                { wordIndex: 20, bitIndex: 0, address: 'C20', name: '리프트 레벨1', category: '리프트' },
                { wordIndex: 21, bitIndex: 0, address: 'C21', name: '리프트 레벨2', category: '리프트' },
                { wordIndex: 30, bitIndex: 0, address: 'C30', name: '리프트 홈 확인', category: '리프트' },
                { wordIndex: 37, bitIndex: 0, address: 'C37', name: '리프트 하강감속확인', category: '리프트' },
                { wordIndex: 38, bitIndex: 0, address: 'C38', name: '리프트 하강비상확인', category: '리프트' },
                { wordIndex: 51, bitIndex: 0, address: 'C51', name: '리프트 상승비상확인', category: '리프트' },
                { wordIndex: 52, bitIndex: 0, address: 'C52', name: '리프트 상승감속확인', category: '리프트' },
                { wordIndex: 65, bitIndex: 13, address: 'C65', name: '레벨상', category: '위치센서' },
                { wordIndex: 60, bitIndex: 12, address: 'C60', name: '레벨하', category: '위치센서' },
                { wordIndex: 61, bitIndex: 11, address: 'C61', name: '와이어 절단', category: '안전센서' },
                { wordIndex: 23, bitIndex: 0, address: 'C23', name: '와이어 절단확인', category: '안전센서' },
                { wordIndex: 67, bitIndex: 4, address: 'C67', name: '상승비상', category: '안전센서' },
                { wordIndex: 67, bitIndex: 2, address: 'C67', name: '하강비상', category: '안전센서' },
                { wordIndex: 67, bitIndex: 3, address: 'C67', name: '상승감속', category: '리프트' },
                { wordIndex: 67, bitIndex: 1, address: 'C67', name: '하강감속', category: '리프트' },
                
                // 횡행/락킹 탭 - 인풋 센서들
                { wordIndex: 22, bitIndex: 0, address: 'C22', name: '후크중앙확인', category: '횡행' },
                { wordIndex: 24, bitIndex: 0, address: 'C24', name: '홀수 후크 감지', category: '횡행' },
                { wordIndex: 25, bitIndex: 0, address: 'C25', name: '짝수 후크 감지', category: '횡행' },
                { wordIndex: 62, bitIndex: 12, address: 'C62', name: '짝수후크확인', category: '횡행' },
                { wordIndex: 62, bitIndex: 10, address: 'C62', name: '홀수후크확인', category: '횡행' },
                { wordIndex: 62, bitIndex: 11, address: 'C62', name: '중앙후크확인', category: '횡행' },
                { wordIndex: 33, bitIndex: 0, address: 'C33', name: '홀수측 록킹잠김확인', category: '락킹' },
                { wordIndex: 34, bitIndex: 0, address: 'C34', name: '홀수측 록킹풀림확인', category: '락킹' },
                { wordIndex: 35, bitIndex: 0, address: 'C35', name: '짝수측 록킹잠김확인', category: '락킹' },
                { wordIndex: 36, bitIndex: 0, address: 'C36', name: '짝수측 록킹풀림확인', category: '락킹' },
                { wordIndex: 67, bitIndex: 9, address: 'C67', name: '좌측락킹 열림확인', category: '락킹' },
                { wordIndex: 67, bitIndex: 12, address: 'C67', name: '우측락킹 열림확인', category: '락킹' },
                { wordIndex: 26, bitIndex: 0, address: 'C26', name: '좌측 피트확인', category: '위치센서' },
                { wordIndex: 27, bitIndex: 3, address: 'C27', name: '우측 피트확인', category: '위치센서' },
                { wordIndex: 62, bitIndex: 13, address: 'C62', name: '좌측피트', category: '위치센서' },
                { wordIndex: 62, bitIndex: 14, address: 'C62', name: '우측피트', category: '위치센서' },
                { wordIndex: 63, bitIndex: 14, address: 'C63', name: '좌측차판확인', category: '위치센서' },
                { wordIndex: 63, bitIndex: 13, address: 'C63', name: '우측차판확인', category: '위치센서' },
                
                // 아웃풋 센서들 (출력 상태)
                // 도어/턴테이블 탭 아웃풋
                { wordIndex: 69, bitIndex: 2, address: 'C69', name: '적색신호등', category: '출력' },
                { wordIndex: 69, bitIndex: 3, address: 'C69', name: '녹색신호등', category: '출력' },
                { wordIndex: 69, bitIndex: 4, address: 'C69', name: '유도등 전진', category: '출력' },
                { wordIndex: 69, bitIndex: 5, address: 'C69', name: '유도등 정지', category: '출력' },
                { wordIndex: 69, bitIndex: 6, address: 'C69', name: '유도등 후진', category: '출력' },
                { wordIndex: 69, bitIndex: 8, address: 'C69', name: '도어모터 정회전 MC', category: '출력' },
                { wordIndex: 69, bitIndex: 9, address: 'C69', name: '도어모터 우회전 MC', category: '출력' },
                { wordIndex: 68, bitIndex: 6, address: 'C68', name: '턴리프팅 상승', category: '출력' },
                { wordIndex: 68, bitIndex: 7, address: 'C68', name: '턴리프팅 하강', category: '출력' },
                { wordIndex: 68, bitIndex: 11, address: 'C68', name: '턴 모터', category: '출력' },
                { wordIndex: 68, bitIndex: 12, address: 'C68', name: '턴 모터 BK', category: '출력' },
                { wordIndex: 71, bitIndex: 0, address: 'C71', name: '턴테이블 인버터 정회전', category: '출력' },
                { wordIndex: 71, bitIndex: 1, address: 'C71', name: '턴테이블 인버터 역회전', category: '출력' },
                { wordIndex: 71, bitIndex: 7, address: 'C71', name: '턴테이블 인버터 리셋', category: '출력' },
                { wordIndex: 71, bitIndex: 2, address: 'C71', name: '턴테이블 인버터 SP1', category: '출력' },
                { wordIndex: 71, bitIndex: 3, address: 'C71', name: '턴테이블 인버터 SP2', category: '출력' },
                { wordIndex: 71, bitIndex: 4, address: 'C71', name: '턴테이블 인버터 SP3', category: '출력' },
                { wordIndex: 64, bitIndex: 3, address: 'C64', name: '턴 좌회전정지', category: '출력' },
                { wordIndex: 64, bitIndex: 1, address: 'C64', name: '턴 우회전정지', category: '출력' },
                { wordIndex: 66, bitIndex: 14, address: 'C66', name: '턴테이블 상승정지', category: '출력' },
                { wordIndex: 66, bitIndex: 15, address: 'C66', name: '턴테이블 하강정지', category: '출력' },
                
                // 승강 제어 탭 아웃풋
                { wordIndex: 70, bitIndex: 0, address: 'C70', name: '리프트 인버터 정회전', category: '출력' },
                { wordIndex: 70, bitIndex: 1, address: 'C70', name: '리프트 인버터 역회전', category: '출력' },
                { wordIndex: 70, bitIndex: 7, address: 'C70', name: '리프트 인버터 리셋', category: '출력' },
                { wordIndex: 70, bitIndex: 2, address: 'C70', name: '리프트 인버터 SP1', category: '출력' },
                { wordIndex: 70, bitIndex: 3, address: 'C70', name: '리프트 인버터 SP2', category: '출력' },
                { wordIndex: 70, bitIndex: 4, address: 'C70', name: '리프트 인버터 SP3', category: '출력' },
                { wordIndex: 70, bitIndex: 6, address: 'C70', name: '리프트 인버터 비상라인', category: '출력' },
                { wordIndex: 69, bitIndex: 10, address: 'C69', name: '리프트 인버터 리프트BK', category: '출력' },
                
                // 횡행/락킹 탭 아웃풋
                { wordIndex: 71, bitIndex: 0, address: 'C71', name: '횡행 인버터 정회전', category: '출력' },
                { wordIndex: 71, bitIndex: 1, address: 'C71', name: '횡행 인버터 역회전', category: '출력' },
                { wordIndex: 71, bitIndex: 7, address: 'C71', name: '횡행 인버터 리셋', category: '출력' },
                { wordIndex: 71, bitIndex: 2, address: 'C71', name: '횡행 인버터 SP1', category: '출력' },
                { wordIndex: 71, bitIndex: 3, address: 'C71', name: '횡행 인버터 SP2', category: '출력' },
                { wordIndex: 71, bitIndex: 4, address: 'C71', name: '횡행 인버터 SP3', category: '출력' },
                { wordIndex: 68, bitIndex: 5, address: 'C68', name: '횡행 모터BK', category: '출력' },
                { wordIndex: 69, bitIndex: 13, address: 'C69', name: '정회전 MC', category: '출력' },
                { wordIndex: 71, bitIndex: 1, address: 'C71', name: '우회전 MC', category: '출력' }
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