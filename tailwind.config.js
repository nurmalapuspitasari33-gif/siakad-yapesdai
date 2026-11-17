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
                sans: ['Plus Jakarta Sans', ...defaultTheme.fontFamily.sans],
                public: ['Plus Jakarta Sans', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                indigo: colors.emerald,
                purple: colors.emerald,
                violet: colors.emerald,
                blue: colors.teal,
                sky: colors.teal,
            },
        },
    },

    plugins: [forms],
};
