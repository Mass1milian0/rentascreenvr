<template>
    <div @dragover.prevent="drag" @dragleave.prevent="drag" @drop.prevent="drop"
        class="flex flex-col justify-center items-center">
        <h2 class="text-gray-200 mt-2">upload a file</h2>
        <div class="border rounded flex justify-center content-center flex-wrap flex-col text-center items-center w-96"
            :class="dynamicClasses">
            <div v-if="showUpload">
                <div @click="triggerFileInput"
                    class="flex justify-center content-center flex-wrap flex-col text-center items-center">
                    <Icon name="bx:bx-upload" class="text-gray-200" size="100" />
                    <h1 class="text-gray-200 text-lg select-none mt-3">click or drag and drop to upload your video</h1>
                    <input type="file" class="hidden" ref="fileInput" @change="handleFile" />
                </div>
            </div>
            <div v-else class="flex justify-center content-center flex-wrap flex-col text-center items-center">
                <Loading class="flex justify-center content-center flex-wrap flex-row gap-4 text-center items-center"
                    :uploading="uploading" :uploadProgress="uploadProgress" />
            </div>
            <div v-if="successUpload"
                class="flex justify-center content-center flex-wrap flex-col text-center items-center">
                <h2 class="text-green-600 font-bold text-center">upload successful</h2>
            </div>
            <div v-if="mp4Warning"
                class="flex justify-center content-center flex-wrap flex-col text-center items-center">
                <h2 class="text-orange-500 font-bold text-center">Your file isn't an mp4<br />This is fine, but the
                    server has to process your video to make it an mp4 <br /> you will be sent an email when the process
                    ends</h2>
            </div>
            <div v-if="spinner" class="flex justify-center content-center flex-wrap flex-col text-center items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" width="200"
                    height="200" style="shape-rendering: auto; display: block; background: transparent;"
                    xmlns:xlink="http://www.w3.org/1999/xlink">
                    <g>
                        <path fill="none" stroke="#ffffff" stroke-width="13"
                            stroke-dasharray="151.3874676513672 105.20146057128906"
                            d="M24.3 30C11.4 30 5 43.3 5 50s6.4 20 19.3 20c19.3 0 32.1-40 51.4-40 C88.6 30 95 43.3 95 50s-6.4 20-19.3 20C56.4 70 43.6 30 24.3 30z"
                            stroke-linecap="round" style="transform:scale(0.64);transform-origin:50px 50px">
                            <animate attributeName="stroke-dashoffset" repeatCount="indefinite" dur="1s" keyTimes="0;1"
                                values="0;256.58892822265625"></animate>
                        </path>
                        <g></g>
                    </g>
                </svg>
                <h2>Processing your video, this might take a while</h2>
                <h2>you can safely close the page, we will notify you when the processing is finished</h2>
            </div>
        </div>
    </div>
</template>

<style></style>

<script lang="ts" setup>
let dynamicClasses = ref("")
let showUpload = ref(true) //true
const fileInput = ref<HTMLElement | null>(null);
let uploading = ref(false) //false
let uploadProgress = ref(0)
let successUpload = ref(false) //false
let spinner = ref(false) //false
let mp4Warning = ref(false) //false
const props = defineProps({
    screenId: String
})

function triggerFileInput() {
    fileInput.value?.click();
}

let isBeingProcessed = await $fetch('/api/checkVideo', {
    method: 'POST',
    body: JSON.stringify({ screen_id: props?.screenId ?? '' })
})
if (isBeingProcessed.status == 104) {
    spinner.value = true;
}

