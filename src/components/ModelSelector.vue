<script setup>
const props = defineProps({
  models: {
    type: Array,
    required: true
  },
  selectedModel: {
    type: String,
    required: false,
    default: "None"
  }
});

const emit = defineEmits(['modelChange']);

const handleModelChange = (event) => {
  emit('modelChange', event.target.value);
};
</script>

<template>
  <div class="relative flex-1">
    <select
      id="model-selector"
      :value="selectedModel" 
      @change="handleModelChange"
      class="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-8 dark:text-black"
    >
      <option value="None">None</option>
      <option 
        v-for="model in models" 
        :key="model" 
        :value="model"
      >
        {{ model }}
      </option>
    </select>
    <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
      <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </div>
  </div>
</template>

