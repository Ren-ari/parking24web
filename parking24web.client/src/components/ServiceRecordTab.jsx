import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import siteConfig from '../../config/gapEulMyeongGaConfig.js';

const ServiceRecordTab = () => {
    const { theme } = useTheme();
    const { isClient } = useAuth();
    const [records, setRecords] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    
    // 오늘 날짜를 YYYY-MM-DD 형식으로 반환
    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const [formData, setFormData] = useState({
        visitDate: getTodayDate(),
        technicianName: '',
        workDescription: '',
        status: '완료',
        notes: '',
        createdBy: ''
    });
    const [toastMessage, setToastMessage] = useState('');
    const [sortField, setSortField] = useState('visitDate');
    const [sortOrder, setSortOrder] = useState('desc');

    // API 베이스 URL
    const getApiBaseUrl = () => {
        return window.location.host.includes(':5173')
            ? `http://localhost:${siteConfig.api.devPort}`
            : siteConfig.api.baseUrl;
    };

    // 토스트 메시지
    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 3000);
    };

    // A/S 기록 불러오기
    const fetchRecords = async () => {
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/servicerecords`);
            const data = await response.json();
            setRecords(data);
        } catch (error) {
            console.error('A/S 기록 로드 실패:', error);
            showToast('❌ 데이터 로드 실패');
        }
    };

    useEffect(() => {
        fetchRecords();
        const interval = setInterval(fetchRecords, 60000); // 1분마다 갱신
        return () => clearInterval(interval);
    }, []);

    // 정렬 함수
    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    // 정렬된 records
    const sortedRecords = useMemo(() => {
        const sorted = [...records].sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];

            // 날짜 처리
            if (sortField === 'visitDate') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }

            // 문자열 처리
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [records, sortField, sortOrder]);

    // 폼 초기화
    const resetForm = () => {
        setFormData({
            visitDate: getTodayDate(),
            technicianName: '',
            workDescription: '',
            status: '완료',
            notes: '',
            createdBy: ''
        });
        setEditingRecord(null);
        setShowAddForm(false);
    };

    // 추가/수정
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.visitDate || !formData.technicianName || !formData.workDescription) {
            showToast('⚠️ 필수 항목을 입력하세요');
            return;
        }

        try {
            const url = editingRecord
                ? `${getApiBaseUrl()}/api/servicerecords/${editingRecord.id}`
                : `${getApiBaseUrl()}/api/servicerecords`;

            const method = editingRecord ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                showToast(editingRecord ? '✅ 수정 완료' : '✅ 등록 완료');
                resetForm();
                fetchRecords();
            }
        } catch (error) {
            console.error('저장 실패:', error);
            showToast('❌ 저장 실패');
        }
    };

    // 수정 시작
    const handleEdit = (record) => {
        setEditingRecord(record);
        setFormData({
            visitDate: record.visitDate.split('T')[0],
            technicianName: record.technicianName,
            workDescription: record.workDescription,
            status: record.status,
            notes: record.notes || '',
            createdBy: record.createdBy
        });
        setShowAddForm(true);
    };

    // 삭제
    const handleDelete = async (id) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;

        try {
            const response = await fetch(`${getApiBaseUrl()}/api/servicerecords/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showToast('✅ 삭제 완료');
                fetchRecords();
            }
        } catch (error) {
            console.error('삭제 실패:', error);
            showToast('❌ 삭제 실패');  
        }
    };

    return (
        <div className={`rounded-2xl p-2 md:p-6 border shadow-xl ${theme === 'space' ? 'border-gray-700' : 'border-gray-200'}`}
            style={theme === 'space'
                ? { background: 'linear-gradient(135deg, rgba(20,20,20,0.98) 0%, rgba(10,10,10,0.98) 100%)', backdropFilter: 'blur(25px)', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }
                : { background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>

            {/* 토스트 */}
            {toastMessage && (
                <div className="fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse"
                    style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
                    <span className="text-white text-sm font-medium">{toastMessage}</span>
                </div>
            )}

            {/* 헤더 */}
            <div className={`rounded-xl p-3 md:p-6 mb-3 md:mb-6 ${theme === 'space' ? 'bg-gradient-to-br from-purple-600/80 via-purple-700/70 to-purple-800/80' : 'bg-gradient-to-br from-blue-500/90 via-indigo-500/80 to-blue-600/90'}`}>
                <h2 className="text-lg md:text-2xl font-bold text-white text-center mb-2 md:mb-4">A/S 기록 관리</h2>

                {!isClient() && !showAddForm && (
                    <button onClick={() => setShowAddForm(true)}
                        className="px-6 py-3 rounded-lg font-bold transition-all hover:scale-105"
                        style={{ background: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white' }}>
                        <span style={{ color: theme === 'space' ? 'white' : '#3b82f6' }}>➕</span> A/S 기록 추가
                    </button>
                )}
            </div>

            {/* 추가/수정 폼 */}
            {showAddForm && !isClient() && (
                <div className={`rounded-xl p-3 md:p-6 mb-3 md:mb-6 ${theme === 'space' ? 'bg-gray-800/50' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100'}`}>
                  
                    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto py-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={`block mb-2 font-medium ${theme === 'space' ? 'text-gray-300' : 'text-gray-700'}`}>방문일시 *</label>
                                <input type="date" required value={formData.visitDate} onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                                    className={`w-full max-w-[200px] md:max-w-none px-2 md:px-4 py-2 rounded-lg border text-sm md:text-base ${theme === 'space' ? 'bg-gray-700 text-white border-gray-600 date-input-space' : 'bg-white text-gray-900 border-gray-300'}`} />
                            </div>
                            <div>
                                <label className={`block mb-2 font-medium ${theme === 'space' ? 'text-gray-300' : 'text-gray-700'}`}>기사명 *</label>
                                <input type="text" required value={formData.technicianName} onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                                    className={`w-full px-4 py-2 rounded-lg border ${theme === 'space' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                                    placeholder="김철수" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={`block mb-2 font-medium ${theme === 'space' ? 'text-gray-300' : 'text-gray-700'}`}>상태 *</label>
                                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className={`w-full px-4 py-2 rounded-lg border ${theme === 'space' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}>
                                    <option value="완료">완료</option>
                                    <option value="진행중">진행중</option>
                                    <option value="예정">예정</option>
                                </select>
                            </div>
                            <div>
                                <label className={`block mb-2 font-medium ${theme === 'space' ? 'text-gray-300' : 'text-gray-700'}`}>작성자 *</label>
                                <input type="text" required value={formData.createdBy} onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
                                    className={`w-full px-4 py-2 rounded-lg border ${theme === 'space' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                                    placeholder="admin / service" />
                            </div>
                        </div>
                        <div>
                            <label className={`block mb-2 font-medium ${theme === 'space' ? 'text-gray-300' : 'text-gray-700'}`}>작업내용 *</label>
                            <textarea required value={formData.workDescription} onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                                className={`w-full px-4 py-2 rounded-lg border ${theme === 'space' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                                rows="10" placeholder="센서 교체, 리프트 점검 등" />
                        </div>
                        <div className="mb-8">
                            <label className={`block mb-2 font-medium ${theme === 'space' ? 'text-gray-300' : 'text-gray-700'}`}>비고</label>
                            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className={`w-full px-4 py-2 rounded-lg border ${theme === 'space' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                                rows="2" placeholder="추가 메모" />
                        </div>
                        <div className="flex gap-3 justify-center mt-24">
                            <button type="submit" 
                                className={`px-8 py-2.5 text-white rounded-lg font-bold transition-all hover:scale-105 ${theme === 'space' ? '' : 'bg-blue-500 hover:bg-blue-600'}`}
                                style={theme === 'space' ? { background: 'linear-gradient(145deg, #7c3aed 0%, #9333ea 50%, #7c3aed 100%)', border: '1px solid rgba(255, 255, 255, 0.2)' } : {}}>
                                {editingRecord ? '수정하기' : '등록하기'}
                            </button>
                            <button type="button" onClick={resetForm} 
                                className={`px-8 py-2.5 text-white rounded-lg font-bold transition-all hover:scale-105 ${theme === 'space' ? '' : 'bg-gray-500 hover:bg-gray-600'}`}
                                style={theme === 'space' ? { background: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)', border: '1px solid rgba(255, 255, 255, 0.2)' } : {}}>
                                취소
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* 기록 테이블 */}
            <div className={`rounded-xl overflow-hidden shadow-2xl ${theme === 'space' ? 'bg-gradient-to-br from-purple-900/80 to-indigo-900/80' : 'bg-white'}`}>
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full">
                        <thead className={`text-white sticky top-0 ${theme === 'space' ? 'bg-gradient-to-br from-purple-500 to-purple-700' : 'bg-gradient-to-br from-blue-500 to-blue-700'}`}>
                            <tr>
                                <th onClick={() => handleSort('visitDate')} className="px-2 md:px-4 py-2 md:py-3 text-center text-[10px] md:text-xs font-semibold cursor-pointer hover:bg-white/10 transition-colors whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1">
                                        방문일시
                                        {sortField === 'visitDate' && (
                                            <span className="text-yellow-300">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('technicianName')} className="px-2 md:px-4 py-2 md:py-3 text-center text-[10px] md:text-xs font-semibold cursor-pointer hover:bg-white/10 transition-colors whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1">
                                        기사명
                                        {sortField === 'technicianName' && (
                                            <span className="text-yellow-300">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('workDescription')} className="px-2 md:px-4 py-2 md:py-3 text-center text-[10px] md:text-xs font-semibold cursor-pointer hover:bg-white/10 transition-colors whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1">
                                        작업내용
                                        {sortField === 'workDescription' && (
                                            <span className="text-yellow-300">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('status')} className="px-2 md:px-4 py-2 md:py-3 text-center text-[10px] md:text-xs font-semibold cursor-pointer hover:bg-white/10 transition-colors whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1">
                                        상태
                                        {sortField === 'status' && (
                                            <span className="text-yellow-300">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('notes')} className="px-2 md:px-4 py-2 md:py-3 text-center text-[10px] md:text-xs font-semibold cursor-pointer hover:bg-white/10 transition-colors whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1">
                                        비고
                                        {sortField === 'notes' && (
                                            <span className="text-yellow-300">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                {!isClient() && <th className="px-2 md:px-4 py-2 md:py-3 text-center text-[10px] md:text-xs font-semibold whitespace-nowrap">관리</th>}
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${theme === 'space' ? 'divide-purple-600/30 bg-gray-900/95' : 'divide-gray-200 bg-white'}`}>
                            {sortedRecords.length === 0 ? (
                                <tr><td colSpan="6" className={`text-center py-12 text-lg ${theme === 'space' ? 'text-purple-400' : 'text-gray-500'}`}>A/S 기록이 없습니다</td></tr>
                            ) : (
                                sortedRecords.map((record) => (
                                    <tr key={record.id} className={`transition-all ${theme === 'space' ? 'hover:bg-purple-800/50' : 'hover:bg-blue-50/50'}`}>
                                        <td className="px-2 md:px-4 py-2 md:py-3 text-center">
                                            <span className={`text-[10px] md:text-sm ${theme === 'space' ? 'text-purple-300' : 'text-gray-600'}`}>
                                                {new Date(record.visitDate).toLocaleDateString('ko-KR')}
                                            </span>
                                        </td>
                                        <td className="px-2 md:px-4 py-2 md:py-3 text-center">
                                            <span className={`text-[8px] md:text-base font-bold ${theme === 'space' ? 'text-purple-100' : 'text-gray-800'}`}>{record.technicianName}</span>
                                        </td>
                                        <td className="px-2 md:px-4 py-2 md:py-3">
                                            <span className={`text-[8px] md:text-sm ${theme === 'space' ? 'text-gray-300' : 'text-gray-700'}`}>{record.workDescription}</span>
                                        </td>
                                        <td className="px-2 md:px-4 py-2 md:py-3 text-center">
                                            <span className={`inline-flex items-center justify-center px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-semibold min-w-[36px] ${record.status === '완료' ? 'bg-green-500 text-white' :
                                                    record.status === '진행중' ? 'bg-yellow-500 text-white' :
                                                        'bg-blue-500 text-white'
                                                }`}>{record.status}</span>
                                        </td>
                                        <td className="px-2 md:px-4 py-2 md:py-3">
                                            <span className={`text-[10px] md:text-xs ${theme === 'space' ? 'text-gray-400' : 'text-gray-500'}`}>{record.notes || '-'}</span>
                                        </td>
                                        {!isClient() && (
                                            <td className="px-1 md:px-4 py-2 md:py-3 text-center">
                                                <div className="flex gap-1 justify-center items-center">
                                                    <button onClick={() => handleEdit(record)} className={`edit-btn text-white rounded-md md:rounded-lg text-[7px] md:text-[10px] flex items-center justify-center ${theme === 'space' ? 'bg-purple-500 hover:bg-purple-600' : 'bg-blue-500 hover:bg-blue-600'}`}>수정</button>
                                                    <button onClick={() => handleDelete(record.id)} className="delete-btn bg-red-500 text-white rounded-md md:rounded-lg text-[7px] md:text-[10px] flex items-center justify-center hover:bg-red-600">삭제</button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <style>{`
                @media (max-width: 768px) {
                    input[type="date"]::-webkit-calendar-picker-indicator {
                        display: none;
                    }
                    .edit-btn, .delete-btn {
                        width: 24px !important;
                        height: 14px !important;
                        min-width: 24px !important;
                        min-height: 14px !important;
                        max-width: 24px !important;
                        max-height: 14px !important;
                        padding: 0 !important;
                        line-height: 1 !important;
                    }
                }
                @media (min-width: 769px) {
                    .edit-btn, .delete-btn {
                        width: 36px !important;
                        height: 20px !important;
                        min-width: 36px !important;
                        min-height: 20px !important;
                        max-width: 36px !important;
                        max-height: 20px !important;
                        padding: 0 !important;
                        line-height: 1 !important;
                    }
                }
                .date-input-space::-webkit-calendar-picker-indicator {
                    filter: invert(58%) sepia(52%) saturate(2200%) hue-rotate(230deg) brightness(100%) contrast(101%);
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};

export default ServiceRecordTab;