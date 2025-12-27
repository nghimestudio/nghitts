// Vietnamese number words
const DIGITS = {
    '0': 'không', '1': 'một', '2': 'hai', '3': 'ba', '4': 'bốn',
    '5': 'năm', '6': 'sáu', '7': 'bảy', '8': 'tám', '9': 'chín'
};

const TEENS = {
    '10': 'mười', '11': 'mười một', '12': 'mười hai', '13': 'mười ba',
    '14': 'mười bốn', '15': 'mười lăm', '16': 'mười sáu', '17': 'mười bảy',
    '18': 'mười tám', '19': 'mười chín'
};

const TENS = {
    '2': 'hai mươi', '3': 'ba mươi', '4': 'bốn mươi', '5': 'năm mươi',
    '6': 'sáu mươi', '7': 'bảy mươi', '8': 'tám mươi', '9': 'chín mươi'
};

/**
 * Convert a number string to Vietnamese words.
 * Handles numbers from 0 to billions.
 */
function numberToWords(numStr) {
    // Remove leading zeros but keep at least one digit
    numStr = numStr.replace(/^0+/, '') || '0';
    
    // Handle negative numbers
    if (numStr.startsWith('-')) {
        return 'âm ' + numberToWords(numStr.substring(1));
    }
    
    // Convert to integer for processing
    let num;
    try {
        num = parseInt(numStr, 10);
    } catch (e) {
        return numStr;
    }
    
    if (num === 0) {
        return 'không';
    }
    
    if (num < 10) {
        return DIGITS[String(num)];
    }
    
    if (num < 20) {
        return TEENS[String(num)];
    }
    
    if (num < 100) {
        const tens = Math.floor(num / 10);
        const units = num % 10;
        if (units === 0) {
            return TENS[String(tens)];
        } else if (units === 1) {
            return TENS[String(tens)] + ' mốt';
        } else if (units === 4) {
            return TENS[String(tens)] + ' tư';
        } else if (units === 5) {
            return TENS[String(tens)] + ' lăm';
        } else {
            return TENS[String(tens)] + ' ' + DIGITS[String(units)];
        }
    }
    
    if (num < 1000) {
        const hundreds = Math.floor(num / 100);
        const remainder = num % 100;
        let result = DIGITS[String(hundreds)] + ' trăm';
        if (remainder === 0) {
            return result;
        } else if (remainder < 10) {
            return result + ' lẻ ' + DIGITS[String(remainder)];
        } else {
            return result + ' ' + numberToWords(String(remainder));
        }
    }
    
    if (num < 1000000) {
        const thousands = Math.floor(num / 1000);
        const remainder = num % 1000;
        let result = numberToWords(String(thousands)) + ' nghìn';
        if (remainder === 0) {
            return result;
        } else if (remainder < 100) {
            // Use "lẻ" when remainder < 10 (tens digit is 0)
            if (remainder < 10) {
                return result + ' không trăm lẻ ' + DIGITS[String(remainder)];
            } else {
                return result + ' không trăm ' + numberToWords(String(remainder));
            }
        } else {
            return result + ' ' + numberToWords(String(remainder));
        }
    }
    
    if (num < 1000000000) {
        const millions = Math.floor(num / 1000000);
        const remainder = num % 1000000;
        let result = numberToWords(String(millions)) + ' triệu';
        if (remainder === 0) {
            return result;
        } else if (remainder < 100) {
            // Use "lẻ" when remainder < 10 (tens digit is 0)
            if (remainder < 10) {
                return result + ' không trăm lẻ ' + DIGITS[String(remainder)];
            } else {
                return result + ' không trăm ' + numberToWords(String(remainder));
            }
        } else {
            return result + ' ' + numberToWords(String(remainder));
        }
    }
    
    if (num < 1000000000000) {
        const billions = Math.floor(num / 1000000000);
        const remainder = num % 1000000000;
        let result = numberToWords(String(billions)) + ' tỷ';
        if (remainder === 0) {
            return result;
        } else if (remainder < 100) {
            // Use "lẻ" when remainder < 10 (tens digit is 0)
            if (remainder < 10) {
                return result + ' không trăm lẻ ' + DIGITS[String(remainder)];
            } else {
                return result + ' không trăm ' + numberToWords(String(remainder));
            }
        } else {
            return result + ' ' + numberToWords(String(remainder));
        }
    }
    
    // For very large numbers, read digit by digit
    return numStr.split('').map(d => DIGITS[d] || d).join(' ');
}

