<script setup>
import { RouterView } from 'vue-router';
import ThemeToggle from './components/ThemeToggle.vue';
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
          <nav class="flex items-center gap-2 text-sm">
            <router-link
              to="/"
              class="px-3 py-1.5 rounded-full transition-colors"
              :class="$route.path === '/' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
            >
              Tiếng Việt
            </router-link>
            <router-link
              to="/en"
              class="px-3 py-1.5 rounded-full transition-colors"
              :class="$route.path === '/en' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
            >
              English
            </router-link>
            <router-link
              to="/id"
              class="px-3 py-1.5 rounded-full transition-colors"
              :class="$route.path === '/id' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
            >
              Indonesia
            </router-link>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 pt-8 pb-4 max-w-4xl">
      <RouterView />
    </main>
  </div>
</template>
