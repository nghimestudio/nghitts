<script setup>
import { ref, onMounted } from 'vue';

const emit = defineEmits(['text-click']);

const demos = ref([]);
const loading = ref(true);

// Format speaker name from filename
const formatSpeakerName = (filename) => {
  // Remove _demo suffix and split by underscore
  const name = filename.replace('_demo', '').replace('.txt', '').replace('.wav', '');
  // Convert to title case: my_tam -> My Tam
  return name.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Load demo data
const loadDemos = async () => {
  loading.value = true;
  const demoFiles = [
    { filename: 'duy_oryx_demo', speaker: 'Duy Oryx' },
    { filename: 'manh_dung_demo', speaker: 'Mạnh Dũng' },
    { filename: 'my_tam_demo', speaker: 'Mỹ Tâm' },
    { filename: 'ngoc_huyen_demo', speaker: 'Ngọc Huyền' },
    { filename: 'ngoc_ngan_demo', speaker: 'Ngọc Ngạn' },
    { filename: 'tran_thanh_demo', speaker: 'Trấn Thành' },
    { filename: 'viet_thao_demo', speaker: 'Việt Thảo' },
    { filename: 'minh_quang_demo', speaker: 'Minh Quang' }
  ];

  try {
    const demoPromises = demoFiles.map(async ({ filename, speaker }) => {
      try {
        const response = await fetch(`/demo/${filename}.txt`);
        if (!response.ok) throw new Error(`Failed to load ${filename}.txt`);
        const text = await response.text();
        return {
          text: text.trim(),
          speaker: speaker,
          audioUrl: `/demo/${filename}.wav`
        };
      } catch (error) {
        console.error(`Error loading ${filename}:`, error);
        return null;
      }
    });

    const results = await Promise.all(demoPromises);
    demos.value = results.filter(demo => demo !== null);
  } catch (error) {
    console.error('Error loading demos:', error);
  } finally {
    loading.value = false;
  }
};

const handleTextClick = (demoText) => {
  emit('text-click', demoText);
};

onMounted(() => {
  loadDemos();
});
</script>

<template>
  <div class="mt-8 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
    <div class="p-6">
      <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
        Demo Samples
      </h2>
      
      <div v-if="loading" class="flex items-center justify-center py-8">
        <div class="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
        <span class="ml-3 text-gray-600 dark:text-gray-400">Loading demos...</span>
      </div>

      <div v-else-if="demos.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
        No demo samples available
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse table-fixed">
          <thead>
            <tr class="border-b-2 border-gray-200 dark:border-gray-700">
              <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 w-2/5">Text</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 w-1/5">Speaker</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 w-2/5">Sample</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(demo, index) in demos" 
              :key="index"
              class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td 
                class="py-4 px-4 cursor-pointer text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors break-words"
                @click="handleTextClick(demo.text)"
                :title="'Click to use this text'"
              >
                {{ demo.text }}
              </td>
              <td class="py-4 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {{ demo.speaker }}
              </td>
              <td class="py-4 px-4">
                <audio 
                  :src="demo.audioUrl" 
                  controls
                  class="w-full min-w-[300px]"
                  preload="metadata"
                >
                  Your browser does not support the audio element.
                </audio>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

