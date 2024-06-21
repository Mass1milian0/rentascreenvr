<script setup lang="ts">
import { createRenderer } from 'vue';

definePageMeta({
  layout: "landing"
});
const route = useRoute()
const router = useRouter()
let screen = ref("");
if (route.query.screen) {
  if (Array.isArray(route.query.screen)) {
    // If it's an array, take the first element as the screenId (or handle as needed)
    screen.value = route.query.screen[0]??''; // if undefined, set to empty string
  } else {
    // If it's a string, use it directly
    screen.value = route.query.screen;
  }
  router.replace('/contact')
}
</script>

<template>
  <LandingContainer>
    <LandingSectionhead>
      <template v-slot:title>Contact</template>
      <template v-slot:desc>I am here to help.</template>
    </LandingSectionhead>

    <div class="grid md:grid-cols-2 gap-10 mx-auto max-w-4xl mt-16">
      <div>
        <h2 class="font-medium text-2xl text-gray-800">
          Contact The Rent A Screen VR Creator
        </h2>
        <p class="text-lg leading-relaxed text-slate-500 mt-3">
          Have something to say?<br>Want to report a Screen?<br>
          I'm here to help.<br>
          Fill up the Form or Send Email.
        </p>
        <div class="mt-5">
          <div class="flex items-center mt-2 space-x-2 text-gray-600">
            <Icon class="text-gray-400 w-4 h-4" name="uil:map-marker" />
            <span>20-22 Wenlock Rd London N1 7GU, UK</span>
          </div>
          <div class="flex items-center mt-2 space-x-2 text-gray-600">
            <Icon class="text-gray-400 w-4 h-4" name="uil:envelope" /><a href="mailto:massimilianobiondi07@gmail.com"
              style="color: rgb(176, 170, 159);">massimilianobiondi07@gmail.com</a>
          </div>
          <div class="flex items-center mt-2 space-x-2 text-gray-600">
            <Icon class="text-gray-400 w-4 h-4" name="prime:discord" /><a href="https://discord.gg/dgM3VXbBVE"
              style="color: rgb(176, 170, 159);">https://discord.gg/dgM3VXbBVE</a>
          </div>
        </div>
      </div>
      <div>
        <LandingContactform :preCompileHead="screen" />
      </div>
    </div>
  </LandingContainer>
</template>
