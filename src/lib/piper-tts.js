/* eslint-disable no-undef */

import { processTextForTTS, chunkText, loadConfig, isDebugEnabled, debugLog } from '../utils/text-cleaner.js';

// Merge phonemizer output (which may be an array of clause strings) into a single
// string while preserving clause separators (commas/semicolons/colons) from the
// original text. This lets the model \"see\" punctuation and pause naturally.
function mergePhonemizerOutputPreservePunct(text, phonemes) {
  // Simple case: phonemizer already returned a single string
  if (typeof phonemes === 'string') {
    return phonemes;
  }

  // Handle object outputs (e.g., { text, phonemes })
  if (phonemes && typeof phonemes === 'object' && !Array.isArray(phonemes)) {
    const maybeText = phonemes.text || phonemes.phonemes;
    if (typeof maybeText === 'string') {
      return maybeText;
    }
    return String(maybeText ?? phonemes);
  }

  // Fallback for null/undefined and non-array cases
  if (!Array.isArray(phonemes)) {
    return String(phonemes ?? '');
  }

  // Collect clause separators from original text (commas/semicolon/colon)
  const separators = Array.from(text.matchAll(/[,;:]/g), (m) => m[0]);

  let result = '';
  let sepIdx = 0;

  for (let i = 0; i < phonemes.length; i++) {
    const rawPart = phonemes[i];
    if (!rawPart) continue;

    const part = String(rawPart).trim();
    if (!part) continue;

    if (result) {
      // Insert the matching separator if available; otherwise default to comma + space
      const sep = separators[sepIdx] || ',';
      result += `${sep} `;
      sepIdx++;
    }

    result += part;
  }

  return result;
}

// Text splitting stream to break text into chunks
export class TextSplitterStream {
  constructor() {
    this.chunks = [];
    this.closed = false;
  }

  async chunkText(text) {
    // Process the text (clean + replace words), then chunk it
    const processedText = await processTextForTTS(text);
    return await chunkText(processedText);
  }

  async push(text) {
    // Simple sentence splitting for now
    const sentences = await this.chunkText(text) || [text];
    this.chunks.push(...sentences);
  }

  close() {
    this.closed = true;
  }

  async *[Symbol.asyncIterator]() {
    for (const chunk of this.chunks) {
      yield chunk;
    }
  }
}

// RawAudio class to handle audio data
export class RawAudio {
  constructor(audio, sampling_rate) {
    this.audio = audio;
    this.sampling_rate = sampling_rate;
  }

  get length() {
    return this.audio.length;
  }

  toBlob() {
    // Convert Float32Array to WAV blob
    const buffer = this.encodeWAV(this.audio, this.sampling_rate);
    return new Blob([buffer], { type: 'audio/wav' });
  }

  encodeWAV(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // RIFF identifier
    this.writeString(view, 0, 'RIFF');
    // file length
    view.setUint32(4, 36 + samples.length * 2, true);
    // RIFF type
    this.writeString(view, 8, 'WAVE');
    // format chunk identifier
    this.writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * 2, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    this.writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, samples.length * 2, true);

    this.floatTo16BitPCM(view, 44, samples);

    return buffer;
  }

  writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  floatTo16BitPCM(output, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  }
}

// Piper TTS class for local model
export class PiperTTS {
  constructor(voiceConfig = null, session = null) {
    this.voiceConfig = voiceConfig;
    this.session = session;
    this.phonemeIdMap = null;
  }

