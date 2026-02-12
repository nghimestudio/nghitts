import { PiperTTS, TextSplitterStream } from "../lib/piper-tts-i18n.js";
import { getModelBaseUrl } from "../config.js";

let tts = null;

async function initializeModel(lang, modelName) {
  try {
    const base = getModelBaseUrl(lang);
    const modelPath = `${base}${modelName}.onnx`;
    const configPath = `${base}${modelName}.onnx.json`;

    tts = await PiperTTS.from_pretrained(modelPath, configPath);

    const speakers = tts.getSpeakers();

    self.postMessage({ status: "ready", voices: speakers });
  } catch (e) {
    console.error("Error loading model:", e);
    self.postMessage({ status: "error", data: e.message });
  }
}

async function handlePreview(text, voice, speed) {
  try {
    const streamer = new TextSplitterStream();
    streamer.push(text);
    streamer.close();

    const speakerId = typeof voice === 'number' ? voice : parseInt(voice) || 0;
    const lengthScale = 1.0 / (speed || 1.0);

    const stream = tts.stream(streamer, {
      speakerId,
      lengthScale
    });

    for await (const { audio } of stream) {
      const audioBlob = audio.toBlob();
      self.postMessage({ status: "preview", audio: audioBlob });
      break;
    }
  } catch (error) {
    console.error('Error generating preview:', error);
  }
}

self.addEventListener("message", async (e) => {
  const { type, text, voice, speed, lang, model } = e.data;

  if (type === 'init') {
    await initializeModel(lang, model);
    return;
  }

  if (!tts) {
    self.postMessage({ status: "error", data: "Model not initialized" });
    return;
  }

  if (type === 'preview') {
    await handlePreview(text, voice, speed);
    return;
  }

  const streamer = new TextSplitterStream();
  streamer.push(text);
  streamer.close();

  const speakerId = typeof voice === 'number' ? voice : parseInt(voice) || 0;
  const lengthScale = 1.0 / (speed || 1.0);

  const stream = tts.stream(streamer, {
    speakerId,
    lengthScale
  });
  const chunks = [];

  try {
    for await (const { text: chunkText, audio } of stream) {
      self.postMessage({
        status: "stream",
        chunk: {
          audio: audio.toBlob(),
          text: chunkText,
        },
      });
      chunks.push(audio);
    }
  } catch (error) {
    console.error("Error during streaming:", error);
    self.postMessage({ status: "error", data: error.message });
    return;
  }

  let audio;
  if (chunks.length > 0) {
    try {
      const originalSamplingRate = chunks[0].sampling_rate;
      const length = chunks.reduce((sum, chunk) => sum + chunk.audio.length, 0);
      let waveform = new Float32Array(length);
      let offset = 0;
      for (const chunk of chunks) {
        waveform.set(chunk.audio, offset);
        offset += chunk.audio.length;
      }

      normalizePeak(waveform, 0.9);
      waveform = trimSilence(waveform, 0.002, Math.floor(originalSamplingRate * 0.02));

      audio = new chunks[0].constructor(waveform, originalSamplingRate);
    } catch (error) {
      console.error("Error processing audio chunks:", error);
      self.postMessage({ status: "error", data: error.message });
      return;
    }
  }

  self.postMessage({ status: "complete", audio: audio?.toBlob() });
});

function normalizePeak(f32, target = 0.9) {
  if (!f32?.length) return;
  let max = 1e-9;
  for (let i = 0; i < f32.length; i++) max = Math.max(max, Math.abs(f32[i]));
  const g = Math.min(4, target / max);
  if (g < 1) {
    for (let i = 0; i < f32.length; i++) f32[i] *= g;
  }
}

function trimSilence(f32, thresh = 0.002, minSamples = 480) {
  let s = 0;
  let e = f32.length - 1;
  while (s < e && Math.abs(f32[s]) < thresh) s++;
  while (e > s && Math.abs(f32[e]) < thresh) e--;
  s = Math.max(0, s - minSamples);
  e = Math.min(f32.length, e + minSamples);
  return f32.slice(s, e);
}
