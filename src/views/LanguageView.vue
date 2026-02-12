<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import {
  DownloadIcon,
  PauseIcon,
  PlayIcon,
  CopyIcon,
  CheckIcon,
} from 'lucide-vue-next';
import TextStatistics from '../components/TextStatistics.vue';
import SpeedControl from '../components/SpeedControl.vue';
import AudioChunk from '../components/AudioChunk.vue';
import ModelSelector from '../components/ModelSelector.vue';
import VoiceSelector from '../components/VoiceSelector.vue';
import { getModelsListUrl, DEFAULT_LANG_MODELS } from '../config.js';

const props = defineProps({
  lang: {
    type: String,
    required: true,
  },
});

const defaultText = {
  en: "The quick brown fox jumps over the lazy dog.",
  id: "Halo, selamat datang di dunia kecerdasan buatan.",
};

const text = ref(defaultText[props.lang] || defaultText.en);
const lastGeneration = ref(null);
const isPlaying = ref(false);
const currentChunkIndex = ref(-1);
const speed = ref(1);
const copied = ref(false);
const status = ref("idle");
const error = ref(null);
const worker = ref(null);
const voices = ref(null);
const selectedVoice = ref(0);
const chunks = ref([]);
const result = ref(null);
const availableModels = ref([]);
const selectedModel = ref("None");
const modelsLoading = ref(false);
const loadingProgress = ref(0);

const processed = computed(() => {
  return lastGeneration.value &&
      lastGeneration.value.text === text.value &&
      lastGeneration.value.speed === speed.value &&
      lastGeneration.value.voice === selectedVoice.value;
});

const setSpeed = (newSpeed) => {
  speed.value = newSpeed;
};

const setSelectedVoice = (voice) => {
  selectedVoice.value = voice;
};

const handleVoicePreview = (voiceId) => {
  if (!worker.value || status.value !== "ready") return;
  worker.value.postMessage({
    type: 'preview',
    text: props.lang === 'en' ? "Hello, this is a voice preview." : "Halo, ini adalah pratinjau suara.",
    voice: voiceId,
    speed: speed.value
  });
};

const restartWorker = (modelName = null) => {
  if (worker.value) {
    worker.value.terminate();
  }

  status.value = "loading";
  loadingProgress.value = 0;
  voices.value = null;
  chunks.value = [];
  result.value = null;
  lastGeneration.value = null;
  isPlaying.value = false;
  currentChunkIndex.value = -1;

  const progressInterval = setInterval(() => {
    if (loadingProgress.value < 90) {
      loadingProgress.value += Math.random() * 5;
      if (loadingProgress.value > 90) loadingProgress.value = 90;
    }
  }, 200);

  worker.value = new Worker(new URL("../workers/tts-worker-i18n.js", import.meta.url), {
    type: "module",
  });

  worker.value.addEventListener("message", onMessageReceived);
  worker.value.addEventListener("error", onErrorReceived);

  const modelToLoad = modelName || selectedModel.value;
  worker.value.postMessage({ type: 'init', lang: props.lang, model: modelToLoad });
  worker.value._progressInterval = progressInterval;
};

const setCurrentChunkIndex = (index) => {
  currentChunkIndex.value = index;
};

const setIsPlaying = (playing) => {
  isPlaying.value = playing;
};

const handleChunkEnd = () => {
  if (status.value !== "generating" && currentChunkIndex.value === chunks.value.length - 1) {
    isPlaying.value = false;
    currentChunkIndex.value = -1;
  } else {
    currentChunkIndex.value = currentChunkIndex.value + 1;
  }
};

const handlePlayPause = () => {
  if (!isPlaying.value && status.value === "ready" && !processed.value) {
    status.value = "generating";
    chunks.value = [];
    currentChunkIndex.value = 0;
    lastGeneration.value = {
      text: text.value,
      voice: selectedVoice.value,
      speed: speed.value
    };
    worker.value?.postMessage({
      text: text.value,
      voice: selectedVoice.value,
      speed: speed.value
    });
  }
  if (currentChunkIndex.value === -1) {
    currentChunkIndex.value = 0;
  }
  isPlaying.value = !isPlaying.value;
};

const downloadAudio = () => {
  if (!result.value) return;
  const url = URL.createObjectURL(result.value);
  const link = document.createElement("a");
  link.href = url;
  link.download = "audio.wav";
  link.click();
  URL.revokeObjectURL(url);
};

const handleCopy = async () => {
  await navigator.clipboard.writeText(text.value);
  copied.value = true;
  setTimeout(() => { copied.value = false }, 2000);
};

const fetchModels = async () => {
  modelsLoading.value = true;
  error.value = null;
  try {
    const url = getModelsListUrl(props.lang);
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const list = data.models || [];
      availableModels.value = list.length > 0 ? list : (DEFAULT_LANG_MODELS[props.lang] || []);
    } else {
      availableModels.value = DEFAULT_LANG_MODELS[props.lang] || [];
    }
    if (selectedModel.value && selectedModel.value !== "None" && !availableModels.value.includes(selectedModel.value)) {
      selectedModel.value = "None";
    }
  } catch (err) {
    console.error('Failed to fetch models:', err);
    availableModels.value = DEFAULT_LANG_MODELS[props.lang] || [];
  } finally {
    modelsLoading.value = false;
  }
};

const handleModelChange = (modelName) => {
  if (modelName !== selectedModel.value) {
    selectedModel.value = modelName;

    if (modelName === "None") {
      if (worker.value) {
        worker.value.terminate();
        worker.value = null;
      }
      status.value = "idle";
      voices.value = null;
      chunks.value = [];
      result.value = null;
      lastGeneration.value = null;
      isPlaying.value = false;
      currentChunkIndex.value = -1;
    } else {
      restartWorker(modelName);
    }
  }
};

