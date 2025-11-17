import i18n from '../config/i18n';

/**
 * Get translator for a specific language
 * @param language - Language code (bg, en)
 * @returns Translation function
 */
export function getEmailTranslator(language: string = 'bg') {
  // Create a cloned instance with fixed language
  const t = i18n.getFixedT(language);
  return t;
}

/**
 * Get user's preferred language from user object or default to Bulgarian
 * @param user - User object with optional language field
 * @returns Language code
 */
export function getUserLanguage(user: { language?: string } | null | undefined): string {
  return user?.language || 'bg';
}
