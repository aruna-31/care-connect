/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    500: '#8cb0c0', // Beige Blue
                    600: '#7ea3b5',
                },
                accent: {
                    500: '#f7d6e0', // Light Pink
                },
                beige: {
                    50: '#fdfbf7', // Cream background
                },
            },
            fontFamily: {
                sans: ['Outfit', 'Inter', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.6s ease-out forwards',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
}
