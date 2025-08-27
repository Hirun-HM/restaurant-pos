/** @type {import('tailwindc                gray: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#003151', // Using other1 for gray-800
                    900: '#003151', // Using other1 for darkest gray
                } */
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
                secondaryColor: '#003151', // Changed from black to other1 color
                thirdPartyColor: '#FFF9C4', // Light yellow tint
                fourthColor: '#FFFDE7', // Very light yellow tint
                other1: '#003151',
                other2: '#ff994e',
                other3: '#ffb659',
                red: "#FF5C3F",
                white: '#ffffff',
                black: '#003151', // Override default black with other1 color
                darkGray: '#707070',
                darkestGray: '#6b7280',
                gray_200: '#9BA9B2',
                slate: '#F6F6F6',
                border: '#CCD6DC',
                text: '#7B8184',
                bgsecond: '#EBEBEB',
                // Additional gray scale using other1 as base
                gray: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b', // Medium dark
                    900: '#003151', // Using other1 for darkest gray
                }
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
