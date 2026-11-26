import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['"DM Sans"', ...defaultTheme.fontFamily.sans],
                display: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
                public: ['"DM Sans"', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                brand: {
                    navy: '#0B2C59',
                    blue: '#004A99',
                    gold: '#FACC15',
                },
                indigo: colors.blue,
                purple: colors.blue,
                violet: colors.blue,
                blue: colors.blue,
                sky: colors.blue,
            },
        },
    },

    plugins: [forms],
};
