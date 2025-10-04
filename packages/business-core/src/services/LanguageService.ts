import i18n from '../i18n/i18n';
import { Logger } from './Logger';

export interface LanguageConfig {
  supportedLanguages: string[];
  defaultLanguage: string;
  fallbackLanguage: string;
}

export class LanguageService {
  private static instance: LanguageService;
  private config: LanguageConfig;

  private constructor(config?: Partial<LanguageConfig>) {
    this.config = {
      supportedLanguages: ['en', 'es'],
      defaultLanguage: 'en',
      fallbackLanguage: 'en',
      ...config,
    };
  }

  public static getInstance(config?: Partial<LanguageConfig>): LanguageService {
    if (!LanguageService.instance) {
      LanguageService.instance = new LanguageService(config);
    }
    return LanguageService.instance;
  }

  /**
   * Get the current language
   */
  public getCurrentLanguage(): string {
    return i18n.language || this.config.defaultLanguage;
  }

  /**
   * Set the application language
   */
  public async setLanguage(language: string): Promise<void> {
    try {
      if (!this.config.supportedLanguages.includes(language)) {
        Logger.warn(`Language ${language} is not supported. Using fallback.`, 'LanguageService');
        language = this.config.fallbackLanguage;
      }

      await i18n.changeLanguage(language);
      Logger.info(`Language changed to: ${language}`, 'LanguageService');
    } catch (error) {
      Logger.error('Failed to change language:', error, 'LanguageService');
      throw error;
    }
  }

  /**
   * Get all supported languages
   */
  public getSupportedLanguages(): string[] {
    return [...this.config.supportedLanguages];
  }

  /**
   * Check if a language is supported
   */
  public isLanguageSupported(language: string): boolean {
    return this.config.supportedLanguages.includes(language);
  }

  /**
   * Get language display name
   */
  public getLanguageDisplayName(language: string): string {
    const languageNames: Record<string, string> = {
      en: 'English',
      es: 'Español',
    };
    return languageNames[language] || language;
  }

  /**
   * Get language flag emoji
   */
  public getLanguageFlag(language: string): string {
    const flags: Record<string, string> = {
      en: '🇺🇸',
      es: '🇪🇸',
    };
    return flags[language] || '🌐';
  }

  /**
   * Initialize the language service
   */
  public async initialize(): Promise<void> {
    try {
      // Set default language if not already set
      if (!i18n.language) {
        await this.setLanguage(this.config.defaultLanguage);
      }

      Logger.info('LanguageService initialized successfully', 'LanguageService');
    } catch (error) {
      Logger.error('Failed to initialize LanguageService:', error, 'LanguageService');
      throw error;
    }
  }

  /**
   * Get translation for a key
   */
  public t(key: string, options?: any): string {
    return i18n.t(key, options);
  }

  /**
   * Get translation with interpolation
   */
  public translate(key: string, values?: Record<string, any>): string {
    return i18n.t(key, values);
  }

  /**
   * Get all translations for current language
   */
  public getAllTranslations(): Record<string, any> {
    return i18n.getDataByLanguage(this.getCurrentLanguage()) || {};
  }

  /**
   * Check if translations are loaded
   */
  public areTranslationsLoaded(): boolean {
    return i18n.isInitialized;
  }

  /**
   * Get language direction (LTR/RTL)
   */
  public getLanguageDirection(language?: string): 'ltr' | 'rtl' {
    const lang = language || this.getCurrentLanguage();
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
  }

  /**
   * Format date according to language locale
   */
  public formatDate(date: Date, language?: string): string {
    const lang = language || this.getCurrentLanguage();
    const locale = lang === 'es' ? 'es-ES' : 'en-US';
    
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  /**
   * Format number according to language locale
   */
  public formatNumber(number: number, language?: string): string {
    const lang = language || this.getCurrentLanguage();
    const locale = lang === 'es' ? 'es-ES' : 'en-US';
    
    return new Intl.NumberFormat(locale).format(number);
  }

  /**
   * Format currency according to language locale
   */
  public formatCurrency(amount: number, currency: string = 'USD', language?: string): string {
    const lang = language || this.getCurrentLanguage();
    const locale = lang === 'es' ? 'es-ES' : 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }
}