/**
 * Remove thousand separators (dots) from numbers
 * In Vietnamese, dots are used as thousand separators: 1.000, 140.000, 1.000.000
 */
function removeThousandSeparators(text) {
    // Match patterns like: 1.000, 140.000, 1.000.000, etc.
    // Pattern: 1-3 digits, then one or more groups of (dot + exactly 3 digits)
    // Must be followed by word boundary, space, or end of string (not another digit)
    return text.replace(/(\d{1,3}(?:\.\d{3})+)(?=\s|$|[^\d.,])/g, (match) => {
        // Remove all dots from the number
        const numberWithoutDots = match.replace(/\./g, '');
        return numberWithoutDots;
    });
}

/**
 * Convert decimal numbers: 7,27 -> bảy phẩy hai mươi bảy
 * In Vietnamese, commas are used as decimal separators
 */
function convertDecimal(text) {
    // Match decimal numbers: X,Y where Y is digits, followed by space or end
    // Pattern: digits, comma, one or more digits
    return text.replace(/(\d+),(\d+)(?=\s|$|[^\d,])/g, (match, integerPart, decimalPart) => {
        const integerWords = numberToWords(integerPart);
        // Read decimal part as a number (remove leading zeros)
        const decimalWords = numberToWords(decimalPart.replace(/^0+/, '') || '0');
        return `${integerWords} phẩy ${decimalWords}`;
    });
}

/**
 * Convert percentages: 50% -> năm mươi phần trăm
 * Note: Thousand separators (dots) should already be removed before this step
 * Commas in percentages are treated as decimal separators
 */
function convertPercentage(text) {
    return text.replace(/(\d+(?:,\d+)?)\s*%/g, (match, num) => {
        // Remove comma (decimal separator) and convert to words
        const numWithoutComma = num.replace(/,/g, '');
        return numberToWords(numWithoutComma) + ' phần trăm';
    });
}

/**
 * Convert currency amounts
 * Note: Thousand separators (dots) should already be removed before this step
 * Commas in currency are treated as decimal separators
 */
function convertCurrency(text) {
    // Vietnamese Dong - be specific to avoid matching "đ" in other words like "độ"
    function replaceVND(match, num) {
        // Remove comma (decimal separator) - dots should already be removed
        const cleanNum = num.replace(/,/g, '');
        return numberToWords(cleanNum) + ' đồng';
    }
    
    // Only match currency patterns: number followed by currency symbol at word boundary
    // Note: dots should already be removed, so we only look for commas (decimals)
    text = text.replace(/(\d+(?:,\d+)?)\s*(?:đồng|VND|vnđ)\b/gi, replaceVND);
    text = text.replace(/(\d+(?:,\d+)?)đ(?![a-zà-ỹ])/gi, replaceVND);
    
    // USD
    function replaceUSD(match, num) {
        // Remove comma (decimal separator) - dots should already be removed
        const cleanNum = num.replace(/,/g, '');
        return numberToWords(cleanNum) + ' đô la';
    }
    
    text = text.replace(/\$\s*(\d+(?:,\d+)?)/g, replaceUSD);
    text = text.replace(/(\d+(?:,\d+)?)\s*(?:USD|\$)/gi, replaceUSD);
    
    return text;
}

/**
 * Convert time expressions: 2 giờ 20 phút -> hai giờ hai mươi phút
 */
function convertTime(text) {
    // HH:MM:SS or HH:MM
    text = text.replace(/(\d{1,2}):(\d{2})(?::(\d{2}))?/g, (match, hour, minute, second) => {
        let result = numberToWords(hour) + ' giờ';
        if (minute) {
            result += ' ' + numberToWords(minute) + ' phút';
        }
        if (second) {
            result += ' ' + numberToWords(second) + ' giây';
        }
        return result;
    });
    
    // xxhxx format: 15h30 -> mười lăm giờ ba mươi
    text = text.replace(/(\d{1,2})h(\d{2})(?![a-zà-ỹ])/gi, (match, hour, minute) => {
        // Validate hour (0-23) and minute (0-59)
        const h = parseInt(hour, 10);
        const m = parseInt(minute, 10);
        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
            return numberToWords(hour) + ' giờ ' + numberToWords(minute);
        }
        return match;
    });
    
    // xxh format: 15h -> mười lăm giờ, 8h -> tám giờ
    text = text.replace(/(\d{1,2})h(?![a-zà-ỹ\d])/gi, (match, hour) => {
        // Validate hour (0-23)
        const h = parseInt(hour, 10);
        if (h >= 0 && h <= 23) {
            return numberToWords(hour) + ' giờ';
        }
        return match;
    });
    
    // X giờ Y phút
    text = text.replace(/(\d+)\s*giờ\s*(\d+)\s*phút/g, (match, hour, minute) => {
        return numberToWords(hour) + ' giờ ' + numberToWords(minute) + ' phút';
    });
    
    // X giờ (without minute)
    text = text.replace(/(\d+)\s*giờ(?!\s*\d)/g, (match, hour) => {
        return numberToWords(hour) + ' giờ';
    });
    
    return text;
}

