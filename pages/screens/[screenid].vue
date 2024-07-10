<template>
  <LandingContainer>
    <div class="flex flex-col gap-10 justify-center min-w-full content-center flex-wrap text-center"
      v-if="screenFound && loggedIn">
      <div>
        <h1 class="text-xl text-gray-200">Screen Settings</h1>
        <h2 class="text-gray-400">Here you can control your screen settings</h2>
      </div>
      <div>
        <h2 class="text-lg text-gray-200">Screen Status</h2>
        <div class="lg:grid-cols-2 grid gap-10 justify-items-center lg:justify-items-stretch">
          <ProfileScreen :nogoto="true" :expires="calculateTimeFromToday(screenData.expires_in)"
            :screenName="screenData.name" :onlineState="screenData.status === 'Online' ? true : false"
            @refreshList="refresh()" :screenId=screenData.screen_id />
          <div class="mt-10 flex flex-col gap-4 min-w-full items-stretch">
            <Button @click="dialog = true">Change name</Button>
            <ModalDialog :open="dialog" @close="dialog = false">
              <div class="flex flex-col justify-center content-center p-5">
                <h1>Give your screen a new name</h1>
                <span class="flex flex-row border-2 rounded-2xl !border-gray-700 border-solid">
                  <input type="text" placeholder="Your new screen name" required
                    class="w-full px-4 py-3 bg-gray-200 text-gray-900 rounded-2xl rounded-tr-none rounded-br-none !placeholder:text-gray-800 "
                    name="name" v-model="newName" />
                  <Button @click="sendNewScreenName()"
                    classes="bg-green-600 hover:bg-green-400 w-2/12 rounded-2xl rounded-tl-none rounded-bl-none">Change</Button>
                </span>
              </div>
            </ModalDialog>
            <Button @click="requestLinkRegen()" :classes="regenClasses">{{ regenText }}</Button>
            <a class="w-full" :href="'/contact?screen='+screenId">
              <Button classes="border border-gray-950 rounded p-1 bg-orange-600 text-gray-100 w-full">Report an issue</Button>
            </a>
            <Button @click="requestScreenReset()" classes="border border-gray-950 rounded p-1 bg-red-600 text-gray-100">{{resetText}}</Button>
          </div>
        </div>
        <ProfileScreenform class="mt-2" :screenId="screenId"/>
      </div>
    </div>
    <ProfileLoginErr v-else-if="!loggedIn" />
    <div v-else>
      <h1 class="text-6xl center">The screen you are trying to access is either expired or doesn't exists</h1>
    </div>
  </LandingContainer>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: "landing",
});
let { loggedIn, user, session, fetch, clear } = useUserSession();
let screenFound = ref(false)
let screenData = ref()
let dialog = ref(false)
let newName = defineModel('')
let regenText = ref('Regenerate Link')
let resetText = ref('Reset Screen')
let regenClasses = ref('border border-gray-950 rounded p-1 bg-white text-gray-900')
const route = useRoute()
const router = useRouter()
let screenId = ref('');
if (Array.isArray(route.params.screenid)) {
  // If it's an array, take the first element as the screenId (or handle as needed)
  screenId.value = route.params.screenid[0];
} else {
  // If it's a string, use it directly
  screenId.value = route.params.screenid;
}
const { data, status, error, refresh } = await useFetch(`/api/getScreen/${screenId.value}`)
screenFound.value = data ? true : false
screenData.value = (data.value as any).screens
if (route.query.regen) {
  regenText.value = 'Link Regenerated'
  regenClasses.value = 'border border-green-600 rounded p-1 bg-green-600 text-gray-100'
  setTimeout(() => {
    regenText.value = 'Regenerate Link'
    regenClasses.value = 'border border-gray-950 rounded p-1 bg-white text-gray-900'
    router.replace('/screens/' + screenId.value)
  }, 5000)
}
if (loggedIn) {
  refresh()
  screenFound.value = data ? true : false
  screenData.value = (data.value as any).screens
}

async function requestScreenReset(){
  let res = await $fetch('/api/requestScreenReset', {
    method: 'POST',
    body: JSON.stringify({
      screen_id: screenId.value
    })
  })
  if(res.status == 200){
    resetText.value = 'Screen has been reset'
    setTimeout(() => {
      resetText.value = 'Reset Screen'
    }, 5000)
  }else {
    resetText.value = 'Error resetting screen'
    setTimeout(() => {
      resetText.value = 'Reset Screen'
    }, 5000)
  }
}
function calculateTimeFromToday(inputDateIso: string) {
  // Parse the input ISO date and the current date
  const inputDate = new Date(inputDateIso);
  const now = new Date();

  // Calculate the difference in milliseconds
  const differenceInTime = (new Date(inputDate)).getTime() - (new Date(now)).getTime();

  // Convert the difference in time to total hours
  const differenceInTotalHours = differenceInTime / (1000 * 3600);

  // Check if the difference is within 20 to 24 hours to round up to a day
  if (differenceInTotalHours >= 20) {
    const days = Math.ceil(differenceInTotalHours / 24);
    return days + " day(s)";
  } else if (differenceInTotalHours > 0) {
    // If less than 20 hours, show in hours
    return Math.round(differenceInTotalHours) + " hour(s)";
  } else {
    // If the date is in the past or exactly now
    return "0 hour(s)";
  }
}

async function sendNewScreenName() {
  //send new screen name
  await $fetch('/api/requestScreenChangeName', {
    method: 'POST',
    body: JSON.stringify({
      screen_id: screenId.value,
      new_name: newName.value
    })
  })
  dialog.value = false
  refresh()
}

async function requestLinkRegen() {
  let res = await $fetch('/api/requestScreenLinkRegen', {
    method: 'POST',
    body: JSON.stringify({
      screen_id: screenId.value
    })
  })

  navigateTo('/screens/' + (res as any).newId + '?regen=true')
}
</script>

<style></style>