<script setup>
import { computed } from 'vue';

const props = defineProps({
  text: {
    type: String,
    required: true
  }
});

const words = computed(() => {
  return props.text.trim() ? props.text.trim().split(/\s+/).length : 0;
});

const characters = computed(() => {
  return props.text.length;
});

const stats = computed(() => [
  { label: "Words", value: words.value },
  { label: "Characters", value: characters.value }
]);
</script>

<template>
  <div class="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
    <div v-for="stat in stats" :key="stat.label" class="flex gap-1.5">
      <span class="font-semibold">{{ stat.label }}:</span>
      <span class="font-medium">{{ stat.value }}</span>
    </div>
  </div>
</template>
