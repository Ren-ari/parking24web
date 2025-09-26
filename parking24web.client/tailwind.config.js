/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./index.html"
    ],
    theme: {
        extend: {
            screens: {
                // 아이패드 프로 가로모드(1366px)에서도 태블릿 모드로 유지
                'xl': '1400px',  // 기존 1280px에서 1400px로 증가
                '2xl': '1536px', // 기존 1536px 유지
            }
        },
    },
    plugins: [],
}
