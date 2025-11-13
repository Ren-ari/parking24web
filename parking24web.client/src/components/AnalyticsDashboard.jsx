import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import siteConfig from '../../config/sokcho2Config.js';
import { useTheme } from '../contexts/ThemeContext';

// 반응형 미디어 쿼리 훅
const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        setMatches(media.matches);

        const listener = (e) => setMatches(e.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [query]);

    return matches;
};

// 데이터 처리 함수들 (컴포넌트 밖으로 추출)
const processMonthlyData = (data) => {
    if (!data || data.length === 0) {
        return [];
    }

    // 중복 제거: 같은 year-month-eventType 조합의 최신 데이터만 유지
    const uniqueData = data.reduce((acc, item) => {
        const key = `${item.year}-${item.month}-${item.eventType}`;
        if (!acc[key] || new Date(item.timestamp || item.createdAt || 0) > new Date(acc[key].timestamp || acc[key].createdAt || 0)) {
            acc[key] = item;
        }
        return acc;
    }, {});

    const grouped = {};
    Object.values(uniqueData).forEach(item => {
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
    
    if (!data || data.length === 0) {
        return [];
    }

    // 중복 제거: 같은 dayOfWeek-eventType 조합의 최신 데이터만 유지
    const uniqueData = data.reduce((acc, item) => {
        const key = `${item.dayOfWeek}-${item.eventType}`;
        if (!acc[key] || new Date(item.timestamp || item.createdAt || 0) > new Date(acc[key].timestamp || acc[key].createdAt || 0)) {
            acc[key] = item;
        }
        return acc;
    }, {});
    
    const grouped = {};
    Object.values(uniqueData).forEach(item => {
        const day = dayNames[item.dayOfWeek];
        if (!grouped[day]) {
            grouped[day] = { day, 입차: 0, 출차: 0 };
        }
        if (item.eventType === '입차') grouped[day].입차 = item.count;
        if (item.eventType === '출차') grouped[day].출차 = item.count;
    });
    const result = dayNames.map(day => grouped[day] || { day, 입차: 0, 출차: 0 });
    return result;
};

const processHourlyData = (data) => {
    if (!data || data.length === 0) {
        return [];
    }

    // 중복 제거: 같은 hour-eventType 조합의 최신 데이터만 유지
    const uniqueData = data.reduce((acc, item) => {
        const key = `${item.hour}-${item.eventType}`;
        if (!acc[key] || new Date(item.timestamp || item.createdAt || 0) > new Date(acc[key].timestamp || acc[key].createdAt || 0)) {
            acc[key] = item;
        }
        return acc;
    }, {});
    
    const 입차Data = [];
    const 출차Data = [];
    
    for (let i = 0; i < 24; i++) {
        입차Data.push({ x: i, y: 0, size: 0 });
        출차Data.push({ x: i, y: 0, size: 0 });
    }
    
    Object.values(uniqueData).forEach(item => {
        if (item.eventType === '입차') {
            입차Data[item.hour] = { x: item.hour, y: item.count, size: item.count };
        }
        if (item.eventType === '출차') {
            출차Data[item.hour] = { x: item.hour, y: item.count, size: item.count };
        }
    });
    
    const result = [    
        { id: '입차', data: 입차Data },
        { id: '출차', data: 출차Data }
    ];
    return result;
};

const AnalyticsDashboard = () => {
    const { theme } = useTheme();
    const [monthlyData, setMonthlyData] = useState([]);
    const [weeklyData, setWeeklyData] = useState([]);
    const [hourlyData, setHourlyData] = useState([]);
    const [topSlotsData, setTopSlotsData] = useState([]);
    const [topSlotsRawData, setTopSlotsRawData] = useState([]);
    const [loading, setLoading] = useState(true);
    const isMobile = useMediaQuery('(max-width: 767px)');

    // 테마별 차트 색상 팔레트 메모이제이션
    const isSpace = useMemo(() => theme === 'space', [theme]);
    
    const barColors = useMemo(() => 
        isSpace
            ? ['#8b5cf6', '#22d3ee'] // violet → cyan
            : ['#1e3a8a', '#60a5fa']
    , [isSpace]);
    
    const lineColors = useMemo(() => 
        isSpace
            ? ['#a855f7', '#06b6d4'] // purple, cyan
            : ['#1e40af', '#60a5fa']
    , [isSpace]);
    
    const pieColors = useMemo(() => 
        isSpace
            ? ['#a855f7', '#c084fc', '#06b6d4', '#22d3ee', '#f0abfc']
            : ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']
    , [isSpace]);

    // processTopSlotsData는 isMobile 의존성 있으므로 useCallback
    const processTopSlotsData = useCallback((data) => {
        if (!data || data.length === 0) {
            return [];
        }

        // API 응답: { slotNumber, count }
        // Nivo Pie 차트 형식: { id, label, value }
        const result = data
            .slice(0, 5)
            .map((item) => ({
                id: `slot-${item.slotNumber}`,
                label: isMobile ? `${item.slotNumber}번` : `${item.slotNumber}번 차판`,
                value: item.count
            }));
        
        return result;
    }, [isMobile]);

    const fetchAllAnalytics = useCallback(async () => {
        try {
            // ============================================
            // 동적 baseURL 구성 (포트포워딩 대응)
            // ============================================
            const getBaseUrl = () => {
                const currentHost = window.location.host;  // 예: "222.113.92.40:5124" or "localhost:5173"
                const currentProtocol = window.location.protocol;  // "http:" or "https:"

                // 개발 환경 감지 (Vite dev server는 5173 포트 사용)
                if (currentHost.includes(':5173')) {
                    return `http://localhost:${siteConfig.api.devPort}`;
                }

                // 운영 환경 (외부 접속)
                // 접속한 호스트명 + API 포트로 요청
                const hostname = window.location.hostname;  // IP 또는 도메인만 추출
                return `${currentProtocol}//${hostname}:${siteConfig.api.devPort}`;
            };

            const baseUrl = getBaseUrl();
            console.log('📊 대시보드 API 베이스 URL:', baseUrl);
            
            // 월별 데이터
            const monthlyResponse = await fetch(`${baseUrl}/api/analytics/monthly`);
            const monthlyRaw = await monthlyResponse.json();
            const monthlyFormatted = processMonthlyData(monthlyRaw);
            setMonthlyData(monthlyFormatted);

            // 주별 데이터
            const weeklyResponse = await fetch(`${baseUrl}/api/analytics/weekly`);
            const weeklyRaw = await weeklyResponse.json();
            const weeklyFormatted = processWeeklyData(weeklyRaw);
            setWeeklyData(weeklyFormatted);

            // 시간대별 데이터
            const hourlyResponse = await fetch(`${baseUrl}/api/analytics/hourly`);
            const hourlyRaw = await hourlyResponse.json();
            const hourlyFormatted = processHourlyData(hourlyRaw);
            setHourlyData(hourlyFormatted);

            // TOP 슬롯 데이터
            const topSlotsResponse = await fetch(`${baseUrl}/api/analytics/topslots`);
            const topSlotsRaw = await topSlotsResponse.json();
            setTopSlotsRawData(topSlotsRaw);
            const topSlotsFormatted = processTopSlotsData(topSlotsRaw);
            setTopSlotsData(topSlotsFormatted);

            setLoading(false);
        } catch (error) {
            console.error('분석 데이터 로드 실패:', error);
            setLoading(false);
        }
    }, [processTopSlotsData]);

    useEffect(() => {
        fetchAllAnalytics();
    }, [fetchAllAnalytics]);

    // isMobile이 변경될 때마다 topSlotsData 재처리
    useEffect(() => {
        if (topSlotsRawData.length > 0) {
            setTopSlotsData(processTopSlotsData(topSlotsRawData));
        }
    }, [isMobile, topSlotsRawData, processTopSlotsData]);

    // 스타일 메모이제이션
    const chartHeightStyle = useMemo(() => ({
        height: isMobile ? 250 : 300
    }), [isMobile]);

    const tooltipStyle = useMemo(() => ({
        background: theme === 'space' ? '#1a1a1a' : '#fff',
        color: theme === 'space' ? '#fff' : '#333',
        fontSize: 12,
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        border: `1px solid ${theme === 'space' ? '#444' : '#ddd'}`,
        padding: '8px 12px',
        whiteSpace: 'nowrap'
    }), [theme]);

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
            {/* 반응형 그리드: 모바일 1열, 태블릿 1열, PC 2열 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 월별 입출차 추이 */}
                <div className={`rounded-2xl ${isMobile ? 'p-1' : 'p-6'} ${theme === 'space' ? 'bg-gray-900/95 border border-gray-700' : 'bg-sky-50 border border-sky-200'}`}>
                    <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-6 ${theme === 'space' ? 'text-purple-400' : 'text-blue-600'}`}>
                        월별 입출차 추이 (최근 12개월)
                    </h3>
                    <div style={chartHeightStyle}>
                        <ResponsiveBar
                            data={monthlyData}
                            keys={['입차', '출차']}
                            indexBy="month"
                            margin={{ top: 60, right: 10, bottom: 50, left: 40 }}
                            padding={0.2}
                            valueScale={{ type: 'linear', min: 0, max: 1000 }}
                            indexScale={{ type: 'band', round: true }}
                            colors={barColors}
                            borderRadius={0}
                            borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                            axisTop={null}
                            axisRight={null}
                            axisBottom={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                legendPosition: 'middle',
                                legendOffset: 32
                            }}
                            axisLeft={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                legendPosition: 'middle',
                                legendOffset: -40
                            }}
                            labelSkipWidth={12}
                            labelSkipHeight={12}
                            labelTextColor={{ from: 'color', modifiers: [['darker', 3]] }}
                            enableGridX={false}
                            enableGridY={true}
                            legends={[
                                {
                                    dataFrom: 'keys',
                                    anchor: 'top',
                                    direction: 'row',
                                    justify: false,
                                    translateX: 20,
                                    translateY: -40,
                                    itemsSpacing: 20,
                                    itemWidth: 80,
                                    itemHeight: 20,
                                    itemDirection: 'left-to-right',
                                    itemOpacity: 0.85,
                                    symbolSize: 20,
                                    effects: [
                                        {
                                            on: 'hover',
                                            style: {
                                                itemOpacity: 1
                                            }
                                        }
                                    ]
                                }
                            ]}
                            theme={{
                                axis: {
                                    ticks: {
                                        text: {
                                            fill: theme === 'space' ? '#999' : '#666'
                                        }
                                    }
                                },
                                grid: {
                                    line: {
                                        stroke: theme === 'space' ? '#444' : '#ddd',
                                        strokeWidth: 1
                                    }
                                },
                                legends: {
                                    text: {
                                        fill: theme === 'space' ? '#999' : '#666',
                                        fontSize: isMobile ? 16 : 18,
                                        fontWeight: 'bold'
                                    }
                                },
                                tooltip: {
                                    container: {
                                        background: theme === 'space' ? '#1a1a1a' : '#fff',
                                    color: theme === 'space' ? '#fff' : '#333',
                                        fontSize: 12,
                                    borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                        border: `1px solid ${theme === 'space' ? '#444' : '#ddd'}`
                                    }
                                },
                                labels: {
                                    text: {
                                        fontSize: 16
                                    }
                                }
                            }}
                            role="application"
                            ariaLabel="월별 입출차 추이"
                        />
                    </div>
                </div>

                {/* 요일별 비교 */}
                <div className={`rounded-2xl ${isMobile ? 'p-1' : 'p-6'} ${theme === 'space' ? 'bg-gray-900/95 border border-gray-700' : 'bg-sky-50 border border-sky-200'}`}>
                    <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-6 ${theme === 'space' ? 'text-purple-400' : 'text-blue-600'}`}>
                        요일별 입출차 비교 (최근 3개월)
                    </h3>
                    <div style={chartHeightStyle}>
                        <ResponsiveLine
                            data={[
                                {
                                    id: '입차',
                                    data: weeklyData.map(d => ({ x: d.day, y: d.입차 }))
                                },
                                {
                                    id: '출차',
                                    data: weeklyData.map(d => ({ x: d.day, y: d.출차 }))
                                }
                            ]}
                            margin={{ top: 60, right: 10, bottom: 50, left: 30 }}
                            xScale={{ type: 'point' }}
                            yScale={{ type: 'linear', min: 0, max: '100', stacked: false, reverse: false }}
                            curve="monotoneX"
                            axisTop={null}
                            axisRight={null}
                            axisBottom={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                legendPosition: 'middle',
                                legendOffset: 32
                            }}
                            axisLeft={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                legendPosition: 'middle',
                                legendOffset: -40
                            }}
                            enableGridX={false}
                            colors={lineColors}
                            lineWidth={3}
                            pointSize={isMobile ? 6 : 8}
                            pointColor={{ theme: 'background' }}
                            pointBorderWidth={2}
                            pointBorderColor={{ from: 'serieColor' }}
                            enableArea={true}
                            areaOpacity={1}
                            defs={[
                                {
                                    id: 'line-area-in',
                                    type: 'linearGradient',
                                    colors: [
                                        { offset: 0, color: isSpace ? '#a855f7' : '#1e40af', opacity: 0.7 },
                                        { offset: 100, color: isSpace ? '#22d3ee' : '#60a5fa', opacity: 0.2 }
                                    ]
                                },
                                {
                                    id: 'line-area-out',
                                    type: 'linearGradient',
                                    colors: [
                                        { offset: 0, color: isSpace ? '#06b6d4' : '#60a5fa', opacity: 0.6 },
                                        { offset: 100, color: isSpace ? '#22d3ee' : '#93c5fd', opacity: 0.15 }
                                    ]
                                }
                            ]}
                            fill={[
                                { match: { id: '입차' }, id: 'line-area-in' },
                                { match: { id: '출차' }, id: 'line-area-out' }
                            ]}
                            enableSlices="x"
                            useMesh={true}
                            enableCrosshair={true}
                            crosshairType="x"
                            tooltip={({ point }) => (
                                <div style={tooltipStyle}>
                                     <strong>{point.data.x}요일 {point.serieId}</strong>: {point.data.y}대
                                </div>
                            )}
                            legends={[
                                {
                                    anchor: 'top',
                                    direction: 'row',
                                    justify: false,
                                    translateX: 20,
                                    translateY: -40,
                                    itemsSpacing: 20,
                                    itemDirection: 'left-to-right',
                                    itemWidth: 80,
                                    itemHeight: 20,
                                    itemOpacity: 0.85,
                                    symbolSize: 20,
                                    symbolShape: 'circle',
                                    effects: [
                                        {
                                            on: 'hover',
                                            style: {
                                                itemOpacity: 1
                                            }
                                        }
                                    ]
                                }
                            ]}
                            theme={{
                                axis: {
                                    ticks: {
                                        text: {
                                            fill: theme === 'space' ? '#999' : '#666'
                                        }
                                    }
                                },
                                grid: {
                                    line: {
                                        stroke: theme === 'space' ? '#444' : '#ddd',
                                        strokeWidth: 1
                                    }
                                },
                                legends: {
                                    text: {
                                        fill: theme === 'space' ? '#999' : '#666',
                                        fontSize: isMobile ? 16 : 18,
                                        fontWeight: 'bold'
                                    }
                                },
                                tooltip: {
                                    container: {
                                        background: theme === 'space' ? '#1a1a1a' : '#fff',
                                    color: theme === 'space' ? '#fff' : '#333',
                                        fontSize: 12,
                                    borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                        border: `1px solid ${theme === 'space' ? '#444' : '#ddd'}`
                                    }
                                },
                                labels: {
                                    text: {
                                        fontSize: 16
                                    }
                                }
                            }}
                            role="application"
                            ariaLabel="요일별 입출차 비교"
                        />
                    </div>
                </div>

                {/* 시간대별 패턴 (라인) */}
                <div className={`rounded-2xl ${isMobile ? 'p-1' : 'p-6'} ${theme === 'space' ? 'bg-gray-900/95 border border-gray-700' : 'bg-sky-50 border border-sky-200'}`}>
                    <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-6 ${theme === 'space' ? 'text-purple-400' : 'text-blue-600'}`}>
                        시간대별 입출차 패턴 (최근 1개월)
                    </h3>
                    <div style={chartHeightStyle}>
                        <ResponsiveLine
                            data={hourlyData}
                            margin={{ 
                                top: isMobile ? 60 : 60, 
                                right: isMobile ? 10 : 10, 
                                bottom: isMobile ? 50 : 50, 
                                left: isMobile ? 20 : 30 
                            }}
                            xScale={{ type: 'linear', min: 0, max: 23 }}
                            yScale={{ type: 'linear', min: '0', max: '50', stacked: false }}
                            curve="catmullRom"
                            axisTop={null}
                            axisRight={null}
                            axisBottom={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                legendPosition: 'middle',
                                legendOffset: 46,
                                format: (value) => `${value}시`
                            }}
                            axisLeft={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                legendPosition: 'middle',
                                legendOffset: -50
                            }}
                            colors={lineColors}
                            lineWidth={isMobile ? 1.5 : 2}
                            pointSize={isMobile ? 6 : 8}
                            pointColor={{ theme: 'background' }}
                            pointBorderWidth={2}
                            pointBorderColor={{ from: 'seriesColor' }}
                            enableArea={false}
                            useMesh={true}
                            enableGridX={false}
                            enableGridY={true}
                            tooltip={({ point }) => (
                                <div style={tooltipStyle}>
                                     <strong>{point.data.x}시 {point.serieId}</strong>: {point.data.y}대
                                </div>
                            )}
                            legends={[
                                {
                                    anchor: 'top',
                                    direction: 'row',
                                    justify: false,
                                    translateX: 20,
                                    translateY: -40,
                                    itemsSpacing: 20,
                                    itemWidth: 80,
                                    itemHeight: 20,
                                    itemDirection: 'left-to-right',
                                    itemOpacity: 0.85,
                                    symbolSize: 20,
                                    symbolShape: 'circle',
                                    effects: [
                                        { on: 'hover', style: { itemOpacity: 1 } }
                                    ]
                                }
                            ]}
                            theme={{
                                background: theme === 'space' ? '#111827' : '#f0f9ff',
                                axis: {
                                    ticks: { text: { fill: isSpace ? '#999' : '#666' } },
                                    legend: { text: { fill: isSpace ? '#999' : '#666' } }
                                },
                                grid: { line: { stroke: isSpace ? '#444' : '#ddd', strokeWidth: 1 } },
                                legends: { text: { fill: isSpace ? '#999' : '#666' } }
                            }}
                            role="application"
                            ariaLabel="시간대별 입출차 패턴"
                        />
                    </div>
                </div>

                {/* 차판 이용 빈도 TOP 5 */}
                <div className={`rounded-2xl ${isMobile ? 'p-1' : 'p-6'} ${theme === 'space' ? 'bg-gray-900/95 border border-gray-700' : 'bg-sky-50 border border-sky-200'}`}>
                    <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-6 ${theme === 'space' ? 'text-purple-400' : 'text-blue-600'}`}>
                        차판 이용 빈도 TOP 5 (최근 3개월)
                    </h3>
                    <div style={chartHeightStyle}>
                        <ResponsivePie
                                data={topSlotsData}
                            margin={{ 
                                top: isMobile ? 40 : 40, 
                                right: isMobile ? 60 : 120, 
                                bottom: isMobile ? 40 : 40, 
                                left: isMobile ? 60 : 120 
                            }}
                            innerRadius={0.5}
                            padAngle={0.7}
                            cornerRadius={3}
                            activeOuterRadiusOffset={8}
                            colors={pieColors}
                            borderWidth={1}
                            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                            startAngle={-90}
                            endAngle={270}
                            sortByValue={true}
                            arcLabel="value"
                            arcLabelsSkipAngle={10}
                            arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                            arcLinkLabel="label"
                            arcLinkLabelsSkipAngle={10}
                            arcLinkLabelsTextColor={theme === 'space' ? '#999' : '#666'}
                            arcLinkLabelsThickness={2}
                            arcLinkLabelsDiagonalLength={isMobile ? 8 : 16}
                            arcLinkLabelsStraightLength={isMobile ? 8 : 16}
                            arcLinkLabelsColor={{ from: 'color' }}
                            theme={{
                                tooltip: {
                                    container: {
                                        background: theme === 'space' ? '#1a1a1a' : '#fff',
                                        color: theme === 'space' ? '#fff' : '#333',
                                        fontSize: 12,
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                        border: `1px solid ${theme === 'space' ? '#444' : '#ddd'}`
                                    }
                                },
                                labels: {
                                    text: {
                                        fontSize: isMobile ? 12 : 16
                                    }
                                },
                                arcLabels: {
                                    text: {
                                        fontSize: isMobile ? 10 : 14
                                    }
                                }
                            }}
                            role="application"
                            ariaLabel="차판 이용 빈도 TOP 5"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;