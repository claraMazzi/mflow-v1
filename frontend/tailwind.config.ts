import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			body: [
  				'var(--font-noto)'
  			],
  			heading: 'var(--font-exo)'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
  			accent: {
  				'50': '#f7f7f7',
  				'100': '#e3e3e3',
  				'200': '#c6c6c6',
  				'300': '#aaaaaa',
  				'400': '#d9d9d9',
  				'500': '#8e8e8e',
  				'600': '#717171',
  				'700': '#53575a',
  				'800': '#393939',
  				'900': '#1c1c1c',
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			purple: {
  				'50': '#fff4ff',
  				'100': '#fff0ff',
  				'200': '#faebff',
  				'300': '#efdfff',
  				'400': '#ccbde2',
  				'500': '#ad9fc2',
  				'600': '#837597',
  				'700': '#6e6182',
  				'800': '#4e4261',
  				'900': '#2b213d'
  			},
  			green: {
  				'50': '#f4f7ec',
  				'100': '#e5eacf',
  				'200': '#d3dcb2',
  				'300': '#c3ce96',
  				'400': '#b6c480',
  				'500': '#aaba6c',
  				'600': '#9bab63',
  				'700': '#879759',
  				'800': '#748351',
  				'900': '#556142'
  			},
  			pink: {
  				'50': '#f2e8f3',
  				'100': '#e1c5e3',
  				'200': '#d2a2d1',
  				'300': '#c781bf',
  				'400': '#c16baf',
  				'500': '#c05c9f',
  				'600': '#af5796',
  				'700': '#995289',
  				'800': '#834c7b',
  				'900': '#5d4261'
  			},
  			bordo: {
  				'50': '#faebef',
  				'100': '#e4d0d9',
  				'200': '#cdb2bf',
  				'300': '#b694a3',
  				'400': '#a37b8e',
  				'500': '#926379',
  				'600': '#845a6f',
  				'700': '#724d61',
  				'800': '#614255',
  				'900': '#4f3547'
  			},
  			brown: {
  				'50': '#ebebeb',
  				'100': '#cdcdcd',
  				'200': '#b0aca9',
  				'300': '#958983',
  				'400': '#807065',
  				'500': '#6c5749',
  				'600': '#614e42',
  				'700': '#524238',
  				'800': '#43362f',
  				'900': '#342924'
  			},
  			blue: {
  				'0': '#e7f5ff',
  				'5': '#339af0',
  				'9': '#1864ab',
  				'50': '#efedff',
  				'100': '#d1d7f0',
  				'200': '#b8bcd9',
  				'300': '#9da1c3',
  				'400': '#898db1',
  				'500': '#747aa0',
  				'600': '#535877',
  				'700': '#424661',
  				'900': '#2e3149'
  			},
  			grey: {
  				'0': '#f8f9fa',
  				'100': '#f1f3f5',
  				'200': '#e9ecef',
  				'300': '#dee2e6',
  				'400': '#ced4da',
  				'500': '#adb5bd',
  				'600': '#868e96',
  				'700': '#495057',
  				'800': '#343a40',
  				'900': '#212529'
  			},
  			gray: {
  				'0': '#f8f9fa',
  				'3': '#dee2e6',
  				'4': '#ced4da',
  				'5': '#adb5bd',
  				'6': '#868e96',
  				'7': '#495057',
  				'9': '#212529'
  			},
  			red: {
  				'7': '#f03e3e'
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
