<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';

const props = defineProps({
  audio: {
    type: Blob,
    required: true
  },
  active: {
    type: Boolean,
    required: true
  },
  playing: {
    type: Boolean,
    required: true
  },
  onStart: {
    type: Function,
    default: () => {}
  },
  onEnd: {
    type: Function,
    default: () => {}
  },
  onPause: {
    type: Function,
    default: () => {}
  }
});

const audioRef = ref(null);

// Create URL for the audio blob
const url = computed(() => {
  return URL.createObjectURL(props.audio);
});

const handlePause = () => {
  if (audioRef.value?.ended) return;
  props.onPause();
}

// Watch for changes in active/playing state
watch([() => props.active, () => props.playing], ([newActive, newPlaying]) => {
  if (!audioRef.value) return;
  if (!newActive) return;

  if (newPlaying) {
    if (audioRef.value.ended) {
      audioRef.value.currentTime = 0;
    }
    audioRef.value.play();
  } else {
    audioRef.value.pause();
  }
});

// Handle audio element lifecycle
onMounted(() => {
  if (!props.audio) return;
  if (!audioRef.value) return;

  if (props.active) {
    audioRef.value.play();
    audioRef.value.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  } else {
    audioRef.value.pause();
    audioRef.value.currentTime = 0;
  }
})

onUnmounted(() => {
  // Revoke the object URL to free memory
  URL.revokeObjectURL(url.value);
});
</script>

<template>
  <audio
    ref="audioRef"
    :src="url"
    controls
    @play="onStart"
    @pause="handlePause"
    @ended="onEnd"
  ></audio>
</template>
