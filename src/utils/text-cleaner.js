import { processVietnameseText } from './vietnamese-processor.js';

// Cache for the word replacement map
let wordReplacementMapCache = null;

// Cache for the acronym map
let acronymMapCache = null;

/**
 * Load and parse the CSV file containing non-Vietnamese word replacements
 * Returns a Map sorted by length (longest first) for proper matching priority
 */
async function loadWordReplacementMap() {
    // Return cached map if already loaded
    if (wordReplacementMapCache !== null) {
        return wordReplacementMapCache;
    }

    try {
        const response = await fetch('/non-vietnamese-words.csv');
        if (!response.ok) {
            console.warn('Failed to load word replacement CSV:', response.statusText);
            wordReplacementMapCache = new Map();
            return wordReplacementMapCache;
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
        wordReplacementMapCache = new Map(sortedEntries);
        return wordReplacementMapCache;
    } catch (error) {
        console.error('Error loading word replacement CSV:', error);
        wordReplacementMapCache = new Map();
        return wordReplacementMapCache;
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
 * Convert acronyms to their Vietnamese transliterations
 * Matches acronyms case-insensitively, handling dots in acronyms (e.g., "tp.hcm")
 */
export async function convertAcronyms(text, acronymMap) {
    if (!text || typeof text !== 'string' || !acronymMap || acronymMap.size === 0) {
        return text;
    }

    let result = text;

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
        result = result.replace(regex, (match) => {
            return transliteration;
        });
    }

    return result;
}

/**
 * Replace non-Vietnamese words with their transliterations
 * Matches whole words/phrases only, processing longest matches first
 */
export async function replaceNonVietnameseWords(text, replacementMap) {
    if (!text || typeof text !== 'string' || !replacementMap || replacementMap.size === 0) {
        return text;
    }

    let result = text;

    // Process each replacement entry (already sorted by length, longest first)
    for (const [original, transliteration] of replacementMap) {
        // Create regex to match whole word/phrase only
        // Escape special regex characters in the original word
        const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // For multi-word phrases, match with word boundaries at start and end
        // For single words, use word boundaries
        const regex = new RegExp(`\\b${escapedOriginal}\\b`, 'gi');
        
        // Replace all occurrences
        result = result.replace(regex, (match) => {
            // Preserve the case of the first letter if it was uppercase
            if (match[0] === match[0].toUpperCase()) {
                return transliteration.charAt(0).toUpperCase() + transliteration.slice(1);
            }
            return transliteration;
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

    // First, clean the text
    const cleanedText = cleanTextForTTS(text);
    console.log('🔊 Cleaned text:', cleanedText);
    // Then, process Vietnamese text (convert numbers, dates, times, etc.)
    const vietnameseProcessedText = processVietnameseText(cleanedText);

    // Load replacement map and replace non-Vietnamese words
    const replacementMap = await loadWordReplacementMap();
    const textAfterWordReplacement = await replaceNonVietnameseWords(vietnameseProcessedText, replacementMap);

    // Finally, load acronym map and convert acronyms
    const acronymMap = await loadAcronymMap();
    const processedText = await convertAcronyms(textAfterWordReplacement, acronymMap);

    return processedText;
}

export function chunkText(text) {
    if (!text || typeof text !== 'string') {
        return [];
    }

    const MIN_CHUNK_LENGTH = 4;
    const MAX_CHUNK_LENGTH = 500;

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

        // First, split the line into sentences based on punctuation followed by whitespace or end of line
        // Using regex with positive lookbehind and lookahead to keep punctuation with the sentence
        const baseSentences = processedLine.split(/(?<=[.!?])(?=\s+|$)/);

        // Then, additionally split at commas (treat commas as soft sentence breaks)
        const sentences = [];
        for (const base of baseSentences) {
            const commaSplit = base.split(/,(?=\s+|$)/);
            for (const part of commaSplit) {
                const trimmedPart = part.trim();
                if (trimmedPart) {
                    sentences.push(trimmedPart);
                }
            }
        }

        // Process sentences and combine short ones
        let currentChunk = '';

        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (!trimmedSentence) continue;

            // If this sentence alone exceeds max length, split it at word boundaries
            if (trimmedSentence.length > MAX_CHUNK_LENGTH) {
                // Add current chunk if exists
                if (currentChunk) {
                    chunks.push(currentChunk);
                    currentChunk = '';
                }

                // Split long sentence at word boundaries
                const words = trimmedSentence.split(' ');
                let longChunk = '';

                for (const word of words) {
                    const potentialLongChunk = longChunk + (longChunk ? ' ' : '') + word;
                    if (potentialLongChunk.length <= MAX_CHUNK_LENGTH) {
                        longChunk = potentialLongChunk;
                    } else {
                        if (longChunk) {
                            chunks.push(longChunk);
                        }
                        longChunk = word;
                    }
                }

                if (longChunk) {
                    currentChunk = longChunk;
                }
                continue;
            }

            // If adding this sentence would exceed max length, finalize current chunk
            const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + trimmedSentence;

            if (potentialChunk.length > MAX_CHUNK_LENGTH) {
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                currentChunk = trimmedSentence;
            } else if (potentialChunk.length < MIN_CHUNK_LENGTH) {
                currentChunk = potentialChunk;
            } else {
                // Chunk is between min and max length
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                currentChunk = trimmedSentence;
            }
        }

        // Add any remaining chunk
        if (currentChunk) {
            chunks.push(currentChunk);
        }
    }
    console.log('🔊 Chunks:', chunks);
    return chunks;
}