/**
 * Convert date expressions
 */
function convertDate(text) {
    const originalText = text;
    const matches = [];
    
    // Helper function to validate date values
    function isValidDate(day, month, year = null) {
        const d = parseInt(day, 10);
        const m = parseInt(month, 10);
        if (year) {
            const y = parseInt(year, 10);
            return d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1000 && y <= 9999;
        }
        return d >= 1 && d <= 31 && m >= 1 && m <= 12;
    }
    
    // Helper function to validate month
    function isValidMonth(month) {
        const m = parseInt(month, 10);
        return m >= 1 && m <= 12;
    }
    
    // First, handle date ranges with "ngày" prefix: "ngày dd-dd/mm" or "ngày dd-dd/mm/yyyy"
    text = text.replace(/ngày\s+(\d{1,2})\s*[-–—]\s*(\d{1,2})\s*[/-]\s*(\d{1,2})(?:\s*[/-]\s*(\d{4}))?/g, (match, day1, day2, month, year) => {
        if (isValidDate(day1, month, year) && isValidDate(day2, month, year)) {
            let result = `ngày ${numberToWords(day1)} đến ${numberToWords(day2)} tháng ${numberToWords(month)}`;
            if (year) {
                result += ` năm ${numberToWords(year)}`;
            }
            matches.push({ pattern: 'ngày dd-dd/mm', match, result });
            return result;
        }
        return match;
    });
    
    // Handle date ranges without "ngày": "dd-dd/mm" or "dd-dd/mm/yyyy"
    // Use a function to check context
    text = text.replace(/(\d{1,2})\s*[-–—]\s*(\d{1,2})\s*[/-]\s*(\d{1,2})(?:\s*[/-]\s*(\d{4}))?/g, (match, day1, day2, month, year, offset) => {
        // Skip if already processed (contains "đến") or if preceded by "ngày"
        const beforeMatch = text.substring(Math.max(0, offset - 10), offset);
        if (beforeMatch.includes('ngày') || match.indexOf('đến') !== -1) {
            return match;
        }
        // Check if this might be a date range
        if (isValidDate(day1, month, year) && isValidDate(day2, month, year)) {
            let result = `${numberToWords(day1)} đến ${numberToWords(day2)} tháng ${numberToWords(month)}`;
            if (year) {
                result += ` năm ${numberToWords(year)}`;
            }
            matches.push({ pattern: 'dd-dd/mm', match, result });
            return result;
        }
        return match;
    });
    
    // Handle month ranges: "mm-mm/yyyy"
    text = text.replace(/(\d{1,2})\s*[-–—]\s*(\d{1,2})\s*[/-]\s*(\d{4})/g, (match, month1, month2, year) => {
        if (isValidMonth(month1) && isValidMonth(month2) && parseInt(year, 10) >= 1000 && parseInt(year, 10) <= 9999) {
            const result = `tháng ${numberToWords(month1)} đến tháng ${numberToWords(month2)} năm ${numberToWords(year)}`;
            matches.push({ pattern: 'mm-mm/yyyy', match, result });
            return result;
        }
        return match;
    });
    
    // Replace "Sinh ngày DD/MM/YYYY" pattern to avoid double "ngày"
    text = text.replace(/(Sinh|sinh)\s+ngày\s+(\d{1,2})[/-](\d{1,2})[/-](\d{4})/g, (match, prefix, day, month, year) => {
        if (isValidDate(day, month, year)) {
            const result = `${prefix} ngày ${numberToWords(day)} tháng ${numberToWords(month)} năm ${numberToWords(year)}`;
            matches.push({ pattern: 'Sinh ngày DD/MM/YYYY', match, result });
            return result;
        }
        return match;
    });
    
    // DD/MM/YYYY or DD-MM-YYYY
    text = text.replace(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/g, (match, day, month, year) => {
        if (isValidDate(day, month, year)) {
            const result = `ngày ${numberToWords(day)} tháng ${numberToWords(month)} năm ${numberToWords(year)}`;
            matches.push({ pattern: 'DD/MM/YYYY', match, result });
            return result;
        }
        return match;
    });
    
    // MM/YYYY or MM-YYYY (month/year) - handle both with and without "tháng"
    text = text.replace(/(?:tháng\s+)?(\d{1,2})\s*[/-]\s*(\d{4})/g, (match, month, year, offset) => {
        if (isValidMonth(month) && parseInt(year, 10) >= 1000 && parseInt(year, 10) <= 9999) {
            // Check if "tháng" was already in the match
            const hasThang = match.toLowerCase().includes('tháng');
            const result = hasThang 
                ? `tháng ${numberToWords(month)} năm ${numberToWords(year)}`
                : `tháng ${numberToWords(month)} năm ${numberToWords(year)}`;
            matches.push({ pattern: 'MM/YYYY', match, result });
            return result;
        }
        return match;
    });
    
    // DD/MM or DD-MM (day/month without year) - validate day <= 31, month <= 12
    text = text.replace(/(\d{1,2})\s*[/-]\s*(\d{1,2})(?![\/-]\d)/g, (match, day, month) => {
        if (isValidDate(day, month)) {
            const result = `${numberToWords(day)} tháng ${numberToWords(month)}`;
            matches.push({ pattern: 'DD/MM', match, result });
            return result;
        }
        return match;
    });
    
    // X tháng Y
    text = text.replace(/(\d+)\s*tháng\s*(\d+)/g, (match, day, month) => {
        if (isValidDate(day, month)) {
            const result = `ngày ${numberToWords(day)} tháng ${numberToWords(month)}`;
            matches.push({ pattern: 'X tháng Y', match, result });
            return result;
        }
        return match;
    });
    
    // tháng X (month only)
    text = text.replace(/tháng\s*(\d+)/g, (match, month) => {
        if (isValidMonth(month)) {
            const result = 'tháng ' + numberToWords(month);
            matches.push({ pattern: 'tháng X', match, result });
            return result;
        }
        return match;
    });
    
    // ngày X
    text = text.replace(/ngày\s*(\d+)/g, (match, day) => {
        const d = parseInt(day, 10);
        if (d >= 1 && d <= 31) {
            const result = 'ngày ' + numberToWords(day);
            matches.push({ pattern: 'ngày X', match, result });
            return result;
        }
        return match;
    });
    
    // Only log if there were matches
    if (matches.length > 0) {
        console.log('📅 [Date] Matches:', matches);
    }
    
    return text;
}

