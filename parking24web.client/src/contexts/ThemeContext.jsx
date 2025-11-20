import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// 사용 가능한 테마 목록
export const THEMES = {
    light: {
        id: 'light',
        name: '라이트'
    },
    space: {
        id: 'space',
        name: '우주'
    }
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // 로컬스토리지에서 테마 설정 불러오기
        const savedTheme = localStorage.getItem('parking-theme');
        return savedTheme || 'light';
    });

    // 테마 변경 시 로컬스토리지에 저장
    useEffect(() => {
        localStorage.setItem('parking-theme', theme);
    }, [theme]);

    const setThemeById = (themeId) => {
        if (THEMES[themeId]) {
            setTheme(themeId);
        }
    };

    const value = {
        theme,
        setTheme: setThemeById,
        themes: THEMES,
        currentTheme: THEMES[theme],
        isSpaceTheme: theme === 'space',
        isLightTheme: theme === 'light'
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
