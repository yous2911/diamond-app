"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentFilterService = void 0;
const bad_words_1 = __importDefault(require("bad-words"));
class ContentFilterService {
    constructor() {
        this.filter = new bad_words_1.default();
    }
    /**
     * Checks if a text contains inappropriate content.
     * @param text The text to check.
     * @returns True if the text contains inappropriate content, false otherwise.
     */
    isProfane(text) {
        return this.filter.isProfane(text);
    }
    /**
     * Cleans a text by replacing inappropriate words with placeholders.
     * @param text The text to clean.
     * @returns The cleaned text.
     */
    clean(text) {
        return this.filter.clean(text);
    }
    /**
     * Adds new words to the filter.
     * @param words The words to add.
     */
    addWords(...words) {
        this.filter.addWords(...words);
    }
}
exports.contentFilterService = new ContentFilterService();
