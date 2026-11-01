/** A business picks a house once. The pairs are curated so text on them always stays readable. */
export const HOUSES = {
  saffron: { label: 'Saffron', background: '#F2B632', ink: '#2A1B05', font: 'grotesque' },
  gulf: { label: 'Gulf', background: '#0F4C5C', ink: '#F6EEDF', font: 'mono' },
  sage: { label: 'Sage', background: '#C9DDAA', ink: '#1F3317', font: 'serif' },
  oud: { label: 'Oud', background: '#4B2145', ink: '#F3D9B1', font: 'serif' },
  coral: { label: 'Coral', background: '#FF7A59', ink: '#2B0D06', font: 'wide' },
} as const;

export type House = keyof typeof HOUSES;
export const HOUSE_NAMES = Object.keys(HOUSES) as House[];

export const BUSINESS_TYPES = ['Café', 'Restaurant', 'Beauty', 'Fitness', 'Retail', 'Hotel'] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];
