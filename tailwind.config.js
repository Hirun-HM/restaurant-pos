/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                green: '#00BE2C',
                primaryColor: '#FFD700', // Yellow as primary color
                secondaryColor: '#000000', // Black as secondary color
                thirdPartyColor: '#FFF9C4', // Light yellow tint
                fourthColor: '#FFFDE7', // Very light yellow tint
                other1: '#003151',
                other2: '#ff994e',
                other3: '#ffb659',
                red: "#FF5C3F",
                white: '#ffffff',
                darkGray: '#707070',
                darkestGray: '#6b7280',
                gray_200: '#9BA9B2',
                slate: '#F6F6F6',
                border: '#CCD6DC',
                text: '#7B8184',
                bgsecond: '#EBEBEB'
            },

            fontFamily: {
                poppins: ['Poppins', 'sans-serif'],
            },

            keyframes: {
                fadeInScale: {
                    '0%': {
                        opacity: '0',
                        transform: 'scale(0.9) translateY(-10px)'
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'scale(1) translateY(0)'
                    }
                }
            },

            animation: {
                fadeInScale: 'fadeInScale 0.3s ease-out forwards'
            }
        },
    },
    plugins: [],
}
