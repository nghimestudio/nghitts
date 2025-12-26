<script setup>
import { PlayIcon } from 'lucide-vue-next';

const props = defineProps({
  voices: {
    type: Array,
    required: true
  },
  selectedVoice: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['voiceChange', 'voicePreview']);

const handleVoiceChange = (event) => {
  emit('voiceChange', parseInt(event.target.value));
};

const handlePreview = (voiceId) => {
  emit('voicePreview', voiceId);
};
</script>

<template>
  <div class="flex items-center gap-2">
    <div class="relative flex-1">
      <select
        id="voice-selector"
        :value="selectedVoice" 
        @change="handleVoiceChange"
        class="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-8 dark:text-black"
      >
        <option 
          v-for="voice in voices" 
          :key="voice.id" 
          :value="voice.id"
        >
          {{ voice.name }}
        </option>
      </select>
      <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
    </div>
    <button
      @click="handlePreview(selectedVoice)"
      class="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      title="Preview this voice"
    >
      <PlayIcon class="w-4 h-4 text-gray-600" />
    </button>
  </div>
</template>
