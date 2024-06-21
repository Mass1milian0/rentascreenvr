<script setup>
definePageMeta({
  layout: "landing"
});

const TeamImg1 = "/t3.jpg";
const TeamImg2 = "/t2.jpeg";

const team = [
  {
    name: "Massimiliano Biondi",
    title: "Mastermind",
    avatar: {
      src: TeamImg1,
      width: 400,
      height: 500,
    }
  },
  {
    name: 'SlyTheFloof',
    title: 'Operations Manager',
    avatar: {
      src: TeamImg2,
      width: 400,
      height: 500,
    }
  }
];
</script>

<template>
  <LandingContainer>
    <LandingSectionhead>
      <template v-slot:title>About</template>
      <template v-slot:desc>I'm a solo developer driven by curiosity.</template>
    </LandingSectionhead>

    <div class="flex flex-col gap-3 mx-auto max-w-4xl mt-16">
      <h2 class="font-bold text-3xl text-gray-800">
        Elevating the VR Experience Through Expertise.
      </h2>
      <p class="text-lg leading-relaxed text-slate-500">
        As a solo developer, I'm driven by curiosity and a passion for creating,
        I've been making code for over 5 years. I'm a self-taught developer and
        I'm always looking for new challenges and opportunities to learn and
        grow.
        <br/>
        My friends have helped me massively on this project and I'm grateful for all the help they've given me.
      </p>
    </div>
    <div class="grid md:grid-cols-2 gap-10 mx-auto max-w-lg mt-12">
      <div v-for="item of team" class="group">
        <div class="w-full aspect-square">
          <img :src="item.avatar.src" :width="item.avatar.width" :height="item.avatar.height" format="avif" alt="Team"
            class="w-full h-full object-cover rounded transition group-hover:-translate-y-1 group-hover:shadow-xl" />
        </div>

        <div class="mt-4 text-center">
          <h2 class="text-lg text-gray-800">{{ item.name }}</h2>
          <h3 class="text-sm text-slate-500">{{ item.title }}</h3>
        </div>
      </div>
    </div>
  </LandingContainer>
</template>
