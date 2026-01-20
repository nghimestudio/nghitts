import { processVietnameseText } from './vietnamese-processor.js';
import { transliterateWord } from './transliterator.js';
import { isVietnameseWord } from './vietnamese-detector.js';

// Cache for the acronym map
let acronymMapCache = null;

// Cache for the config
let configCache = null;

/**
 * Load and parse the CSV file containing non-Vietnamese word replacements
 * Returns a Map sorted by length (longest first) for proper matching priority
 * Note: This function does NOT cache the result - it always fetches fresh data
 */
async function loadWordReplacementMap() {
    try {
        const response = await fetch('/non-vietnamese-words.csv');
        if (!response.ok) {
            console.warn('Failed to load word replacement CSV:', response.statusText);
            return new Map();
        }

        const csvText = await response.text();
        const lines = csvText.split('\n');
        const replacementMap = new Map();

        // Skip header row (line 0)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Parse CSV line (handle commas within quoted fields if needed)
            const match = line.match(/^([^,]+),(.+)$/);
            if (match) {
                const original = match[1].trim().toLowerCase();
                const transliteration = match[2].trim();
                if (original && transliteration) {
                    replacementMap.set(original, transliteration);
                }
            }
        }

        // Sort entries by length (longest first) and create a sorted array
        const sortedEntries = Array.from(replacementMap.entries())
            .sort((a, b) => b[0].length - a[0].length);

        // Create a new Map with sorted entries
        return new Map(sortedEntries);
    } catch (error) {
        console.error('Error loading word replacement CSV:', error);
        return new Map();
    }
}

/**
 * Load and parse the CSV file containing acronym replacements
 * Returns a Map sorted by length (longest first) for proper matching priority
 */
async function loadAcronymMap() {
    // Return cached map if already loaded
    if (acronymMapCache !== null) {
        return acronymMapCache;
    }

    try {
        const response = await fetch('/acronyms.csv');
        if (!response.ok) {
            console.warn('Failed to load acronym CSV:', response.statusText);
            acronymMapCache = new Map();
            return acronymMapCache;
        }

        const csvText = await response.text();
        const lines = csvText.split('\n');
        const acronymMap = new Map();

        // Skip header row (line 0)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Parse CSV line (handle commas within quoted fields if needed)
            const match = line.match(/^([^,]+),(.+)$/);
            if (match) {
                const acronym = match[1].trim();
                const transliteration = match[2].trim();
                if (acronym && transliteration) {
                    // Store lowercase for case-insensitive matching
                    acronymMap.set(acronym.toLowerCase(), transliteration);
                }
            }
        }

        // Sort entries by length (longest first) and create a sorted array
        const sortedEntries = Array.from(acronymMap.entries())
            .sort((a, b) => b[0].length - a[0].length);

        // Create a new Map with sorted entries
        acronymMapCache = new Map(sortedEntries);
        return acronymMapCache;
    } catch (error) {
        console.error('Error loading acronym CSV:', error);
        acronymMapCache = new Map();
        return acronymMapCache;
    }
}

/**
 * Load configuration file
 * Returns cached config if already loaded
 */
export async function loadConfig() {
    if (configCache !== null) {
        return configCache;
    }

    try {
        // Import config as a module (since it's in src/ folder, it will be bundled)
        const configModule = await import('../config.json');
        configCache = configModule.default || configModule;
        return configCache;
    } catch (error) {
        console.warn('Failed to load config, using defaults:', error);
        // Default to enabled if config can't be loaded
        configCache = { enableTransliteration: true, debug: false };
        return configCache;
    }
}

/**
 * Check if debug mode is enabled
 * @param {object} config - Configuration object
 * @returns {boolean} - True if debug is enabled
 */
export function isDebugEnabled(config) {
    return config && config.debug === true;
}

/**
 * Debug log helper
 * @param {object} config - Configuration object
 * @param {string} step - Step name
 * @param {object} data - Data to log
 */
export function debugLog(config, step, data) {
    if (isDebugEnabled(config)) {
        console.log(`[DEBUG] ${step}:`, data);
    }
}

