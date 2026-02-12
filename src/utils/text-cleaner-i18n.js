export function cleanTextForTTS(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    // Remove emojis using Unicode ranges
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE0F}]|[\u{200D}]/gu;

    const cleanedText = text.replace(emojiRegex, '')
        .replace(/\b\/\b/, ' slash ')
        .replace(/[\/\\()¯]/g, '')
        .replace(/["""]/g, '')
        .replace(/\s—/g, '.')
        .replace(/\b_\b/g, ' ')
        .replace(/\b-\b/g, ' ')
        .replace(/[^\u0000-\u024F]/g, '');

    return cleanedText.trim();
}

export function chunkText(text) {
    if (!text || typeof text !== 'string') {
        return [];
    }

    const MIN_CHUNK_LENGTH = 4;
    const MAX_CHUNK_LENGTH = 500;

    const lines = text.split('\n');
    const chunks = [];

    for (const line of lines) {
        if (line.trim() === '') continue;

        const endsWithPunctuation = /[.!?]$/.test(line.trim());
        const processedLine = endsWithPunctuation ? line : line.trim() + '.';
        const sentences = processedLine.split(/(?<=[.!?])(?=\s+|$)/);

        let currentChunk = '';

        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (!trimmedSentence) continue;

            if (trimmedSentence.length > MAX_CHUNK_LENGTH) {
                if (currentChunk) {
                    chunks.push(currentChunk);
                    currentChunk = '';
                }

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

            const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + trimmedSentence;

            if (potentialChunk.length > MAX_CHUNK_LENGTH) {
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                currentChunk = trimmedSentence;
            } else if (potentialChunk.length < MIN_CHUNK_LENGTH) {
                currentChunk = potentialChunk;
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                currentChunk = trimmedSentence;
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk);
        }
    }

    return chunks;
}