  static async from_pretrained(modelPath, configPath) {
    try {
      // Import ONNX Runtime Web and caching utility
      const ort = await import('onnxruntime-web');
      const { cachedFetch } = await import('../utils/model-cache.js');
      
      // Use local files in public directory with threading enabled
      ort.env.wasm.wasmPaths = `${import.meta.env.BASE_URL}onnx-runtime/`;

      // Load model and config
      const [modelResponse, configResponse] = await Promise.all([
        cachedFetch(modelPath),
        cachedFetch(configPath)
      ]);

      const [modelBuffer, voiceConfig] = await Promise.all([
        modelResponse.arrayBuffer(),
        configResponse.json()
      ]);

      // Create ONNX session with WASM execution provider
      const session = await ort.InferenceSession.create(modelBuffer, {
        executionProviders: [{
          name: 'wasm',
          simd: true
        }]
      });
      
      return new PiperTTS(voiceConfig, session);
    } catch (error) {
      console.error('Error loading Piper model:', error);
      throw error;
    }
  }

  // Convert text to phonemes using the phonemizer package
  async textToPhonemes(text) {
    const config = await loadConfig();
    
    if (isDebugEnabled(config)) {
      console.log(`[TEXT TO PHONEMES] Input text: ${JSON.stringify(text)}`);
      console.log(text)
    }
    
    if (this.voiceConfig.phoneme_type === "text") {
      // Text phonemes - just return normalized characters
      const normalized = text.normalize("NFD");
      const result = [Array.from(normalized)];
      
      if (isDebugEnabled(config)) {
        console.log(`[TEXT MODE] Normalized: ${JSON.stringify(normalized)}`);
        console.log(`[FINAL PHONEMES] Result: ${JSON.stringify(result)}`);
      }
      
      return result;
    }

    // Use phonemizer for espeak-style phonemes
    const { phonemize } = await import('phonemizer');
    const voice = this.voiceConfig.espeak?.voice || 'en-us';
    
    if (isDebugEnabled(config)) {
      console.log(`[PHONEMIZER] Voice: ${voice}`);
    }
    
    const phonemes = await phonemize(text, voice);
    
    if (isDebugEnabled(config)) {
      console.log(`[PHONEMIZER] Raw output: ${JSON.stringify(phonemes)}`);
      console.log(phonemes);
    }
    
    // Merge phonemizer output into a single string while preserving punctuation,
    // then remove (en) and (vi) markers from phoneme text
    const mergedPhonemeText = mergePhonemizerOutputPreservePunct(text, phonemes);
    const cleanedPhonemeText = mergedPhonemeText
      .replace(/\(en\)/g, '')
      .replace(/\(vi\)/g, '');
    
    if (isDebugEnabled(config)) {
      console.log(`[PHONEMIZER] After marker removal: ${JSON.stringify(cleanedPhonemeText)}`);
    }
    
    const phonemeText = cleanedPhonemeText;
    
    // Text is already chunked before it reaches here (1 chunk = 1 sentence).
    // Do NOT split again by punctuation, since that can introduce extra boundaries/pauses.
    const sentence = phonemeText.trim();
    const result = sentence ? [Array.from(sentence.normalize("NFD"))] : [];
    
    if (isDebugEnabled(config)) {
      console.log(`[SENTENCE SPLIT] Split into ${result.length} sentences`);
      if (sentence) {
        console.log(`  Sentence 1: ${JSON.stringify(sentence)}`);
      }
    }
    
    if (isDebugEnabled(config)) {
      console.log(`[FINAL PHONEMES] Result: ${JSON.stringify(result)}`);
    }
    
    return result;
  }

