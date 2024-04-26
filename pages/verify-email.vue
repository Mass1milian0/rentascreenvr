<template>
  <LandingContainer>
    <LandingSectionhead>
      <template v-slot:title>Verify your mail address</template>
      <template v-slot:desc
        >please check your inbox for a verification mail.</template
      >
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