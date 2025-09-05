import React, { useState, useEffect } from 'react';
import { torosSensorMapping } from '../config/sensorMappings';

const ConfigPanel = ({ isPLCConnected, plcConfig, setPLCConfig, onConfigApply }) => {
    const [activeTab, setActiveTab] = useState('basic');
    const [tempConfig, setTempConfig] = useState({
        // 기본 PLC 설정
        ip: '192.168.1.2',
        port: 2005,
        deviceType: 'C',
        startAddress: 0,

        // 제어 주소 매핑
        controlMapping: {
            liftUp: 7, liftDown: 8, moveLeft: 9, moveRight: 10,
            leftLiftLock: 11, leftLiftUnlock: 12, rightLiftLock: 13, rightLiftUnlock: 14,
            emergency: 99, errorReset: 17, operationMode: 18, recovery: 19,
            turnTableUp: 54, turnTableDown: 55, turnTableLeft: 56, turnTableRight: 57,
            doorOpen: 96, doorClose: 97
        },

        // 센서 매핑
        sensorMapping: torosSensorMapping,

        // 현장 정보
        siteName: '토로스 현장',
        description: '토로스 현장 - 기본 설정'
    });

    const presetList = [
        '사무실 Test',
        '속초 어반스테이 1호기',
        '속초 어반스테이 2,3호기',
        '토로스 현장'
    ];

    // 컴포넌트 마운트 시 현재 설정 로드
    useEffect(() => {
        if (plcConfig) {
            setTempConfig(prev => ({
                ...prev,
                ip: plcConfig.ip,
                port: plcConfig.port
            }));
        }
    }, [plcConfig]);

    // 기본 설정 변경
    const handleBasicConfigChange = (field, value) => {
        setTempConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 제어 주소 변경
    const handleControlMappingChange = (command, address) => {
        setTempConfig(prev => ({
            ...prev,
            controlMapping: {
                ...prev.controlMapping,
                [command]: parseInt(address) || 0
            }
        }));
    };

    // 센서 매핑 추가/수정
    const handleSensorMappingChange = (index, field, value) => {
        setTempConfig(prev => ({
            ...prev,
            sensorMapping: prev.sensorMapping.map((sensor, i) =>
                i === index ? { ...sensor, [field]: value } : sensor
            )
        }));
    };

    // 센서 추가
    const addSensorMapping = () => {
        setTempConfig(prev => ({
            ...prev,
            sensorMapping: [
                ...prev.sensorMapping,
                {
                    index: 0,
                    name: '새센서',
                    bit: 0,
                    description: '설명',
                    category: '기타'
                }
            ]
        }));
    };

    // 센서 삭제
    const removeSensorMapping = (index) => {
        setTempConfig(prev => ({
            ...prev,
            sensorMapping: prev.sensorMapping.filter((_, i) => i !== index)
        }));
    };

    // 실제 PLC 주소 계산
    const getActualAddress = (relativeIndex) => {
        return `${tempConfig.deviceType}${tempConfig.startAddress + relativeIndex}`;
    };

    // 설정 적용
    const applyConfig = () => {
        if (onConfigApply) {
            onConfigApply(tempConfig);
        }

        // PLC 설정 업데이트
        if (setPLCConfig) {
            setPLCConfig({
                ip: tempConfig.ip,
                port: tempConfig.port
            });
        }
    };

    // 프리셋 로드
    const loadPreset = (presetName) => {
        const presets = {
            '사무실 Test': {
                ...tempConfig,
                siteName: '사무실 Test',
                ip: '192.168.1.2',
                port: 2005,
                deviceType: 'C',
                startAddress: 0,
                description: '사무실 개발/테스트용'
            },
            '속초 어반스테이 1호기': {
                ...tempConfig,
                siteName: '속초 어반스테이 1호기',
                ip: '192.168.0.101',
                port: 2005,
                deviceType: 'C',
                startAddress: 0,
                description: '속초 어반스테이 1호기'
            },
            '속초 어반스테이 2,3호기': {
                ...tempConfig,
                siteName: '속초 어반스테이 2,3호기',
                ip: '192.168.0.102',
                port: 2005,
                deviceType: 'C',
                startAddress: 0,
                description: '속초 어반스테이 2,3호기'
            },

            '토로스 현장': {
                ...tempConfig,
                siteName: '토로스 현장',
                ip: '192.168.1.2',
                port: 2005,
                deviceType: 'C',
                startAddress: 0,
                description: '토로스 현장 - PLC 2대 (Lift1, Lift2)',
            }
        };

        if (presets[presetName]) {
            setTempConfig(presets[presetName]);
        }
    };

    // 설정 내보내기 (JSON)
    const exportConfig = () => {
        const configJson = JSON.stringify(tempConfig, null, 2);
        const blob = new Blob([configJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tempConfig.siteName}_config.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // 탭 스타일
    const getTabStyle = (tabName) => {
        const baseStyle = "px-4 py-2 font-medium rounded-t-lg transition-colors";
        if (activeTab === tabName) {
            return `${baseStyle} bg-blue-500 text-white`;
        }
        return `${baseStyle} bg-gray-200 text-gray-700 hover:bg-gray-300`;
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">현장별 설정 관리</h2>

            {/* 탭 네비게이션 */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-2">
                    <button
                        onClick={() => setActiveTab('basic')}
                        className={getTabStyle('basic')}
                    >
                        기본 설정
                    </button>
                    <button
                        onClick={() => setActiveTab('control')}
                        className={getTabStyle('control')}
                    >
                        제어 주소
                    </button>
                    <button
                        onClick={() => setActiveTab('sensors')}
                        className={getTabStyle('sensors')}
                    >
                        센서 매핑
                    </button>
                    <button
                        onClick={() => setActiveTab('preset')}
                        className={getTabStyle('preset')}
                    >
                        프리셋 관리
                    </button>
                </nav>
            </div>

            {/* 기본 설정 탭 */}
            {activeTab === 'basic' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        {/* PLC 연결 설정 */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-700">PLC 연결 설정</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    PLC IP 주소
                                </label>
                                <input
                                    type="text"
                                    value={tempConfig.ip}
                                    onChange={(e) => handleBasicConfigChange('ip', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="192.168.1.2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    포트 번호
                                </label>
                                <input
                                    type="number"
                                    value={tempConfig.port}
                                    onChange={(e) => handleBasicConfigChange('port', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="2005"
                                />
                            </div>
                        </div>

                        {/* 주소 체계 설정 */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-700">주소 체계 설정</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    디바이스 타입
                                </label>
                                <select
                                    value={tempConfig.deviceType}
                                    onChange={(e) => handleBasicConfigChange('deviceType', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="C">C (보조릴레이)</option>
                                    <option value="P">P (입출력)</option>
                                    <option value="D">D (데이터)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    시작 주소 (첫째항 a)
                                </label>
                                <input
                                    type="number"
                                    value={tempConfig.startAddress}
                                    onChange={(e) => handleBasicConfigChange('startAddress', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 현장 정보 */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-700">현장 정보</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    현장명
                                </label>
                                <input
                                    type="text"
                                    value={tempConfig.siteName}
                                    onChange={(e) => handleBasicConfigChange('siteName', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="현장명 입력"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    설명
                                </label>
                                <input
                                    type="text"
                                    value={tempConfig.description}
                                    onChange={(e) => handleBasicConfigChange('description', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="현장 설명"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 주소 미리보기 */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-2">주소 미리보기</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                            <div>하트비트: {getActualAddress(0)}.0</div>
                            <div>홈위치: {getActualAddress(63)}.3</div>
                            <div>레벨상: {getActualAddress(64)}.8</div>
                            <div>차량번호: {getActualAddress(74)} (워드값)</div>
                        </div>
                    </div>
                </div>
            )}

            {/* 제어 주소 탭 */}
            {activeTab === 'control' && (
                <div className="space-y-6">
                    <h3 className="font-semibold text-gray-700">제어 명령 주소 매핑</h3>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            {Object.entries(tempConfig.controlMapping).map(([command, address]) => (
                                <div key={command} className="flex items-center space-x-4">
                                    <label className="w-20 text-sm font-medium text-gray-700 capitalize">
                                        {command}:
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-500">{tempConfig.deviceType}</span>
                                        <input
                                            type="number"
                                            value={address}
                                            onChange={(e) => handleControlMappingChange(command, e.target.value)}
                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-500">
                                            ({getActualAddress(address - tempConfig.startAddress)})
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-yellow-50 rounded-lg">
                            <h4 className="font-medium text-yellow-800 mb-2">주의사항</h4>
                            <ul className="text-sm text-yellow-700 space-y-1">
                                <li>• 제어 주소는 절대 주소로 입력하세요</li>
                                <li>• 시작 주소와 별개로 관리됩니다</li>
                                <li>• PLC 프로그램과 일치해야 합니다</li>
                                <li>• 변경 후 반드시 테스트하세요</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* 센서 매핑 탭 */}
            {activeTab === 'sensors' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">센서 매핑 테이블</h3>
                        <button
                            onClick={addSensorMapping}
                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                        >
                            센서 추가
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">상대주소</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">실제주소</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">센서명</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">비트</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">분류</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">설명</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">삭제</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tempConfig.sensorMapping.map((sensor, index) => (
                                    <tr key={index} className="border-t">
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                value={sensor.index}
                                                onChange={(e) => handleSensorMappingChange(index, 'index', parseInt(e.target.value) || 0)}
                                                className="w-16 px-2 py-1 border rounded text-center text-sm"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-sm font-mono">
                                            {getActualAddress(sensor.index)}{sensor.bit !== null ? `.${sensor.bit}` : ''}
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                value={sensor.name}
                                                onChange={(e) => handleSensorMappingChange(index, 'name', e.target.value)}
                                                className="w-24 px-2 py-1 border rounded text-sm"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                value={sensor.bit || ''}
                                                onChange={(e) => handleSensorMappingChange(index, 'bit', e.target.value ? parseInt(e.target.value) : null)}
                                                className="w-12 px-2 py-1 border rounded text-center text-sm"
                                                min="0"
                                                max="15"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <select
                                                value={sensor.category}
                                                onChange={(e) => handleSensorMappingChange(index, 'category', e.target.value)}
                                                className="px-2 py-1 border rounded text-sm"
                                            >
                                                <option value="시스템">시스템</option>
                                                <option value="PC명령">PC명령</option>
                                                <option value="안전센서">안전센서</option>
                                                <option value="위치센서">위치센서</option>
                                                <option value="상태센서">상태센서</option>
                                                <option value="데이터">데이터</option>
                                                <option value="통계">통계</option>
                                                <option value="기타">기타</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                value={sensor.description}
                                                onChange={(e) => handleSensorMappingChange(index, 'description', e.target.value)}
                                                className="w-32 px-2 py-1 border rounded text-sm"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <button
                                                onClick={() => removeSensorMapping(index)}
                                                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                                            >
                                                삭제
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 프리셋 관리 탭 */}
            {activeTab === 'preset' && (
                <div className="space-y-6">
                    <h3 className="font-semibold text-gray-700">프리셋 관리</h3>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-gray-700 mb-3">프리셋 로드</h4>
                            <div className="space-y-2">
                                {presetList.map(preset => (
                                    <button
                                        key={preset}
                                        onClick={() => loadPreset(preset)}
                                        className="w-full px-4 py-2 text-left bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium text-gray-700 mb-3">설정 내보내기</h4>
                            <button
                                onClick={exportConfig}
                                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                            >
                                JSON 파일로 내보내기
                            </button>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-2">현재 설정 요약</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                            <div>현장명: {tempConfig.siteName}</div>
                            <div>PLC IP: {tempConfig.ip}:{tempConfig.port}</div>
                            <div>주소 체계: {tempConfig.deviceType}{tempConfig.startAddress}~</div>
                            <div>센서 개수: {tempConfig.sensorMapping.length}개</div>
                        </div>
                    </div>
                </div>
            )}

            {/* 하단 버튼 */}
            <div className="flex justify-between items-center pt-6 border-t">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className={`w-3 h-3 rounded-full ${isPLCConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span>PLC {isPLCConnected ? '연결됨' : '연결 안됨'}</span>
                </div>

                <div className="space-x-4">
                    <button
                        onClick={() => setTempConfig(prev => ({ ...prev, ...plcConfig }))}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        초기화
                    </button>
                    <button
                        onClick={applyConfig}
                        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                        설정 적용
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfigPanel;