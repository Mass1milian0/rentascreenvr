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
                <Loading class="flex justify-center content-center flex-wrap flex-row gap-4 text-center items-center" :uploading="uploading" :uploadProgress="uploadProgress" />
            </div>
            <div v-if="successUpload"
                class="flex justify-center content-center flex-wrap flex-col text-center items-center">
                <h2 class="text-green-600 font-bold text-center">upload successful</h2>
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
                <h2>Please do not reload the page and or close it</h2>
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
const props = defineProps({
    screenId: String
})

function triggerFileInput() {
    fileInput.value?.click();
}

async function handleFile(event: Event) {
    const input = fileInput.value as HTMLInputElement;
    if (input.files && input.files.length > 0) {
        if (input.files.length > 1) {
            alert("Only one file is allowed")
            return;
        }
        if (!input.files[0].type.includes("video")) {
            alert("Only video files are allowed")
            return;
        }
        const file = input.files[0];
        const chunkSize = 1024 * 1024 * 5; // 5MB
        const totalChunks = Math.ceil(file.size / chunkSize);
        showUpload.value = false;
        uploading.value = true;
        for (let i = 0; i < totalChunks; i++) {
            let retries = 3;
            while (retries > 0) {
                try {
                    const blob = file.slice(i * chunkSize, (i + 1) * chunkSize);
                    const formData = new FormData();
                    formData.append('file', blob, `${i}`);
                    formData.append('screenId', props?.screenId ?? '');
                    formData.append('chunkIndex', `${i}`);
                    formData.append('totalChunks', `${totalChunks}`);
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', '/api/upload', true);
                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable) {
                            uploadProgress.value = Math.round((e.loaded / e.total) * 100);
                            if (uploadProgress.value === 100) {
                                showUpload.value = false;
                                spinner.value = true;
                            }
                        }
                    }
                    xhr.onreadystatechange = () => {
                        if (xhr.readyState === 4 && xhr.status === 200) {
                            spinner.value = false;
                            successUpload.value = true;
                            setTimeout(() => {
                                successUpload.value = false;
                                uploading.value = false;
                                uploadProgress.value = 0;
                                showUpload.value = true;
                                dynamicClasses.value = ""
                            }, 2*1000);
                        }
                    }
                    xhr.send(formData);
                    break; // Break the retry loop if the upload was successful
                } catch (error) {
                    retries--;
                    if (retries === 0) {
                        alert('Failed to upload file after 3 attempts');
                        return;
                    }
                }
            }
        }
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
