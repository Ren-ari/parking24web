import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import siteConfig from '../../config/sokcho1Config.js';
import { useTheme } from '../contexts/ThemeContext';

const AnalyticsDashboard = () => {
    const { theme } = useTheme();
    const [monthlyData, setMonthlyData] = useState([]);
    const [weeklyData, setWeeklyData] = useState([]);
    const [hourlyData, setHourlyData] = useState([]);
    const [topSlotsData, setTopSlotsData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllAnalytics();
    }, []);

    const fetchAllAnalytics = async () => {
        try {
            const apiBaseUrl = window.location.host.includes(':5173')
                ? `http://localhost:${siteConfig.api.devPort}`
                : siteConfig.api.baseUrl;

            const [monthly, weekly, hourly, topSlots] = await Promise.all([
                fetch(`${apiBaseUrl}/api/analytics/monthly`).then(r => r.json()),
                fetch(`${apiBaseUrl}/api/analytics/weekly`).then(r => r.json()),
                fetch(`${apiBaseUrl}/api/analytics/hourly`).then(r => r.json()),
                fetch(`${apiBaseUrl}/api/analytics/topslots`).then(r => r.json())
            ]);

            // 월별 데이터 가공
            const monthlyFormatted = processMonthlyData(monthly);
            setMonthlyData(monthlyFormatted);

            // 요일별 데이터 가공
            const weeklyFormatted = processWeeklyData(weekly);
            setWeeklyData(weeklyFormatted);

            // 시간대별 데이터 가공
            const hourlyFormatted = processHourlyData(hourly);
            setHourlyData(hourlyFormatted);

            // TOP 10 데이터 가공
            setTopSlotsData(topSlots);

            setLoading(false);
        } catch (error) {
            console.error('분석 데이터 로드 실패:', error);
            setLoading(false);
        }
    };

    const processMonthlyData = (data) => {
        const grouped = {};
        data.forEach(item => {
            const key = `${item.year}-${item.month}`;
            if (!grouped[key]) {
                grouped[key] = { month: `${item.month}월`, 입차: 0, 출차: 0 };
            }
            if (item.eventType === '입차') grouped[key].입차 = item.count;
            if (item.eventType === '출차') grouped[key].출차 = item.count;
        });
        return Object.values(grouped);
    };

    const processWeeklyData = (data) => {
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        const grouped = {};
        data.forEach(item => {
            const day = dayNames[item.dayOfWeek];
            if (!grouped[day]) {
                grouped[day] = { day, 입차: 0, 출차: 0 };
            }
            if (item.eventType === '입차') grouped[day].입차 = item.count;
            if (item.eventType === '출차') grouped[day].출차 = item.count;
        });
        return dayNames.map(day => grouped[day] || { day, 입차: 0, 출차: 0 });
    };

    const processHourlyData = (data) => {
        const grouped = {};
        for (let i = 0; i < 24; i++) {
            grouped[i] = { hour: `${i}시`, 입차: 0, 출차: 0 };
        }
        data.forEach(item => {
            if (item.eventType === '입차') grouped[item.hour].입차 = item.count;
            if (item.eventType === '출차') grouped[item.hour].출차 = item.count;
        });
        return Object.values(grouped);
    };

    if (loading) {
        return (
            <div className={`rounded-2xl p-6 ${theme === 'space' ? 'bg-gray-900/95' : 'bg-white'}`}>
                <div className="text-center py-12">
                    <div className="text-lg">데이터 로딩 중...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 월별 입출차 추이 */}
            <div className={`rounded-2xl p-6 ${theme === 'space' ? 'bg-gray-900/95 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <h3 className={`text-xl font-bold mb-6 ${theme === 'space' ? 'text-purple-400' : 'text-blue-600'}`}>
                    월별 입출차 추이 (최근 12개월)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'space' ? '#444' : '#ddd'} />
                        <XAxis dataKey="month" stroke={theme === 'space' ? '#999' : '#666'} />
                        <YAxis stroke={theme === 'space' ? '#999' : '#666'} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: theme === 'space' ? '#1a1a1a' : '#fff',
                                border: `1px solid ${theme === 'space' ? '#444' : '#ddd'}`
                            }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="입차" stroke="#8884d8" strokeWidth={2} />
                        <Line type="monotone" dataKey="출차" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* 요일별 비교 */}
            <div className={`rounded-2xl p-6 ${theme === 'space' ? 'bg-gray-900/95 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <h3 className={`text-xl font-bold mb-6 ${theme === 'space' ? 'text-purple-400' : 'text-blue-600'}`}>
                    요일별 입출차 비교 (최근 3개월)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'space' ? '#444' : '#ddd'} />
                        <XAxis dataKey="day" stroke={theme === 'space' ? '#999' : '#666'} />
                        <YAxis stroke={theme === 'space' ? '#999' : '#666'} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: theme === 'space' ? '#1a1a1a' : '#fff',
                                border: `1px solid ${theme === 'space' ? '#444' : '#ddd'}`
                            }}
                        />
                        <Legend />
                        <Bar dataKey="입차" fill="#8884d8" />
                        <Bar dataKey="출차" fill="#82ca9d" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* 시간대별 패턴 */}
            <div className={`rounded-2xl p-6 ${theme === 'space' ? 'bg-gray-900/95 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <h3 className={`text-xl font-bold mb-6 ${theme === 'space' ? 'text-purple-400' : 'text-blue-600'}`}>
                    시간대별 입출차 패턴 (최근 1개월)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'space' ? '#444' : '#ddd'} />
                        <XAxis dataKey="hour" stroke={theme === 'space' ? '#999' : '#666'} />
                        <YAxis stroke={theme === 'space' ? '#999' : '#666'} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: theme === 'space' ? '#1a1a1a' : '#fff',
                                border: `1px solid ${theme === 'space' ? '#444' : '#ddd'}`
                            }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="입차" stroke="#8884d8" strokeWidth={2} />
                        <Line type="monotone" dataKey="출차" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* 차판 이용 빈도 TOP 10 */}
            <div className={`rounded-2xl p-6 ${theme === 'space' ? 'bg-gray-900/95 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <h3 className={`text-xl font-bold mb-6 ${theme === 'space' ? 'text-purple-400' : 'text-blue-600'}`}>
                    차판 이용 빈도 TOP 10 (최근 3개월)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topSlotsData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'space' ? '#444' : '#ddd'} />
                        <XAxis type="number" stroke={theme === 'space' ? '#999' : '#666'} />
                        <YAxis dataKey="slotNumber" type="category" stroke={theme === 'space' ? '#999' : '#666'} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: theme === 'space' ? '#1a1a1a' : '#fff',
                                border: `1px solid ${theme === 'space' ? '#444' : '#ddd'}`
                            }}
                        />
                        <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;