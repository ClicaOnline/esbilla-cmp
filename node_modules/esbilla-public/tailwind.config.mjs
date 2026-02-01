/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
	theme: {
		extend: {
			colors: {
				'maiz': '#FFBF00',      // Oru pa les panoyes
				'madera': '#3D2B1F',    // Marrón pal horru
				'piedra': '#78716c',    // Gris pa los pegollos
				'fondu': '#F8F5F2',     // Color crema/cal
			},
			fontFamily: {
				'artesana': ['Instrument Serif', 'serif'],
				'moderna': ['Inter', 'sans-serif'],
			},
		},
	},
	plugins: [],
}