const onMessageReceived = ({ data }) => {
  switch (data.status) {
    case "ready":
      if (worker.value?._progressInterval) {
        clearInterval(worker.value._progressInterval);
      }
      loadingProgress.value = 100;
      setTimeout(() => {
        status.value = "ready";
        loadingProgress.value = 0;
      }, 300);
      voices.value = data.voices;
      break;
    case "error":
      if (worker.value?._progressInterval) {
        clearInterval(worker.value._progressInterval);
      }
      loadingProgress.value = 0;
      status.value = "error";
      error.value = data.data;
      break;
    case "stream":
      chunks.value = [...chunks.value, data.chunk];
      break;
    case "complete":
      status.value = "ready";
      result.value = data.audio;
      break;
    case "preview":
      if (data.audio) {
        const audioUrl = URL.createObjectURL(data.audio);
        const audio = new Audio(audioUrl);
        audio.play().then(() => {
          setTimeout(() => URL.revokeObjectURL(audioUrl), 1000);
        }).catch(err => console.error('Error playing preview:', err));
      }
      break;
  }
};

const onErrorReceived = (e) => {
  console.error("Worker error:", e);
  error.value = e.message;
};

watch(() => props.lang, () => {
  text.value = defaultText[props.lang] || defaultText.en;
  selectedModel.value = "None";
  availableModels.value = [];
  if (worker.value) {
    worker.value.terminate();
    worker.value = null;
  }
  status.value = "idle";
  voices.value = null;
  chunks.value = [];
  result.value = null;
  lastGeneration.value = null;
  isPlaying.value = false;
  currentChunkIndex.value = -1;
  fetchModels();
}, { immediate: false });

onMounted(async () => {
  await fetchModels();
});

onUnmounted(() => {
  if (worker.value) {
    worker.value.terminate();
  }
});
</script>

<template>
  <div>
    <div class="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
      <div class="p-6 pb-0 space-y-6">
        <div class="space-y-4">
          <div class="relative">
            <textarea
              v-model="text"
              placeholder="Type or paste your text here..."
              class="w-full min-h-[180px] text-lg leading-relaxed resize-y p-4 pt-8 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-0 transition-colors"
              :class="voices ? '' : 'text-muted-foreground'"
            ></textarea>
            <button
              class="absolute top-1 right-3 h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
              @click="handleCopy"
              :title="copied ? 'Copied!' : 'Copy text'"
            >
              <CheckIcon v-if="copied" class="h-4 w-4 text-green-500" />
              <CopyIcon v-else class="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div class="flex justify-end">
            <TextStatistics :text="text" />
          </div>
        </div>

        <div class="space-y-4">
          <div v-if="availableModels.length > 0" class="flex items-center">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Model:</label>
            <ModelSelector
              :models="availableModels"
              :selected-model="selectedModel"
              @model-change="handleModelChange"
            />
          </div>

          <div v-if="modelsLoading" class="flex items-center gap-2 text-muted-foreground text-sm">
            <div class="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
            <span>Loading available models...</span>
          </div>

          <div v-if="voices" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex items-center">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Voice:</label>
              <VoiceSelector
                :voices="voices"
                :selected-voice="selectedVoice"
                @voice-change="setSelectedVoice"
                @voice-preview="handleVoicePreview"
              />
            </div>
            <div class="flex items-center">
              <SpeedControl
                :speed="speed"
                @speed-change="setSpeed"
              />
            </div>
          </div>

          <div v-else-if="error" class="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {{ error }}
          </div>
          <div v-else-if="selectedModel === 'None' && availableModels.length > 0" class="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm">
            Please select a model to start using TTS
          </div>
          <div v-else-if="availableModels.length === 0 && !modelsLoading" class="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg text-sm">
            No models available for this language. Add model files to <code class="text-xs">public/tts-model/{{ lang }}/</code> for local dev, or configure the API for production.
          </div>
          <div v-else-if="!voices && status === 'loading'" class="w-full flex items-center gap-3">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Loading model</span>
            <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300 ease-out flex items-center justify-end pr-2"
                :style="{ width: `${loadingProgress}%` }"
              >
                <span class="text-white text-xs font-semibold">{{ Math.round(loadingProgress) }}%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3">
          <button
            class="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
            :class="{
              'bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800 shadow-lg shadow-orange-500/25': isPlaying,
              'bg-blue-800 shadow-lg': !isPlaying
            }"
            @click="handlePlayPause"
            :disabled="(status === 'ready' && !isPlaying && !text) || (status !== 'ready' && chunks.length === 0)"
          >
            <PauseIcon v-if="isPlaying" class="w-5 h-5" />
            <PlayIcon v-else class="w-5 h-5" />
            <span v-if="isPlaying">Pause</span>
            <span v-else>{{ processed || status === 'generating' ? 'Play' : 'Generate' }}</span>
          </button>

          <button
            class="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="downloadAudio"
            :disabled="!result || status !== 'ready'"
          >
            <DownloadIcon class="w-4 h-4" />
            Download Audio
          </button>
        </div>

        <div class="w-0 h-0 hidden">
          <AudioChunk
            v-if="chunks.length > 0"
            v-for="(chunk, index) in chunks"
            :key="index"
            :audio="chunk.audio"
            :active="currentChunkIndex === index"
            :playing="isPlaying"
            class="hidden"
            @start="() => setCurrentChunkIndex(index)"
            @pause="() => { if (currentChunkIndex === index) setIsPlaying(false) }"
            @end="handleChunkEnd"
          />
        </div>
      </div>
    </div>
  </div>
</template>