/**
 * Apply transliteration to words not in the replacement map
 * Only processes words that weren't replaced by CSV and aren't Vietnamese
 * @param {string} text - Text to process
 * @param {Map} replacementMap - Map of words that were already replaced
 * @param {object} config - Configuration object for debug logging
 * @returns {string} - Text with transliterated words
 */
function applyTransliteration(text, replacementMap, config = null) {
    if (!text || typeof text !== 'string') {
        return text;
    }

    // Split text into tokens (words and non-word characters like punctuation/whitespace)
    // Use a regex that properly handles Vietnamese diacritics WITHOUT word boundaries
    // Match sequences of word characters including Vietnamese letters with diacritics
    // Use negative lookbehind/lookahead to ensure we match complete words
    // Pattern: Match word chars (including Vietnamese) that are:
    // - At start of string OR preceded by non-word char
    // - Followed by end of string OR non-word char
    const wordBoundaryRegex = /(?:^|[^\w\u00C0-\u1EFF])([\w\u00C0-\u1EFF]+)(?=[^\w\u00C0-\u1EFF]|$)/g;
    let result = text;
    const processedWords = new Set();
    const transliteratedWords = [];

    // Find all words and process them
    let match;
    const textCopy = text; // Create a copy to avoid regex state issues
    while ((match = wordBoundaryRegex.exec(textCopy)) !== null) {
        const word = match[1];
        const wordLower = word.toLowerCase();
        
        // Skip if already processed (avoid duplicate processing)
        if (processedWords.has(wordLower)) {
            continue;
        }
        processedWords.add(wordLower);

        // Skip if word is in replacement map (was already replaced by CSV)
        if (replacementMap.has(wordLower)) {
            if (isDebugEnabled(config)) {
                debugLog(config, 'Transliteration', { 
                    word, 
                    action: 'SKIPPED (in CSV map)' 
                });
            }
            continue;
        }

        // Skip if word is Vietnamese - check BOTH original and lowercase versions
        const isVietnameseOriginal = isVietnameseWord(word);
        const isVietnameseLower = isVietnameseWord(wordLower);
        const isVietnamese = isVietnameseOriginal || isVietnameseLower;
        
        if (isVietnamese) {
            if (isDebugEnabled(config)) {
                debugLog(config, 'Transliteration', { 
                    word, 
                    action: 'SKIPPED (Vietnamese)',
                    hasDiacritics: /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(word)
                });
            }
            continue;
        }

        // Apply transliteration
        const transliterated = transliterateWord(word);
        transliteratedWords.push({ word, transliterated });
        
        // Replace all occurrences of this word (case-insensitive) with transliterated version
        // Use word boundaries to ensure we only replace whole words
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
        
        result = result.replace(regex, (matched) => {
            // Preserve original case pattern
            if (matched[0] === matched[0].toUpperCase()) {
                return transliterated.charAt(0).toUpperCase() + transliterated.slice(1);
            }
            return transliterated;
        });
    }

    if (isDebugEnabled(config) && transliteratedWords.length > 0) {
        debugLog(config, 'Transliteration', {
            totalWords: transliteratedWords.length,
            words: transliteratedWords
        });
    }

    return result;
}

/**
 * Convert acronyms to their Vietnamese transliterations
 * Matches acronyms case-insensitively, handling dots in acronyms (e.g., "tp.hcm")
 * @param {string} text - Text to process
 * @param {Map} acronymMap - Map of acronym replacements
 * @param {object} config - Configuration object for debug logging
 * @returns {string} - Text with converted acronyms
 */
