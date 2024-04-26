<template>
    <button :class="classes">
        <slot />
    </button>
</template>

<script lang="ts" setup>
    defineProps({
        classes: {
            type: String,
            default: "border border-gray-200 rounded p-1 bg-white text-gray-900"
        }
    }) 
</script>

<style></style>