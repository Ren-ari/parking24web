import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeSelector = () => {
    const { theme, setTheme, themes, currentTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleThemeSelect = (themeId) => {
        setTheme(themeId);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* 테마 선택 버튼 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
            >
                <span className="text-lg">{currentTheme.icon}</span>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{currentTheme.name}</span>
                <svg 
                    className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* 드롭다운 메뉴 */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden z-50">
                    <div className="p-3">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                            테마 선택
                        </div>
                        
                        <div className="space-y-1">
                            {Object.values(themes).map((themeOption) => (
                                <button
                                    key={themeOption.id}
                                    onClick={() => handleThemeSelect(themeOption.id)}
                                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 text-left group ${
                                        theme === themeOption.id
                                            ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-300/30'
                                            : 'hover:bg-gray-50/80'
                                    }`}
                                >
                                    <span className="text-xl">{themeOption.icon}</span>
                                    <div className="flex-1">
                                        <div className={`font-medium ${
                                            theme === themeOption.id ? 'text-blue-700' : 'text-gray-700'
                                        }`}>
                                            {themeOption.name}
                                        </div>
                                        <div className={`text-xs ${
                                            theme === themeOption.id ? 'text-blue-500' : 'text-gray-500'
                                        }`}>
                                            {themeOption.description}
                                        </div>
                                    </div>
                                    {theme === themeOption.id && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThemeSelector;
