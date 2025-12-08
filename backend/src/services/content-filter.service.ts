// @ts-ignore - bad-words has incorrect type definitions
import Filter from 'bad-words';

class ContentFilterService {
  private filter: any;

  constructor() {
    // @ts-ignore - bad-words constructor works at runtime
    this.filter = new Filter();
  }

  /**
   * Checks if a text contains inappropriate content.
   * @param text The text to check.
   * @returns True if the text contains inappropriate content, false otherwise.
   */
  isProfane(text: string): boolean {
    return this.filter.isProfane(text);
  }

  /**
   * Cleans a text by replacing inappropriate words with placeholders.
   * @param text The text to clean.
   * @returns The cleaned text.
   */
  clean(text: string): string {
    return this.filter.clean(text);
  }

  /**
   * Adds new words to the filter.
   * @param words The words to add.
   */
  addWords(...words: string[]): void {
    this.filter.addWords(...words);
  }
}

export const _contentFilterService = new ContentFilterService();
