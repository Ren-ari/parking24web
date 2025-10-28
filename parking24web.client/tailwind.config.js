/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./index.html"
    ],
    theme: {
        extend: {
            gap: {
                '12': '3rem',   // 48px
                '14': '3.5rem', // 56px
                '16': '4rem',   // 64px
                '20': '5rem',   // 80px
                '24': '6rem',   // 96px
            },
            screens: {
                // 아이패드 프로 가로모드(1366px)에서도 태블릿 모드로 유지
                'xl': '1400px',  // 기존 1280px에서 1400px 
                '2xl': '1536px', // 기존 1536px 유지
            }
        },
    },
    plugins: [],
}
