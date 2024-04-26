<template>
    <span class="flex flex-row justify-center items-center pointer" @click="navigateTo('/profile')">
        <img src="~/assets/img/hero.png" alt="profile icon" class="lg:max-w-10 mr-2 border border-black rounded-full">
        <span class="text-gray-200">{{ username }}</span>
    </span>
</template>

<style>
</style>

<script lang="ts" setup>
defineProps({
    username: {
        type: String,
        default: ""
    }
})
</script>