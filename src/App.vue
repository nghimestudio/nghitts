<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import {
  DownloadIcon,
  PauseIcon,
  PlayIcon,
  CopyIcon,
  CheckIcon,
  GithubIcon,
  ExternalLinkIcon,
  Heart
} from 'lucide-vue-next';
import TextStatistics from './components/TextStatistics.vue';
import SpeedControl from './components/SpeedControl.vue';
import ThemeToggle from './components/ThemeToggle.vue';
import AudioChunk from './components/AudioChunk.vue';
import ModelSelector from './components/ModelSelector.vue';
import DemoTable from './components/DemoTable.vue';
import { fetchAvailableModels } from './utils/model-detector.js';

// State variables
const text = ref(
    "Con đang quán chiếu con là một cây hoa bồ công anh. Mỗi ngày con phơi những cánh lá của con trong không gian và tiếp thu tất cả những mầu nhiệm của sự sống. Cũng như các loài sinh vật khác, con dự tính cho sự tiếp nối đẹp đẽ của mình. Mỗi mùa xuân con làm ra nhiều bông hoa màu vàng, mỗi ngày những bông hoa đó lớn lên, nở ra rực rỡ"
);
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

// Computed properties
const processed = computed(() => {
  return lastGeneration.value &&
      lastGeneration.value.text === text.value &&
      lastGeneration.value.speed === speed.value &&
      lastGeneration.value.voice === selectedVoice.value;
});

// Methods
const setSpeed = (newSpeed) => {
  speed.value = newSpeed;
};

const restartWorker = (modelName = null) => {
  if (worker.value) {
    worker.value.terminate();
  }
  
  // Reset all audio and UI state
  status.value = "loading";
  loadingProgress.value = 0;
  voices.value = null;
  chunks.value = [];
  result.value = null;
  lastGeneration.value = null; // Reset so button shows "Generate"
  isPlaying.value = false;
  currentChunkIndex.value = -1;
  
  // Simulate progress animation
  const progressInterval = setInterval(() => {
    if (loadingProgress.value < 90) {
      loadingProgress.value += Math.random() * 5;
      if (loadingProgress.value > 90) loadingProgress.value = 90;
    }
  }, 200);
  
  worker.value = new Worker(new URL("./workers/tts-worker.js", import.meta.url), {
    type: "module",
  });
  
  worker.value.addEventListener("message", onMessageReceived);
  worker.value.addEventListener("error", onErrorReceived);
  
  // Send init message with model name
  const modelToLoad = modelName || selectedModel.value;
  worker.value.postMessage({ type: 'init', model: modelToLoad });
  
  // Store interval to clear it when done
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
    const params = { 
      text: text.value, 
      voice: selectedVoice.value, 
      speed: speed.value
    };
    lastGeneration.value = params;
    worker.value?.postMessage(params);
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
}

const handleCopy = async () => {
  await navigator.clipboard.writeText(text.value);
  copied.value = true;
  setTimeout(() => { copied.value = false }, 2000);
}

const handleDemoTextClick = (demoText) => {
  text.value = demoText;
}

const fetchModels = async () => {
  modelsLoading.value = true;
  try {
    const models = await fetchAvailableModels();
    availableModels.value = models;
    
    // Keep "None" as default, don't auto-select a model
    // If selected model is no longer available and it's not "None", reset to "None"
    if (selectedModel.value && selectedModel.value !== "None" && !models.includes(selectedModel.value)) {
      selectedModel.value = "None";
      // Clear worker if model is no longer available
      if (worker.value) {
        worker.value.terminate();
        worker.value = null;
        status.value = "loading";
        voices.value = null;
      }
    }
  } catch (err) {
    console.error('Failed to fetch models:', err);
    error.value = `Failed to load models: ${err.message}`;
  } finally {
    modelsLoading.value = false;
  }
};

const handleModelChange = (modelName) => {
  if (modelName !== selectedModel.value) {
    selectedModel.value = modelName;
    
    if (modelName === "None") {
      // Clear worker and reset state when "None" is selected
      if (worker.value) {
        worker.value.terminate();
        worker.value = null;
      }
      status.value = "loading";
      voices.value = null;
      chunks.value = [];
      result.value = null;
      lastGeneration.value = null;
      isPlaying.value = false;
      currentChunkIndex.value = -1;
    } else {
      // Restart worker with new model
      restartWorker(modelName);
    }
  }
};

// Worker message handlers
const onMessageReceived = ({ data }) => {
  switch (data.status) {
    case "ready":
      // Complete progress and set ready
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
      // Stop progress on error
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
      // Play preview audio immediately
      if (data.audio) {
        const audioUrl = URL.createObjectURL(data.audio);
        const audio = new Audio(audioUrl);
        audio.play().then(() => {
          // Clean up URL after playing
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

// Worker setup
onMounted(async () => {
  // Fetch available models first
  await fetchModels();
  
  // Don't auto-start worker - wait for user to select a model
  // Worker will be started when user selects a model from dropdown
});

// Cleanup
onUnmounted(() => {
  if (worker.value) {
    worker.value.terminate();
  }
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800 transition-colors duration-300">
    <!-- Header -->
    <header class="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50">
      <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="text-3xl">🗣️</div>
          <div>
            <h1 class="text-xl font-bold bg-gradient-to-r text-blue-800 dark:text-blue-500">
              NGHI-TTS
            </h1>
            <p class="text-sm text-muted-foreground hidden sm:block">Local text-to-speech in your browser</p>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- <a 
            href="https://github.com/sponsors/clowerweb" 
            target="_blank"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full bg-pink-100 hover:bg-pink-200 dark:bg-pink-900/30 dark:hover:bg-pink-900/50 text-pink-700 dark:text-pink-300 transition-colors"
            title="Support this project"
          >
            <Heart class="w-4 h-4" />
            <span class="hidden sm:inline">Sponsor</span>
          </a> -->
          <!-- <a 
            href="https://github.com/clowerweb/piper-tts-web-demo"
            target="_blank"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <GithubIcon class="w-4 h-4" />
            <span class="hidden sm:inline">GitHub</span>
            <ExternalLinkIcon class="w-3 h-3" />
          </a> -->
          <ThemeToggle />
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 pt-8 pb-4 max-w-4xl">
      <!-- Main Card -->
      <div class="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
        <div class="p-6 pb-0 space-y-6">
          <!-- Text Input Section -->
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

          <!-- Controls Section -->
          <div class="space-y-4">
            <!-- Model Selection -->
            <div v-if="availableModels.length > 0" class="flex items-center">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                Model:
              </label>
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

            <div v-if="voices" class="flex items-center">
              <SpeedControl
                :speed="speed"
                @speed-change="setSpeed"
              />
            </div>

            <div v-else-if="error" class="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {{ error }}
            </div>
            <div v-else-if="selectedModel === 'None'" class="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm">
              Please select a model to start using TTS
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

          <!-- Action Buttons -->
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

          <!-- Hidden Audio Chunks -->
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

      <!-- Demo Table -->
      <DemoTable @text-click="handleDemoTextClick" />
    </main>
  </div>
</template>