/**
 * Convert year ranges: 1873-1907 -> một nghìn tám trăm bảy mươi ba đến một nghìn chín trăm lẻ bảy
 */
function convertYearRange(text) {
    return text.replace(/(\d{4})\s*[-–—]\s*(\d{4})/g, (match, year1, year2) => {
        return numberToWords(year1) + ' đến ' + numberToWords(year2);
    });
}

/**
 * Convert ordinals: thứ 2 -> thứ hai
 */
function convertOrdinal(text) {
    const ordinalMap = {
        '1': 'nhất', '2': 'hai', '3': 'ba', '4': 'tư', '5': 'năm',
        '6': 'sáu', '7': 'bảy', '8': 'tám', '9': 'chín', '10': 'mười'
    };
    
    return text.replace(/(thứ|lần|bước|phần|chương|tập|số)\s*(\d+)/gi, (match, prefix, num) => {
        if (ordinalMap[num]) {
            return prefix + ' ' + ordinalMap[num];
        }
        return prefix + ' ' + numberToWords(num);
    });
}

/**
 * Convert remaining standalone numbers to words
 */
function convertStandaloneNumbers(text) {
    return text.replace(/\b\d+\b/g, (match) => {
        return numberToWords(match);
    });
}

/**
 * Read phone numbers digit by digit
 */
function convertPhoneNumber(text) {
    function replacePhone(match) {
        const digits = match.match(/\d/g);
        return digits.map(d => DIGITS[d] || d).join(' ');
    }
    
    // Vietnamese phone patterns
    text = text.replace(/0\d{9,10}/g, replacePhone);
    text = text.replace(/\+84\d{9,10}/g, replacePhone);
    
    return text;
}

