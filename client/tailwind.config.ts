import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
  	extend: {
		fontFamily: {
			cinzel: ['var(--font-cinzel)', 'serif']
		},
  		colors: {
  			placeholderColor: {
  				white: '#FFFFFF'
  			},
  			colors: {
  				gray: {
  					'500': '#71717A'
  				}
  			},
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
			player: {
				accent: 'hsl(var(--player-accent))'
			},
			bnr: {
				abyss: 'hsl(var(--bnr-abyss))',
				gunmetal: 'hsl(var(--bnr-gunmetal))',
				violet: 'hsl(var(--bnr-violet))',
				lilac: 'hsl(var(--bnr-lilac))',
				bone: 'hsl(var(--bnr-bone))',
				ash: 'hsl(var(--bnr-ash))'
				,
				surface: 'hsl(var(--bnr-surface))',
				raised: 'hsl(var(--bnr-raised))',
				line: 'hsl(var(--bnr-line))',
				glow: 'hsl(var(--bnr-glow))'
			},
			sidebar: {
				canvas: 'hsl(var(--sidebar-canvas))',
				surface: 'hsl(var(--sidebar-surface))',
				accent: 'hsl(var(--sidebar-accent))',
				lilac: 'hsl(var(--sidebar-lilac))',
				foreground: 'hsl(var(--sidebar-foreground))',
				muted: 'hsl(var(--sidebar-muted))'
			},
			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
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
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	},
  	variants: {
  		extend: {
  			placeholderColor: ["responsive", "hover", "focus"]
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
