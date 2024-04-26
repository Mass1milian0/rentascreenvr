<template>
    <!-- Existing markup -->
    <div v-if="uploading" class="progress-container">
        <progress class="rounded-md border-0 bg-none block" :value="uploadProgress" max="100"></progress>
        <span>{{ uploadProgress }}%</span>
    </div>
</template>

<script lang="ts" setup>
defineProps({
    uploading: Boolean,
    uploadProgress: Number,
});
</script>