/**
 * Convert measurement units to Vietnamese names
 * Only replaces units when there is a number (digits) immediately to the left
 * Keeps the number as digits - number conversion happens later in the pipeline
 */
function convertMeasurementUnits(text) {
    // Unit mappings: unit symbol -> Vietnamese name
    const unitMap = {
        // Length units
        'm': 'mét',
        'cm': 'xăng-ti-mét',
        'mm': 'mi-li-mét',
        'km': 'ki-lô-mét',
        'dm': 'đề-xi-mét',
        'hm': 'héc-tô-mét',
        'dam': 'đề-ca-mét',
        "inch": "in",

        // Weight units
        'kg': 'ki-lô-gam',
        'g': 'gam',
        'mg': 'mi-li-gam',
        't': 'tấn',
        'tấn': 'tấn',
        'yến': 'yến',
        'lạng': 'lạng',
        // Volume units
        'ml': 'mi-li-lít',
        'l': 'lít',
        'lít': 'lít',
        // Area units
        'm²': 'mét vuông',
        'm2': 'mét vuông',
        'km²': 'ki-lô-mét vuông',
        'km2': 'ki-lô-mét vuông',
        'ha': 'héc-ta',
        'cm²': 'xăng-ti-mét vuông',
        'cm2': 'xăng-ti-mét vuông',
        // Volume units (cubic)
        'm³': 'mét khối',
        'm3': 'mét khối',
        'cm³': 'xăng-ti-mét khối',
        'cm3': 'xăng-ti-mét khối',
        'km³': 'ki-lô-mét khối',
        'km3': 'ki-lô-mét khối',
        // Time units
        's': 'giây',
        'sec': 'giây',
        'min': 'phút',
        'h': 'giờ',
        'hr': 'giờ',
        'hrs': 'giờ',
        // Speed units
        'km/h': 'ki-lô-mét trên giờ',
        'kmh': 'ki-lô-mét trên giờ',
        'm/s': 'mét trên giây',
        'ms': 'mét trên giây',
        "mm/h": "mi-li-mét trên giờ", // mưa
        "cm/s": "xăng-ti-mét trên giây", // mưa

        // Temperature units
        '°C': 'độ C',
        '°F': 'độ F',
        '°K': 'độ K',
        '°R': 'độ R',
        '°Re': 'độ Re',
        '°Ro': 'độ Ro',
        '°N': 'độ N',
        '°D': 'độ D',
    };

    // Sort units by length (longest first) to match longer units first (e.g., "km/h" before "km")
    const sortedUnits = Object.keys(unitMap).sort((a, b) => b.length - a.length);

    // Match patterns: 
    // 1. Digits + optional space + unit (e.g., "3 cm", "3cm")
    // 2. Vietnamese number words + optional space + unit (e.g., "hai phẩy bốn cm", "mười lăm cm")
    // Process longer units first to prevent shorter units from matching within longer ones
    for (const unit of sortedUnits) {
        const escapedUnit = unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Pattern 1: digits + optional space + unit
        let digitPattern;
        if (unit.length === 1) {
            // Single char: must NOT be followed by a letter (even with space in between)
            digitPattern = `(\\d+)\\s*${escapedUnit}(?!\\s*[a-zA-Zà-ỹ])(?=\\s*[^a-zA-Zà-ỹ]|$)`;
        } else {
            // Multi-char: just check for space/punctuation/end
            digitPattern = `(\\d+)\\s*${escapedUnit}(?=\\s|[^\\w]|$)`;
        }
        const digitRegex = new RegExp(digitPattern, 'gi');
        
        // Pattern 2: Vietnamese number words + optional space + unit
        // Match sequences of Vietnamese words that represent numbers, including decimals
        // Match word sequences that start with number words and are followed by the unit
        // Be careful to match only number sequences, not other words
        // Pattern: (number word sequence) + optional space + unit
        // Number sequences can contain: digits words, "phẩy" (decimal), "trăm", "nghìn", etc.
        // Use a more restrictive pattern that matches known number word patterns
        const numberWordPattern = `(?:\\b(?:một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười|không|trăm|nghìn|triệu|tỷ|lẻ|mốt|tư|lăm|phẩy)\\s*)+`;
        let wordPattern;
        if (unit.length === 1) {
            // Single char: must NOT be followed by a letter
            wordPattern = `(${numberWordPattern})\\s*${escapedUnit}(?!\\s*[a-zA-Zà-ỹ])(?=\\s*[^a-zA-Zà-ỹ]|$)`;
        } else {
            // Multi-char: just check for space/punctuation/end
            wordPattern = `(${numberWordPattern})\\s*${escapedUnit}(?=\\s|[^\\w]|$)`;
        }
        const wordRegex = new RegExp(wordPattern, 'gi');
        
        // First, replace digits + unit
        text = text.replace(digitRegex, (match, digits) => {
            return digits + ' ' + unitMap[unit];
        });
        
        // Then, replace Vietnamese number words + unit
        text = text.replace(wordRegex, (match, numberWords) => {
            const trimmedWords = numberWords.trim();
            return trimmedWords + ' ' + unitMap[unit];
        });
    }

    return text;
}

