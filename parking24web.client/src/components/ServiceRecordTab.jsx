import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import siteConfig from '../../config/sokcho1Config.js';

const ServiceRecordTab = () => {
    const { theme } = useTheme();
    const { isClient } = useAuth();
    const [records, setRecords] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [formData, setFormData] = useState({
        visitDate: '',
        technicianName: '',
        workDescription: '',
        status: '완료',
        notes: '',
        createdBy: ''
    });
    const [toastMessage, setToastMessage] = useState('');

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

    // 폼 초기화
    const resetForm = () => {
        setFormData({
            visitDate: '',
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
        <div className={`rounded-2xl p-6 border shadow-xl ${theme === 'space' ? 'border-gray-700' : 'border-gray-200'}`}
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
            <div className={`rounded-xl p-6 mb-6 ${theme === 'space' ? 'bg-gradient-to-br from-purple-600/80 via-purple-700/70 to-purple-800/80' : 'bg-gradient-to-br from-blue-500/90 via-indigo-500/80 to-blue-600/90'}`}>
                <h2 className="text-2xl font-bold text-white text-center mb-4">A/S 기록 관리</h2>

                {!isClient() && (
                    <button onClick={() => setShowAddForm(!showAddForm)}
                        className="w-full px-4 py-3 rounded-lg font-bold text-white transition-all hover:scale-105"
                        style={{ background: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                        {showAddForm ? '📋 목록으로' : '➕ A/S 기록 추가'}
                    </button>
                )}
            </div>

            {/* 추가/수정 폼 */}
            {showAddForm && !isClient() && (
                <div className={`rounded-xl p-6 mb-6 ${theme === 'space' ? 'bg-gray-800/50' : 'bg-white/70'}`}>
                    <h3 className={`text-xl font-bold mb-4 ${theme === 'space' ? 'text-purple-300' : 'text-blue-600'}`}>
                        {editingRecord ? '수정하기' : '새 A/S 기록'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className={`block mb-2 font-medium ${theme === 'space' ? 'text-gray-300' : 'text-gray-700'}`}>방문일시 *</label>
                            <input type="date" required value={formData.visitDate} onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                                className={`w-full px-4 py-2 rounded-lg border ${theme === 'space' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`} />
                        </div>
                        <div>
                            <label className={`block mb-2 font-medium ${theme === 'space' ? 'text-gray-300' : 'text-gray-700'}`}>기사명 *</label>
                            <input type="text" required value={formData.technicianName} onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                                className={`w-full px-4 py-2 rounded-lg border ${theme === 'space' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                                placeholder="김철수" />
                        </div>
                        <div>
                            <label className={`block mb-2 font-medium ${theme === 'space' ? 'text-gray-300' : 'text-gray-700'}`}>작업내용 *</label>
                            <textarea required value={formData.workDescription} onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                                className={`w-full px-4 py-2 rounded-lg border ${theme === 'space' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                                rows="3" placeholder="센서 교체, 리프트 점검 등" />
                        </div>
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
                            <label className={`block mb-2 font-medium ${theme === 'space' ? 'text-gray-300' : 'text-gray-700'}`}>비고</label>
                            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className={`w-full px-4 py-2 rounded-lg border ${theme === 'space' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                                rows="2" placeholder="추가 메모" />
                        </div>
                        <div>
                            <label className={`block mb-2 font-medium ${theme === 'space' ? 'text-gray-300' : 'text-gray-700'}`}>작성자 *</label>
                            <input type="text" required value={formData.createdBy} onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
                                className={`w-full px-4 py-2 rounded-lg border ${theme === 'space' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                                placeholder="admin / service" />
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600">
                                {editingRecord ? '수정하기' : '등록하기'}
                            </button>
                            <button type="button" onClick={resetForm} className="flex-1 px-4 py-3 bg-gray-500 text-white rounded-lg font-bold hover:bg-gray-600">
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
                                <th className="px-4 py-3 text-center text-xs font-semibold">방문일시</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold">기사명</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold">작업내용</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold">상태</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold">비고</th>
                                {!isClient() && <th className="px-4 py-3 text-center text-xs font-semibold">관리</th>}
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${theme === 'space' ? 'divide-purple-600/30 bg-gray-900/95' : 'divide-gray-200 bg-white'}`}>
                            {records.length === 0 ? (
                                <tr><td colSpan="6" className={`text-center py-12 text-lg ${theme === 'space' ? 'text-purple-400' : 'text-gray-500'}`}>A/S 기록이 없습니다</td></tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record.id} className={`transition-all ${theme === 'space' ? 'hover:bg-purple-800/50' : 'hover:bg-blue-50/50'}`}>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-sm ${theme === 'space' ? 'text-purple-300' : 'text-gray-600'}`}>
                                                {new Date(record.visitDate).toLocaleDateString('ko-KR')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`font-bold ${theme === 'space' ? 'text-purple-100' : 'text-gray-800'}`}>{record.technicianName}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-sm ${theme === 'space' ? 'text-gray-300' : 'text-gray-700'}`}>{record.workDescription}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${record.status === '완료' ? 'bg-green-500 text-white' :
                                                    record.status === '진행중' ? 'bg-yellow-500 text-white' :
                                                        'bg-blue-500 text-white'
                                                }`}>{record.status}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs ${theme === 'space' ? 'text-gray-400' : 'text-gray-500'}`}>{record.notes || '-'}</span>
                                        </td>
                                        {!isClient() && (
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex gap-2 justify-center">
                                                    <button onClick={() => handleEdit(record)} className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">수정</button>
                                                    <button onClick={() => handleDelete(record.id)} className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">삭제</button>
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
        </div>
    );
};

export default ServiceRecordTab;