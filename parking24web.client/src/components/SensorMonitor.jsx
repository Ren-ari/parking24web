import React, { useState, useMemo, useEffect } from 'react';

const SensorMonitor = ({ sensorData, isPLCConnected }) => {
    const [viewMode, setViewMode] = useState('parsed'); // 'parsed' or 'raw' or 'hex'
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
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">센서 데이터 모니터</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>마지막 업데이트:</span>
                    <span className="font-medium">{formatTimestamp(sensorData.timestamp)}</span>
                </div>
            </div>

            {/* 연결 상태 */}
            <div className="mb-4 p-3 rounded-md bg-gray-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${isPLCConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <span className="text-sm font-medium">
                            {isPLCConnected ? 'PLC 연결됨' : 'PLC 연결 안됨'}
                        </span>
                    </div>
                    <span className="text-sm text-gray-500">
                        총 데이터: {sensorData.rawData?.length || 0}개
                    </span>
                </div>
            </div>

            {/* 컨트롤 패널 */}
            <div className="mb-4 flex flex-wrap gap-4 items-center">
                {/* 표시 모드 선택 */}
                <div className="flex space-x-2">
                    <button
                        onClick={() => setViewMode('parsed')}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${viewMode === 'parsed'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        파싱된 데이터
                    </button>
                    <button
                        onClick={() => setViewMode('raw')}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${viewMode === 'raw'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        원시 데이터
                    </button>
                    <button
                        onClick={() => setViewMode('hex')}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${viewMode === 'hex'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        16진수
                    </button>

                    <button
                        onClick={() => setShowRawStream(!showRawStream)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${showRawStream ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        실시간 스트림
                    </button>

                </div>

                {/* 필터 옵션 */}
                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={showZeroValues}
                        onChange={(e) => setShowZeroValues(e.target.checked)}
                        className="rounded"
                    />
                    <span className="text-sm text-gray-700">0값 표시</span>
                </label>

                {/* 검색 */}
                <input
                    type="text"
                    placeholder="주소 또는 값 검색..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* 실시간 바이트 스트림 */}
            {showRawStream && (
                <div className="mb-4 bg-black text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-xs">
                    <div className="mb-2 text-yellow-400">실시간 PLC 데이터 스트림:</div>
                    {rawLog.map((entry, index) => (
                        <div key={index} className="mb-1">
                            <span className="text-blue-400">[{entry.timestamp}]</span>
                            <span className="ml-2">
                                {entry.data.map(byte => byte.toString(16).padStart(2, '0')).join(' ')}...
                            </span>
                        </div>
                    ))}
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
                    {/* 그리드 표시 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredData.slice(0, 50).map((item, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-3">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-medium text-blue-600">
                                        {item.address}
                                    </span>
                                    <span className="text-lg font-mono text-gray-900">
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

                    {/* 더 많은 데이터가 있을 때 */}
                    {filteredData.length > 50 && (
                        <div className="text-center py-4">
                            <p className="text-sm text-gray-500">
                                {filteredData.length}개 중 50개 표시됨
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* 통계 정보 */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <div className="text-sm text-gray-500">총 센서</div>
                        <div className="text-lg font-semibold">{sensorData.rawData?.length || 0}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">활성 센서</div>
                        <div className="text-lg font-semibold text-green-600">
                            {sensorData.rawData?.filter(val => val > 0).length || 0}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">파싱된 센서</div>
                        <div className="text-lg font-semibold text-blue-600">
                            {Object.keys(sensorData.parsedData || {}).length}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">연결 상태</div>
                        <div className={`text-lg font-semibold ${sensorData.connected ? 'text-green-600' : 'text-red-600'}`}>
                            {sensorData.connected ? '정상' : '끊김'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SensorMonitor;