/**
 * Normalize Unicode to NFC form
 */
function normalizeUnicode(text) {
    return text.normalize('NFC');
}

/**
 * Remove or replace special characters that can't be spoken
 */
function removeSpecialChars(text) {
    // Replace common symbols with words
    text = text.replace(/&/g, ' và ');
    text = text.replace(/@/g, ' a còng ');
    text = text.replace(/#/g, ' thăng ');
    text = text.replace(/\*/g, '');
    text = text.replace(/_/g, ' ');
    text = text.replace(/~/g, '');
    text = text.replace(/`/g, '');
    text = text.replace(/\^/g, '');
    
    // Remove URLs
    text = text.replace(/https?:\/\/\S+/g, '');
    text = text.replace(/www\.\S+/g, '');
    
    // Remove email addresses
    text = text.replace(/\S+@\S+\.\S+/g, '');
    
    return text;
}

/**
 * Normalize punctuation marks
 */
function normalizePunctuation(text) {
    // Normalize quotes
    text = text.replace(/[""„‟]/g, '"');
    text = text.replace(/[''‚‛]/g, "'");
    
    // Normalize dashes
    text = text.replace(/[–—−]/g, '-');
    
    // Normalize ellipsis
    text = text.replace(/\.{3,}/g, '...');
    text = text.replace(/…/g, '...');
    
    // Remove multiple punctuation
    text = text.replace(/([!?.]){2,}/g, '$1');
    
    return text;
}

/**
 * Clean up extra whitespace
 */
function cleanWhitespace(text) {
    text = text.replace(/\s+/g, ' ');
    return text.trim();
}

/**
 * Main function to process Vietnamese text for TTS.
 * Applies all normalization steps in the correct order.
 * 
 * @param {string} text - Raw Vietnamese text
 * @returns {string} Normalized text suitable for TTS
 */
export function processVietnameseText(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }
    
    const originalText = text;
    
    // Step 1: Normalize Unicode
    text = normalizeUnicode(text);
    
    // Step 2: Remove special characters
    text = removeSpecialChars(text);
    
    // Step 3: Normalize punctuation
    text = normalizePunctuation(text);
    
    // Step 4: Convert year ranges (before other number conversions)
    text = convertYearRange(text);
    
    // Step 5: Convert dates
    text = convertDate(text);
    
    // Step 6: Convert times
    text = convertTime(text);
    
    // Step 7: Convert ordinals
    text = convertOrdinal(text);
    
    // Step 8: Remove thousand separators (dots) before currency and decimal conversion
    text = removeThousandSeparators(text);
    
    // Step 9: Convert currency
    text = convertCurrency(text);
    
    // Step 10: Convert percentages
    text = convertPercentage(text);
    
    // Step 11: Convert phone numbers
    text = convertPhoneNumber(text);
    
    // Step 12: Convert decimals (before standalone numbers, after currency)
    // In Vietnamese, commas are decimal separators
    text = convertDecimal(text);
    
    // Step 13: Convert measurement units (before numbers are converted to words)
    // This runs before convertStandaloneNumbers so it can match digits before units
    text = convertMeasurementUnits(text);
    
    // Step 14: Convert remaining standalone numbers
    text = convertStandaloneNumbers(text);
    
    // Step 15: Clean whitespace
    text = cleanWhitespace(text);
    
    // Only log if text actually changed
    if (text !== originalText) {
        console.log('📝 [Vietnamese Processor]', {
            input: originalText,
            output: text
        });
    }
    
    return text;
}

export { numberToWords, convertDecimal, convertPercentage, convertCurrency, 
         convertTime, convertDate, convertYearRange, convertOrdinal, 
         convertStandaloneNumbers, convertMeasurementUnits, convertPhoneNumber, normalizeUnicode,
         removeSpecialChars, normalizePunctuation, cleanWhitespace };

