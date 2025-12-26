<template>
  <button
    @click="toggleTheme"
    class="p-2 rounded-full transition-all duration-200 ease-in-out bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
    :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
  >
    <transition name="icon-fade" mode="out-in">
      <SunIcon v-if="isDark" key="sun" class="w-5 h-5" />
      <MoonIcon v-else key="moon" class="w-5 h-5" />
    </transition>
  </button>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { SunIcon, MoonIcon } from 'lucide-vue-next';

const isDark = ref(false);

const toggleTheme = () => {
  isDark.value = !isDark.value;
};

const applyTheme = (dark) => {
  if (dark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('theme', dark ? 'dark' : 'light');
};

watch(isDark, (newValue) => {
  applyTheme(newValue);
});

onMounted(() => {
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme) {
    isDark.value = savedTheme === 'dark';
  } else {
    isDark.value = systemPrefersDark;
  }
  
  applyTheme(isDark.value);
});
</script>

<style scoped>
.icon-fade-enter-active,
.icon-fade-leave-active {
  transition: all 0.2s ease-in-out;
}

.icon-fade-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.8);
}

.icon-fade-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.8);
}
</style>