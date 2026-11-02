import { useTheme } from '../../context/ThemeContext';

const PALETTES = {
  dark: { income: '#34D37B', expense: '#FF7A6E', savings: '#F5C542', grid: 'rgba(247,244,237,0.09)', axis: '#A0C0B1', cursor: 'rgba(247,244,237,0.06)', ring: '#0F4A38' },
  light: { income: '#008C44', expense: '#CD3E32', savings: '#B07600', grid: 'rgba(11,61,46,0.1)', axis: '#5C756A', cursor: 'rgba(11,61,46,0.05)', ring: '#FFFFFC' },
};
export const useChartColors = () => PALETTES[useTheme().theme];