export async function convertAcronyms(text, acronymMap, config = null) {
    if (!text || typeof text !== 'string' || !acronymMap || acronymMap.size === 0) {
        return text;
    }

    let result = text;
    const convertedAcronyms = [];

    // Process each acronym entry (already sorted by length, longest first)
    for (const [acronym, transliteration] of acronymMap) {
        // Escape special regex characters in the acronym
        // Note: dots in acronyms (e.g., "tp.hcm") should match literal dots, so we don't escape them
        const escapedAcronym = acronym.replace(/[+?^${}()|[\]\\]/g, '\\$&');
        // Dots are not escaped - they match literal dots
        
        // Create regex for case-insensitive matching
        // Use word boundaries - they work correctly with dots (dot is non-word char)
        // Pattern: word boundary + acronym + word boundary
        // For "tp.hcm", \b matches before 't' and after 'm', dot is non-word so it's fine
        const regex = new RegExp(`\\b${escapedAcronym}\\b`, 'gi');
        
        // Replace all occurrences
        const beforeReplace = result;
        result = result.replace(regex, (match) => {
            return transliteration;
        });
        
        // Track conversions for debug
        if (isDebugEnabled(config) && beforeReplace !== result) {
            convertedAcronyms.push({ acronym, transliteration });
        }
    }

    if (isDebugEnabled(config) && convertedAcronyms.length > 0) {
        debugLog(config, 'Acronym Conversion', {
            totalConversions: convertedAcronyms.length,
            acronyms: convertedAcronyms
        });
    }

    return result;
}

/**
 * Replace non-Vietnamese words with their transliterations
 * Matches whole words/phrases only, processing longest matches first
 * @param {string} text - Text to process
 * @param {Map} replacementMap - Map of word replacements
 * @param {object} config - Configuration object for debug logging
 * @returns {string} - Text with replaced words
 */
export async function replaceNonVietnameseWords(text, replacementMap, config = null) {
    if (!text || typeof text !== 'string' || !replacementMap || replacementMap.size === 0) {
        return text;
    }

    let result = text;
    const replacedWords = [];

    // Process each replacement entry (already sorted by length, longest first)
    for (const [original, transliteration] of replacementMap) {
        // Create regex to match whole word/phrase only
        // Escape special regex characters in the original word
        const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // For multi-word phrases, match with word boundaries at start and end
        // For single words, use word boundaries
        const regex = new RegExp(`\\b${escapedOriginal}\\b`, 'gi');
        
        // Replace all occurrences
        const beforeReplace = result;
        result = result.replace(regex, (match) => {
            // Preserve the case of the first letter if it was uppercase
            if (match[0] === match[0].toUpperCase()) {
                return transliteration.charAt(0).toUpperCase() + transliteration.slice(1);
            }
            return transliteration;
        });
        
        // Track replacements for debug
        if (isDebugEnabled(config) && beforeReplace !== result) {
            replacedWords.push({ original, transliteration });
        }
    }

    if (isDebugEnabled(config) && replacedWords.length > 0) {
        debugLog(config, 'CSV Word Replacement', {
            totalReplacements: replacedWords.length,
            words: replacedWords.slice(0, 20) // Limit to first 20 for readability
        });
    }

    return result;
}

