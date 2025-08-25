/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx}",
    ],
    theme: {
        extend: {
            colors: {
                green: '#00BE2C', // Fixed hex color code
                primaryColor: '#ff7d27', // Fixed hex color code
                secondaryColor: '#ffe7d2', // Fixed hex color code
                thirdPartyColor: '#fff7f1', // Fixed hex color code
                fourthColor: '#FFF7F1',
                other1: '#003151', // Fixed hex color code
                other2: '#ff994e', // Fixed hex color code
                other3: '#ffb659', // Fixed hex color code
                red: "#FF5C3F", // Red color in hex
                white: '#ffffff', // White color in hex
                // gray: "#F5F5F5",
                darkGray: '#707070',
                darkestGray: '#6b7280',
                gray_200: '#9BA9B2',
                slate:'#F6F6F6',
                border:'CCD6DC',
                text:'#7B8184',
                bgsecond:'#EBEBEB'
            },
            fontFamily: {
                poppins: ['Poppins', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