async function handleFile(event: Event) {
    const input = fileInput.value as HTMLInputElement;
    //only 1 file is allowed and it must be a video of any type
    if (input.files && input.files.length > 0) {
        if (input.files.length > 1) {
            alert("Only one file is allowed")
            return;
        }
        if (!input.files[0].type.includes("video")) {
            alert("Only video files are allowed")
            return;
        }
        //if video is not mp4 show a warning
        if (!input.files[0].type.includes("mp4")) {
            mp4Warning.value = true;
        }
        const file = input.files[0];
        showUpload.value = false;
        uploading.value = true;
        try {
            let res = await $fetch('/api/requestCleanFolderScreen', {
                method: 'POST',
                body: JSON.stringify({ screen_id: props?.screenId ?? '' })
            })
        } catch (e) {
            alert("Failed to clean the folder on the server, please try again later")
        }

        //chunk the files limit to 10MB chunks, create an index for each chunk, send to the server the index the total number of chunks and the chunk itself
        //to the chunk assign a unique id, the server will store the chunks in a temporary folder, once all chunks are received, the server will merge the chunks

        const chunkSize = 2 * 1024 * 1024;
        const totalChunks = Math.ceil(file.size / chunkSize);
        const chunkIds = Array.from({ length: totalChunks }, (_, i) => i);

        async function uploadChunk(chunk: Blob, index: number, retries: number = 0) {
            const formData = new FormData();
            formData.append('file', chunk);
            formData.append('screenId', props?.screenId ?? '');
            formData.append('index', index.toString());
            formData.append('totalChunks', totalChunks.toString());
            formData.append('originalFileName', file.name);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 40 * 1000);
            try {
                let response = await $fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                if (response.status != 200) {
                    //retry the chunk
                    if (retries < 3) {
                        throw new Error("Failed to upload the chunk") //automatically it will be caught by the catch block and retry the group
                    }
                }
            }
            catch (e) {
                clearTimeout(timeoutId);
                if (retries < 3) {
                    await uploadChunk(chunk, index, retries + 1);
                } else {
                    throw new Error("Failed to upload the chunk") //automatically it will be caught by the catch block and retry the group
                }
            }
        }
        //send concurrently chunks in groups of 5 wait for the group to finish before sending the next group
        const chunkGroups = chunkIds.reduce((acc, curr, index) => {
            if (index % 5 === 0) {
                acc.push([curr]);
            } else {
                acc[acc.length - 1].push(curr);
            }
            return acc;
        }, [] as number[][]);
        for (const chunkGroup of chunkGroups) {
            let promises
            //if last group, instead of sending concurrently send sequentially one by one
            if (chunkGroup[chunkGroup.length - 1] === totalChunks - 1) {
                for (const index of chunkGroup) {
                    const start = index * chunkSize;
                    const end = Math.min(file.size, (index + 1) * chunkSize);
                    const chunk = file.slice(start, end);
                    await uploadChunk(chunk, index);
                }
                uploadProgress.value = Math.round((chunkGroup[chunkGroup.length - 1] / totalChunks) * 100);
                break;
            } else {
                promises = await Promise.allSettled(chunkGroup.map(async index => {
                    const start = index * chunkSize;
                    const end = Math.min(file.size, (index + 1) * chunkSize);
                    const chunk = file.slice(start, end);
                    await uploadChunk(chunk, index);
                }));
            }
            //update the progress
            uploadProgress.value = Math.round((chunkGroup[chunkGroup.length - 1] / totalChunks) * 100);
        }
        //set the spinner and set upload to 100% and wait for the server to finish processing the video
        spinner.value = true;
        uploadProgress.value = 100;
        let response = await $fetch('/api/checkVideo', {
            method: 'POST',
            body: JSON.stringify({ screen_id: props?.screenId ?? '' })
        });
        let status = response.status;
        if (status === 200) {
            spinner.value = false;
            successUpload.value = true;
            uploading.value = false;
            mp4Warning.value = false;
            setTimeout(() => {
                successUpload.value = false;
                uploading.value = false;
                uploadProgress.value = 0;
                showUpload.value = true;
                dynamicClasses.value = ""
                spinner.value = false;
                clearInterval(interval);
            }, 2 * 1000);
        }
        let interval = setInterval(async () => {
            let response = await $fetch('/api/checkVideo', {
                method: 'POST',
                body: JSON.stringify({ screen_id: props?.screenId ?? '' })
            });
            let status = response.status;
            if (status === 200) {
                spinner.value = false;
                successUpload.value = true;
                mp4Warning.value = false;
                uploading.value = false;
                setTimeout(() => {
                    successUpload.value = false;
                    uploading.value = false;
                    uploadProgress.value = 0;
                    showUpload.value = true;
                    dynamicClasses.value = ""
                    spinner.value = false;
                    mp4Warning.value = false;
                    clearInterval(interval);
                }, 2 * 1000);
            }
        }, 5 * 1000);

    }
}

function drop(dragEvent: DragEvent) {
    dragEvent.preventDefault();
    //move the file to the input
    const file = dragEvent.dataTransfer?.files[0];
    if (file) {
        const input = fileInput.value as HTMLInputElement;
        input.files = dragEvent.dataTransfer?.files;
    }
    handleFile(dragEvent);
}

function drag(dragEvent: DragEvent) {
    dragEvent.preventDefault()
    if (dragEvent.type === "dragover" || dragEvent.type === "dragenter") {
        dynamicClasses.value = "border-green-600"
    } else {
        dynamicClasses.value = ""
    }
}
</script>
