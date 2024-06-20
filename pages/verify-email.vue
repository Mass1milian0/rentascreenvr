<template>
  <LandingContainer>
    <LandingSectionhead>
      <template v-slot:title>Verify your mail address</template>
      <template v-slot:desc>Please check both your Inbox and Spam folders for the account verification email.</template>
    </LandingSectionhead>
  </LandingContainer>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: "landing"
});
</script>

<style>

</style>