<script setup>
const features = [
  {
    title: "Rent a screen",
    description:
      "first you need to rent a screen, you can do this by clicking the button in the navbar",
    icon: "bx:bxs-tv",
  },
  {
    title: "upload your video",
    description:
      "upload your video to your screen",
    icon: "bx:bx-upload",
  },
  {
    title: "paste the link",
    description:
      "paste the link in your media player and enjoy the movie with your friends",
    icon: "bx:bxs-paste",
  }
];
</script>

<template>
  <div class="mt-16 md:mt-0">
    <h2 class="text-4xl lg:text-5xl font-bold lg:tracking-tight">
      How does it work?
    </h2>
    <p class="text-lg mt-4 text-slate-600">
      this is how simple renting a screen is
    </p>
  </div>

  <div class="grid sm:grid-cols-2 md:grid-cols-3 mt-16 gap-16">
    <div v-for="item of features" class="flex gap-4 items-start">
      <div class="mt-1 bg-black rounded-full p-2 w-8 h-8 shrink-0">
        <Icon class="text-white" :name="item.icon" />
      </div>
      <div>
        <h3 class="font-semibold text-lg">{{ item.title }}</h3>
        <p class="text-slate-500 mt-2 leading-relaxed">
          {{ item.description }}
        </p>
      </div>
    </div>
  </div>
</template>
