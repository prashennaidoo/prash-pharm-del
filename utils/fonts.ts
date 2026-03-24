/**
 * Utility function to get Poppins font family based on fontWeight
 * This helps convert React Native fontWeight values to Poppins font families
 */
import { Fonts } from '@/constants/theme';

export function getPoppinsFont(fontWeight?: string | number): string {
  if (!fontWeight) {
    return Fonts.regular;
  }

  // Handle numeric fontWeight values
  const weight = typeof fontWeight === 'string' ? fontWeight : String(fontWeight);
  
  // Map common fontWeight values to Poppins variants
  switch (weight) {
    case '100':
    case 'thin':
      return Fonts.thin;
    case '200':
    case 'extraLight':
      return Fonts.extraLight;
    case '300':
    case 'light':
      return Fonts.light;
    case '400':
    case 'normal':
    case 'regular':
      return Fonts.regular;
    case '500':
    case 'medium':
      return Fonts.medium;
    case '600':
    case 'semiBold':
      return Fonts.semiBold;
    case '700':
    case 'bold':
      return Fonts.bold;
    case '800':
    case 'extraBold':
      return Fonts.extraBold;
    case '900':
    case 'black':
      return Fonts.black;
    default:
      return Fonts.regular;
  }
}








