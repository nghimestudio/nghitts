import { isVietnameseWord } from './vietnamese-detector.js';

/**
 * Convert English word to Vietnamese transliteration
 * @param {string} word - English word to transliterate
 * @returns {string} - Vietnamese transliteration
 */
function englishToVietnamese(word) {
  if (!word) return "";
  
  let w = word.toLowerCase().trim();
  
  // Xử lý y đầu từ
  if (w.startsWith('y')) {
    w = 'd' + w.slice(1);
  }

  // Xử lý d đầu từ (English 'd' -> Vietnamese 'đ')
  // Examples: database -> đa..., data -> đa..., domain -> đô...
  if (w.startsWith('d')) {
    w = 'đ' + w.slice(1);
  }
  
  // BƯỚC 1: Định nghĩa quy tắc
  const highPriorityRules = [
    // Đuôi từ đặc biệt - PHẢI Ở CUỐI
    [/tion$/g, 'ân'],
    [/sion$/g, 'ân'],
    [/age$/g, 'ây'],
    [/ing$/g, 'ing'],
    [/ture$/g, 'chờ'],
    [/cial$/g, 'xô'],
    [/tial$/g, 'xô'],
    
    // Vần phức đặc biệt
    [/aught/g, 'ót'],
    [/ought/g, 'ót'],
    [/ound/g, 'ao'],
    [/ight/g, 'ai'],
    [/eigh/g, 'ây'],
    [/ough/g, 'ao'],
    
    // Phụ âm đầu cụm - CHỈ Ở ĐẦU
    [/\bst(?!r)/g, 't'],
    [/\bstr/g, 'tr'],
    [/\bsch/g, 'c'],
    [/\bsc(?=h)/g, 'c'],
    [/\bsc|sk/g, 'c'],
    [/\bsp/g, 'p'],
    [/\btr/g, 'tr'],
    [/\bbr/g, 'r'],
    [/\bcr|pr|gr|dr|fr/g, 'r'],
    [/\bbl|cl|sl|pl/g, 'l'],
    [/\bfl/g, 'ph'],
    
    // Phụ âm kép
    [/ck/g, 'c'],
    [/sh/g, 's'],
    [/ch/g, 'ch'],
    [/th/g, 'th'],
    [/ph/g, 'ph'],
    [/wh/g, 'q'],
    [/qu/g, 'q'],
    [/kn/g, 'n'],
    [/wr/g, 'r']
  ];
  
  // Áp dụng quy tắc ưu tiên cao
  for (let [pattern, replacement] of highPriorityRules) {
    w = w.replace(pattern, replacement);
  }
  
  // QUY TẮC VẦN - CHỈ áp dụng khi Ở CUỐI (có dấu $)
  const endingRules = [
    // Vần -LE ở cuối → bồ (table, apple)
    [/le$/g, 'ồ'],
    
    // Vần nguyên âm đôi + phụ âm cuối
    [/ook$/g, 'úc'],  // book, look, cook
    [/ood$/g, 'út'],  // good, food, wood
    [/ool$/g, 'un'],  // cool, pool, school
    [/oom$/g, 'um'],  // room, boom, zoom
    [/oon$/g, 'un'],  // moon, soon, noon
    [/oot$/g, 'út'],  // foot, boot, root
    [/iend$/g, 'en'],  // keep, deep, sleep
    [/end$/g, 'en'],  // keep, deep, sleep
    [/eau$/g, 'iu'],  // keep, deep, sleep
 
    
    [/ail$/g, 'ain'],  // mail, tail, sail
    [/ain$/g, 'ain'],  // main, rain, train
    [/ait$/g, 'ât'],   // wait, bait
    
    [/oat$/g, 'ốt'],  // boat, coat, goat
    [/oad$/g, 'ốt'],  // road, load, toad
    [/oal$/g, 'ôn'],  // goal, coal
    
    [/eep$/g, 'íp'],  // keep, deep, sleep
    [/eet$/g, 'ít'],  // meet, feet, street
    [/eel$/g, 'in'],  // feel, steel, wheel
    
    // Vần -TCH ở cuối
    [/atch$/g, 'át'],
    [/etch$/g, 'éch'],
    [/itch$/g, 'ích'],
    [/otch$/g, 'ốt'],
    [/utch$/g, 'út'],
    
    // Vần -DGE ở cuối
    [/edge$/g, 'ét'],
    [/idge$/g, 'ít'],
    [/odge$/g, 'ót'],
    [/udge$/g, 'út'],
    
    // Vần -CK/-K ở cuối
    [/ack$/g, 'ác'],
    [/eck$/g, 'éc'],
    [/ick$/g, 'ích'],
    [/ock$/g, 'óc'],
    [/uck$/g, 'úc'],
    
    // Vần -SH ở cuối
    [/ash$/g, 'át'],
    [/esh$/g, 'ét'],
    [/ish$/g, 'ít'],
    [/osh$/g, 'ốt'],
    [/ush$/g, 'út'],
    
    // Vần -TH ở cuối
    [/ath$/g, 'át'],
    [/eth$/g, 'ét'],
    [/ith$/g, 'ít'],
    [/oth$/g, 'ót'],
    [/uth$/g, 'út'],
    
    // Vần -TE dài ở cuối
    [/ate$/g, 'ây'],
    [/ete$/g, 'ét'],
    [/ite$/g, 'ai'],
    [/ote$/g, 'ốt'],
    [/ute$/g, 'út'],
    
    // Vần -DE dài ở cuối
    [/ade$/g, 'ây'],
    [/ede$/g, 'ét'],
    [/ide$/g, 'ai'],
    [/ode$/g, 'ốt'],
    [/ude$/g, 'út'],
    
    // Vần Silent-E ở cuối
    [/ake$/g, 'ây'],
    [/ame$/g, 'am'],
    [/ane$/g, 'an'],
    [/ape$/g, 'ếp'],
    [/eke$/g, 'ét'],
    [/eme$/g, 'êm'],
    [/ene$/g, 'en'],
    [/ike$/g, 'íc'],
    [/ime$/g, 'am'],
    [/ine$/g, 'ai'],
    [/oke$/g, 'ốc'],
    [/ome$/g, 'om'],
    [/one$/g, 'oăn'],
    [/uke$/g, 'ấc'],
    [/ume$/g, 'uym'],
    [/une$/g, 'uyn'],
    
    // Vần -SE ở cuối
    [/ase$/g, 'ây'],
    [/ise$/g, 'ai'],
    [/ose$/g, 'âu'],
    
    // Vần -LL ở cuối
    [/all$/g, 'âu'],
    [/ell$/g, 'eo'],
    [/ill$/g, 'iu'],
    [/oll$/g, 'ôn'],
    [/ull$/g, 'un'],
    
    // Vần -NG ở cuối
    [/ang$/g, 'ang'],
    [/eng$/g, 'ing'],
    [/ong$/g, 'ong'],
    [/ung$/g, 'âng'],
    
    // Vần phức - CHỈ Ở CUỐI
    [/air$/g, 'e'],
    [/ear$/g, 'ia'],
    [/ire$/g, 'ai'],
    [/ure$/g, 'iu'],
    [/our$/g, 'ao'],
    [/ore$/g, 'o'],
    [/ound$/g, 'ao'],
    [/ight$/g, 'ai'],
    [/aught$/g, 'ót'],
    [/ought$/g, 'ót'],
    [/eigh$/g, 'ây'],
    [/ork$/g, 'ót'],
    
    // Nguyên âm đôi ở cuối
    [/ee$/g, 'i'],
    [/ea$/g, 'i'],
    [/oo$/g, 'u'],
    [/oa$/g, 'oa'],
    [/oe$/g, 'oe'],
    [/ai$/g, 'ai'],
    [/ay$/g, 'ay'],
    [/au$/g, 'au'],
    [/aw$/g, 'â'],
    [/ei$/g, 'ây'],
    [/ey$/g, 'ây'],
    [/oi$/g, 'oi'],
    [/oy$/g, 'oi'],
    [/ou$/g, 'u'],
    [/ow$/g, 'ô'],
    [/ue$/g, 'ue'],
    [/ui$/g, 'ui'],
    [/ie$/g, 'ai'],
    [/eu$/g, 'iu'],
    
    // Vần -R ở cuối
    [/ar$/g, 'a'],
    [/er$/g, 'ơ'],
    [/ir$/g, 'ơ'],
    [/or$/g, 'o'],
    [/ur$/g, 'ơ'],
    
    // Vần -L ở cuối
    [/al$/g, 'an'],
    [/el$/g, 'eo'],
    [/il$/g, 'iu'],
    [/ol$/g, 'ôn'],
    [/ul$/g, 'un'],
    
    // Vần đóng cơ bản ở cuối
    [/ab$/g, 'áp'],
    [/ad$/g, 'át'],
    [/ag$/g, 'ác'],
    [/ak$/g, 'át'],
    [/ap$/g, 'áp'],
    [/at$/g, 'át'],
    [/eb$/g, 'ép'],
    [/ed$/g, 'ét'],
    [/eg$/g, 'ét'],
    [/ek$/g, 'éc'],
    [/ep$/g, 'ép'],
    [/et$/g, 'ét'],
    [/ib$/g, 'íp'],
    [/id$/g, 'ít'],
    [/ig$/g, 'íc'],
    [/ik$/g, 'íc'],
    [/ip$/g, 'íp'],
    [/it$/g, 'ít'],
    [/ob$/g, 'óp'],
    [/od$/g, 'ót'],
    [/og$/g, 'óc'],
    [/ok$/g, 'óc'],
    [/op$/g, 'óp'],
    [/ot$/g, 'ót'],
    [/ub$/g, 'úp'],
    [/ud$/g, 'út'],
    [/ug$/g, 'úc'],
    [/uk$/g, 'úc'],
    [/up$/g, 'úp'],
    [/ut$/g, 'út'],
    
    // Vần -M/-N ở cuối
    [/am$/g, 'am'],
    [/an$/g, 'an'],
    [/em$/g, 'em'],
    [/en$/g, 'en'],
    [/im$/g, 'im'],
    [/in$/g, 'in'],
    [/om$/g, 'om'],
    [/on$/g, 'on'],
    [/um$/g, 'âm'],
    [/un$/g, 'ân'],
    
    // Vần -S ở cuối
    [/as$/g, 'ẹt'],
    [/es$/g, 'ẹt'],
    [/is$/g, 'ít'],
    [/os$/g, 'ọt'],
    [/us$/g, 'ợt'],
    
    // Nguyên âm lặp ở cuối
    [/aa$/g, 'a'],
    [/ii$/g, 'i'],
    [/uu$/g, 'u']
  ];
  
  // Áp dụng quy tắc vần cuối
  for (let [pattern, replacement] of endingRules) {
    w = w.replace(pattern, replacement);
  }
  
  // QUY TẮC CHUNG (chỉ áp dụng cho ký tự ĐƠN hoặc ở GIỮA từ)
  const generalRules = [
    
    // Phụ âm đơn
    [/j/g, 'd'],
    [/z/g, 'd'],
    [/w/g, 'u'],
    [/x/g, 'x'],
    [/v/g, 'v'],
    [/f/g, 'ph'],
    [/s/g, 'x'],
    [/c/g, 'k'],
    [/q/g, 'ku'],
    
    // Nguyên âm đơn - CUỐI CÙNG
    [/a/g, 'a'],
    [/e/g, 'e'],
    [/i/g, 'i'],
    [/o/g, 'o'],
    [/u/g, 'u']
    // y được xử lý riêng: y sau phụ âm hoặc cuối từ → i, y đầu âm tiết → d (xử lý sau)
  ];
  
  // Áp dụng quy tắc chung
  for (let [pattern, replacement] of generalRules) {
    w = w.replace(pattern, replacement);
  }
  
  // Xử lý y: y sau phụ âm hoặc y ở cuối → i
  w = w.replace(/([bcdfghjklmnpqrstvwxz])y/g, '$1i');  // y sau phụ âm → i
  w = w.replace(/y$/g, 'i');  // y cuối từ → i
  
  // BƯỚC 1: Chia âm tiết sau lần chuyển đổi đầu tiên
  const vowels = 'aeiouăâêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ';
  const syllablePattern = new RegExp(`([^${vowels}]*[${vowels}]+[ptcmngs]?(?![${vowels}]))`, 'g');
  let parts = w.match(syllablePattern) || [];
  
  if (parts.length === 0) {
    return w;
  }
  
  // BƯỚC 2: Áp dụng lại quy tắc cho TỪNG âm tiết (coi như từ mới)
  let finalParts = parts.map(syllable => {
    let s = syllable.trim();
    if (!s) return "";
    
    // Xử lý y đầu âm tiết
    if (s.startsWith('y')) {
      s = 'd' + s.slice(1);
    }
    
    // Áp dụng LẠI quy tắc ưu tiên cao (coi âm tiết như từ mới)
    for (let [pattern, replacement] of highPriorityRules) {
      s = s.replace(pattern, replacement);
    }
    
    // Áp dụng LẠI các quy tắc vần cuối cho âm tiết này
    for (let [pattern, replacement] of endingRules) {
      s = s.replace(pattern, replacement);
    }
    
    // Áp dụng LẠI các quy tắc chung cho âm tiết này
    for (let [pattern, replacement] of generalRules) {
      s = s.replace(pattern, replacement);
    }
    
    // Xử lý y cho âm tiết: y sau phụ âm hoặc y ở cuối → i
    s = s.replace(/([bcdfghjklmnpqrstvwxz])y/g, '$1i');  // y sau phụ âm → i
    s = s.replace(/y$/g, 'i');  // y cuối âm tiết → i
    
    return s;
  });
  
  // Xử lý từng âm tiết (sau khi đã áp dụng quy tắc lần 2)
  finalParts = finalParts.map(p => {
    p = p.trim();
    if (!p) return "";
    
    // Định nghĩa phụ âm
    const consonants = 'bcdfghjklmnpqrstvwxz';
    const isConsonant = (c) => consonants.includes(c);
    
    // Xóa phụ âm kép không hợp lệ (bb, rr, ll, pp, tt, ...)
    p = p.replace(/([brlptdgmnckxsvfzjwqh])\1+/g, '$1');
    
    // Xử lý cụm 2 phụ âm liên tiếp
    // Giữ lại các cụm hợp lệ: ch, th, ph, sh, ng, tr, nh, gh, kh
    const validPairs = ['ch', 'th', 'ph', 'sh', 'ng', 'tr', 'nh', 'gh', 'kh'];
    
    // Tìm và xóa các cụm phụ âm không hợp lệ (giữ ký tự thứ 2)
    let result = '';
    let i = 0;
    while (i < p.length) {
      if (i < p.length - 1 && isConsonant(p[i]) && isConsonant(p[i + 1])) {
        const pair = p[i] + p[i + 1];
        if (validPairs.includes(pair)) {
          // Giữ nguyên cụm hợp lệ
          result += pair;
          i += 2;
        } else {
          // Xóa ký tự đầu, giữ ký tự thứ 2
          result += p[i + 1];
          i += 2;
        }
      } else {
        result += p[i];
        i++;
      }
    }
    p = result;
    
    // Quy tắc C/K
    if (!p.startsWith('ch') && !p.startsWith('th') && !p.startsWith('ph') && !p.startsWith('sh')) {
      if (p.startsWith('k') || p.startsWith('c')) {
        const next = p.slice(1, 2);
        const useK = ['i', 'e', 'y'].includes(next);
        p = (useK ? 'k' : 'c') + p.slice(1);
      }
    }
    
    // Lọc phụ âm cuối hợp lệ
    if (p.length > 1 && !vowels.includes(p[p.length - 1])) {
      const lastChar = p[p.length - 1];
      const validEndings = ['p', 't', 'c', 'm', 'n', 'g', 's'];
      
      if (!validEndings.includes(lastChar)) {
        if (lastChar === 'l') {
          p = p.slice(0, -1) + 'n';
        } else {
          p = p.slice(0, -1);
        }
      }
    }
    
    return p;
  }).filter(p => p !== "");
  
  return finalParts.join('-');
}

/**
 * Transliterate a word from English to Vietnamese
 * Checks if word is Vietnamese first - if yes, returns original word unchanged
 * @param {string} word - Word to transliterate
 * @returns {string} - Transliterated word or original if Vietnamese
 */
export function transliterateWord(word) {
    if (!word || typeof word !== 'string') {
        return word || '';
    }

    // Check if word is Vietnamese - if yes, skip transliteration
    const isVn = isVietnameseWord(word);
    if (isVn) {
        return word;
    }
    
    // Otherwise, apply transliteration
    return englishToVietnamese(word);
}
