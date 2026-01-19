/**
 * Vietnamese Language Detector
 * Detects if a word is Vietnamese based on diacritics, character patterns, and word structure
 */
class VnLanguageDetector {
    constructor() {
        // 1. Ký tự chắc chắn là tiếng Việt (có dấu)
        this.vnAccentRegex = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

        // 2. Định nghĩa các thành phần âm tiết Tiếng Việt
        this.vnVowels = "ueoaiy";
        
        // Phụ âm đầu hợp lệ của Tiếng Việt (bao gồm cả đơn và ghép)
        this.vnOnsets = new Set([
            'b', 'c', 'd', 'đ', 'g', 'h', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'x',
            'ch', 'gh', 'gi', 'kh', 'ng', 'nh', 'ph', 'qu', 'th', 'tr'
        ]);

        // Phụ âm cuối hợp lệ của Tiếng Việt
        this.vnEndings = new Set(['p', 't', 'c', 'm', 'n', 'ng', 'ch', 'nh']);

        // 3. Ký tự đặc trưng tiếng Anh (bắt buộc phải convert)
        this.enSpecialChars = /[fwzj]/i;
    }

    /**
     * Check if a word is Vietnamese
     * @param {string} word - The word to check
     * @returns {boolean} - True if the word is Vietnamese, false otherwise
     */
    isVietnameseWord(word) {
        if (!word) return false;
        const w = word.toLowerCase().trim();

        // BƯỚC 1: Nếu có dấu -> Chắc chắn giữ nguyên
        const hasDiacritic = this.vnAccentRegex.test(w);
        if (hasDiacritic) return true;

        // BƯỚC 2: Nếu chứa f, w, z, j -> Chắc chắn là tiếng Anh (cần convert)
        if (this.enSpecialChars.test(w)) return false;

        // BƯỚC 3: Phân tích cấu trúc từ không dấu
        // Tách từ thành 3 phần: Phụ âm đầu - Nguyên âm - Phụ âm cuối
        // Regex này bắt cụm phụ âm đầu, cụm nguyên âm ở giữa, và cụm phụ âm cuối
        const match = w.match(/^([^ueoaiy]*)([ueoaiy]+)([^ueoaiy]*)$/);
        
        if (!match) return false; // Không có nguyên âm thì không phải tiếng Việt

        const [_, onset, vowel, ending] = match;

        // Kiểm tra Phụ âm đầu: 
        // Phải rỗng (như 'anh') hoặc nằm trong danh sách phụ âm đầu tiếng Việt
        if (onset !== "" && !this.vnOnsets.has(onset)) return false;

        // Kiểm tra Phụ âm cuối:
        // Phải rỗng (như 'ba') hoặc nằm trong danh sách phụ âm cuối tiếng Việt
        if (ending !== "" && !this.vnEndings.has(ending)) return false;

        // Kiểm tra Nguyên âm:
        // Tiếng Việt không có nguyên âm kép kiểu 'ee', 'oo' (trừ khi bạn muốn coi 'oo' là tiếng Việt)
        if (/ee|oo|ea|oa|ae|ie/.test(vowel)) {
            // Ngoại lệ: 'oa' là vần tiếng Việt hợp lệ (như 'loa', 'qua')
            if (vowel !== 'oa' && vowel !== 'oe' && vowel !== 'ua' && vowel !== 'uy') {
                return false; 
            }
        }

        // Nếu vượt qua tất cả các bước trên, từ này được coi là Tiếng Việt
        // Kể cả 'man', 'cat', 'hot', 'bin'... vì chúng khớp cấu trúc CVC của Tiếng Việt
        return true;
    }
}

// Create a singleton instance
const detector = new VnLanguageDetector();

/**
 * Check if a word is Vietnamese
 * @param {string} word - The word to check
 * @returns {boolean} - True if the word is Vietnamese, false otherwise
 */
export function isVietnameseWord(word) {
    return detector.isVietnameseWord(word);
}

export { VnLanguageDetector };
