<template>
    <LandingContainer>
      <LandingSectionhead>
        <template v-slot:title>Login</template>
        <template v-slot:desc
          >Login into your account to manage your screens.</template
        >
      </LandingSectionhead>
      <div class="flex flex-col md:flex-row gap-3 mx-auto max-w-xl mt-16">
          <div class="w-80 mr-8">
              <LandingLoginForm/>
          </div>
          <div>
              <img class="w-80" src="~assets/img/hero.png" alt="signup" />
          </div>
      </div>
    </LandingContainer>
  </template>
  
  <script lang="ts" setup>
  definePageMeta({
    layout: "landing"
  });
  </script>
  
  <style>
  
  </style>