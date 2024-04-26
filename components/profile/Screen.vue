<template>
    <div class="flex flex-col gap-2 justify-center items-center text-center mb-2">
        <h3 class="text-base text-gray-300">{{ screenName }}</h3>
        <img :src="onlineState ? '/screen-online.png' : '/screen-offline.png'" alt="" class="max-w-xs">
        <p class="text-center self-center items-center content-center">Expires in: {{ expires }}</p>
        <div class="flex flex-row gap-3">
            <NuxtLink :to="'screens/' + screenId" v-if="!nogoto">
                <Button>
                    Go to Screen Settings
                </Button>
            </NuxtLink>
            <Button @click="getLink()" :classes="classes">
                {{ btnText }}
            </Button>
            <Button @click="turnOffScreen()" v-if="onlineState" classes="border border-gray-950 rounded p-1 bg-red-600 text-gray-100">
                Turn Off
            </Button>
            <Button @click="turnOnScreen()" v-else classes="border border-gray-950 rounded p-1 bg-green-600 text-gray-100">
                Turn On
            </Button>
        </div>
    </div>
</template>

<script lang="ts" setup>
const defaultBtn = "Get Link"
const requestUrl = useRequestURL()
let btnText = ref(defaultBtn)
let classes = ref("duration-100 transition-all ease-in-out border border-gray-200 rounded p-1 bg-white text-gray-900")
const props = defineProps({
    expires: {
        type: String,
        default: "1 Day"
    },
    screenName: {
        type: String,
        default: "Screen 1"
    },
    onlineState: {
        type: Boolean,
        default: true
    },
    screenId: {
        type: String,
        default: "1"
    },
    nogoto: Boolean
})
const emit = defineEmits(['refreshList'])
async function turnOffScreen() {
    //turn off screen
    let data = await $fetch('/api/requestScreenOff',{
        method: 'POST',
        body: JSON.stringify({
            screen_id: props.screenId
        })
    })
    if(data.status === 200) {
        emit('refreshList')
    }
}
async function turnOnScreen() {
    //turn on screen
    let data = await $fetch('/api/requestScreenOn',{
        method: 'POST',
        body: JSON.stringify({
            screen_id: props.screenId
        })
    })
    if(data.status === 200) {
        emit('refreshList')
    }
}
async function getLink() {
    //get current hostname
    let url = requestUrl.host + '/api/streamvideo/' + props.screenId
    //copy to clipboard
    navigator.clipboard.writeText(url)
    btnText.value = "Copied!"
    classes.value = "duration-100 transition-all ease-in-out border border-gray-950 rounded p-1 bg-green-600 text-gray-100"
    setTimeout(() => {
        btnText.value = defaultBtn,
        classes.value = "duration-100 transition-all ease-in-out border border-gray-200 rounded p-1 bg-white text-gray-900"
    }, 2000)
}
</script>

<style></style>