export function cleanTextForTTS(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    // Remove emojis using Unicode ranges
    // This regex covers most common emoji ranges
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE0F}]|[\u{200D}]/gu;

    const cleanedText = text.replace(emojiRegex, '')
        //.replace(/\b\/\b/, ' slash ')
        .replace(/[\\()¯]/g, '')
        .replace(/["""]/g, '')
        .replace(/\s—/g, '.')
        .replace(/\b_\b/g, ' ')
        // Remove dashes but preserve those between numbers (for date ranges like 25-26, year ranges like 1873-1907)
        .replace(/(?<!\d)-(?!\d)/g, ' ')
        // Remove non-Latin characters (keep basic Latin, Latin Extended, Vietnamese characters, numbers, punctuation, and whitespace)
        .replace(/[^\u0000-\u024F\u1E00-\u1EFF]/g, '');
    return cleanedText.trim();
}

/**
 * Process text for TTS: clean text, process Vietnamese text, then replace non-Vietnamese words
 * This is the main function that should be called before chunking
 */
export async function processTextForTTS(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    // Load config first for debug logging
    const config = await loadConfig();
    
    if (isDebugEnabled(config)) {
        debugLog(config, 'Preprocessing Start', { originalText: text });
    }

    // First, clean the text
    const cleanedText = cleanTextForTTS(text);
    if (isDebugEnabled(config)) {
        debugLog(config, 'Step 1: Text Cleaning', { 
            before: text, 
            after: cleanedText 
        });
    }

    // Then, process Vietnamese text (convert numbers, dates, times, etc.)
    const vietnameseProcessedText = processVietnameseText(cleanedText);
    if (isDebugEnabled(config)) {
        debugLog(config, 'Step 2: Vietnamese Processing', { 
            before: cleanedText, 
            after: vietnameseProcessedText 
        });
    }

    // Normalize to lowercase for consistent matching of non-Vietnamese words and acronyms
    const mappingInput = vietnameseProcessedText.toLowerCase();
    if (isDebugEnabled(config)) {
        debugLog(config, 'Step 2.5: Lowercase Normalization', { 
            before: vietnameseProcessedText, 
            after: mappingInput 
        });
    }

    // Load replacement map
    const replacementMap = await loadWordReplacementMap();
    if (isDebugEnabled(config)) {
        debugLog(config, 'CSV Map Loaded', { 
            totalEntries: replacementMap.size 
        });
    }
    
    // Step 3: Replace non-Vietnamese words from CSV FIRST
    // This ensures CSV entries take priority over transliteration
    const textAfterWordReplacement = await replaceNonVietnameseWords(mappingInput, replacementMap, config);
    if (isDebugEnabled(config)) {
        debugLog(config, 'Step 3: CSV Word Replacement', { 
            before: mappingInput, 
            after: textAfterWordReplacement 
        });
    }
    
    // Step 3.5: Apply transliteration to words not in CSV (if enabled)
    // This happens AFTER CSV replacement so we only transliterate words that weren't replaced
    let textAfterTransliteration = textAfterWordReplacement;
    if (config.enableTransliteration) {
        textAfterTransliteration = applyTransliteration(textAfterWordReplacement, replacementMap, config);
        if (isDebugEnabled(config)) {
            debugLog(config, 'Step 3.5: Transliteration', { 
                before: textAfterWordReplacement, 
                after: textAfterTransliteration,
                enabled: true
            });
        }
    } else if (isDebugEnabled(config)) {
        debugLog(config, 'Step 3.5: Transliteration', { 
            enabled: false,
            skipped: true
        });
    }

    // Finally, load acronym map and convert acronyms
    const acronymMap = await loadAcronymMap();
    if (isDebugEnabled(config)) {
        debugLog(config, 'Acronym Map Loaded', { 
            totalEntries: acronymMap.size 
        });
    }
    const processedText = await convertAcronyms(textAfterTransliteration, acronymMap, config);
    if (isDebugEnabled(config)) {
        debugLog(config, 'Step 4: Acronym Conversion', { 
            before: textAfterWordReplacement, 
            after: processedText 
        });
    }

    if (isDebugEnabled(config)) {
        debugLog(config, 'Preprocessing Complete', { 
            original: text, 
            final: processedText 
        });
    }

    return processedText;
}

export async function chunkText(text) {
    if (!text || typeof text !== 'string') {
        return [];
    }

    // Load config for debug logging
    const config = await loadConfig();

    if (isDebugEnabled(config)) {
        debugLog(config, 'Step 5: Text Chunking Start', { 
            inputText: text,
            inputLength: text.length
        });
    }

    // First, split by newlines
    const lines = text.split('\n');
    const chunks = [];

    for (const line of lines) {
        // Skip empty lines
        if (line.trim() === '') continue;

        // Check if the line already ends with punctuation
        const endsWithPunctuation = /[.!?]$/.test(line.trim());

        // If it doesn't end with punctuation and it's not empty, add a period
        const processedLine = endsWithPunctuation ? line : line.trim() + '.';

        // Split the line into sentences based on punctuation followed by whitespace or end of line
        // Using regex with positive lookbehind and lookahead to keep punctuation with the sentence
        // Commas are NOT used for splitting - they stay within sentences
        const sentences = processedLine.split(/(?<=[.!?])(?=\s+|$)/);

        // Each sentence becomes its own chunk (no combining)
        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (trimmedSentence) {
                chunks.push(trimmedSentence);
            }
        }
    }

    if (isDebugEnabled(config)) {
        debugLog(config, 'Step 5: Text Chunking Complete', {
            totalChunks: chunks.length,
            chunks: chunks.map((chunk, idx) => ({
                index: idx + 1,
                text: chunk,
                length: chunk.length
            }))
        });
    }

    return chunks;
}