  // Convert phonemes to IDs using the phoneme ID map
  async phonemesToIds(textPhonemes) {
    if (!this.voiceConfig || !this.voiceConfig.phoneme_id_map) {
      throw new Error('Phoneme ID map not available');
    }

    const config = await loadConfig();
    const idMap = this.voiceConfig.phoneme_id_map;
    const BOS = "^";
    const EOS = "$";
    const PAD = "_";
    
    if (isDebugEnabled(config)) {
      console.log(`[PHONEME TO ID] BOS=${idMap[BOS]}, PAD=${idMap[PAD]}, EOS=${idMap[EOS]}`);
    }
    
    let phonemeIds = [];

    for (let sentenceIdx = 0; sentenceIdx < textPhonemes.length; sentenceIdx++) {
      const sentencePhonemes = textPhonemes[sentenceIdx];
      
      if (isDebugEnabled(config)) {
        console.log(`[SENTENCE ${sentenceIdx + 1}] Phonemes: ${JSON.stringify(sentencePhonemes)}`);
      }
      
      phonemeIds.push(idMap[BOS]);
      phonemeIds.push(idMap[PAD]);

      for (let phoneme of sentencePhonemes) {
        if (phoneme in idMap) {
          phonemeIds.push(idMap[phoneme]);
          phonemeIds.push(idMap[PAD]);
        }
      }

      phonemeIds.push(idMap[EOS]);
    }

    if (isDebugEnabled(config)) {
      console.log(`[PHONEME TO ID] Total IDs: ${phonemeIds.length}`);
      console.log(`[PHONEME TO ID] ID sequence: ${phonemeIds.join(' ')}`);
    }

    return phonemeIds;
  }

  async *stream(textStreamer, options = {}) {
    const { speakerId = 0, lengthScale = 1.0, noiseScale = 0.667, noiseWScale = 0.8 } = options;
    
    const config = await loadConfig();
    let chunkIdx = 0;
    
    // Process the text stream
    for await (const text of textStreamer) {
      if (text.trim()) {
        try {
          if (this.session && this.voiceConfig) {
            chunkIdx++;
            
            if (isDebugEnabled(config)) {
              console.log(`[CHUNK ${chunkIdx}] Processing text: ${JSON.stringify(text)}`);
            }
            
            // Convert text to phonemes then to IDs
            const textPhonemes = await this.textToPhonemes(text);
            const phonemeIds = await this.phonemesToIds(textPhonemes);
            
            // Prepare tensors for Piper model
            const ort = await import('onnxruntime-web');
            
            const inputs = {
              'input': new ort.Tensor('int64', new BigInt64Array(phonemeIds.map(id => BigInt(id))), [1, phonemeIds.length]),
              'input_lengths': new ort.Tensor('int64', BigInt64Array.from([BigInt(phonemeIds.length)]), [1]),
              'scales': new ort.Tensor('float32', Float32Array.from([noiseScale, lengthScale, noiseWScale]), [3])
            };

            // Add speaker ID for multi-speaker models
            if (this.voiceConfig.num_speakers > 1) {
              inputs['sid'] = new ort.Tensor('int64', BigInt64Array.from([BigInt(speakerId)]), [1]);
              // console.log('🎤 Added speaker ID tensor:', speakerId);
            } else {
              // console.log('⚠️ Model has only 1 speaker - speaker ID ignored');
            }

            const results = await this.session.run(inputs);
            
            // Extract audio data
            const audioOutput = results.output;
            const audioData = audioOutput.data;
            
            // Use the sample rate from config
            const sampleRate = this.voiceConfig.audio.sample_rate;
            
            // Clean up audio data
            const finalAudioData = new Float32Array(audioData);
            
            yield {
              text,
              audio: new RawAudio(finalAudioData, sampleRate)
            };
          }
        } catch (error) {
          console.error('Error generating audio:', error);
          // Yield silence in case of error
          yield {
            text,
            audio: new RawAudio(new Float32Array(22050), 22050)
          };
        }
      }
    }
  }

  // Get available speakers for multi-speaker models
  getSpeakers() {
    if (!this.voiceConfig || this.voiceConfig.num_speakers <= 1) {
      return [{ id: 0, name: 'Voice 1' }];
    }

    const speakerIdMap = this.voiceConfig.speaker_id_map || {};
    return Object.entries(speakerIdMap)
      .sort(([,a], [,b]) => a - b) // Sort by speaker ID (0, 1, 2, ...)
      .map(([originalId, id]) => ({ 
        id, 
        name: `Voice ${id + 1}`,
        originalId 
      }));
  }
}