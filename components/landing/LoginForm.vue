<template>
    <div>
        <form id="form" class="needs-validation" @submit.prevent="submitForm">
            <div class="mb-5">
                <input type="text" placeholder="Username" required
                    class="w-full px-4 py-3 border-2 text-black placeholder:text-gray-600 rounded-md outline-none focus:ring-4 border-gray-300 focus:border-gray-600 ring-gray-100"
                    name="name" v-model="formData.username" />
                <div class="  text-red-400 text-sm mt-1" v-show="!validation.username">
                    Please provide your username.
                </div>
            </div>
            <div class="mb-5">
                <input type="password" placeholder="Password" required
                    class="w-full px-4 py-3 border-2 text-black placeholder:text-gray-600 rounded-md outline-none focus:ring-4 border-gray-300 focus:border-gray-600 ring-gray-100"
                    name="password" v-model="formData.password" />
                <div class="  text-red-400 text-sm mt-1" v-show="!validation.password">
                    Please provide a valid password. <br>
                    Password must contain at least one number and one uppercase and lowercase letter, and at least 8 or more
                    characters
                </div>
            </div>
            <LandingButton type="submit" size="lg" class="mb-3" block>Log In</LandingButton>
            <NuxtLink to="/signup" class="text-gray-600 underline">Signup instead</NuxtLink>
        </form>
    </div>
</template>
  
<script lang="ts" setup>

let validation = reactive({
    username: true,
    password: true,
})

const formData = ref({
    email: '',
    username: '',
    password: '',
    repassword: ''
})

function validateUsername(username: string) {
    return username.length >= 4;
}

function validatePassword(password: string) {
    //must contain at least one number and one uppercase and lowercase letter, and at least 8 or more characters
    const re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    return re.test(password);
}

function checkAllValidations() {
    return Object.values(validation).every((v) => v);
}

const submitForm = async () => {
    validation.username = validateUsername(formData.value.username);
    validation.password = validatePassword(formData.value.password);
    if (checkAllValidations()) {
        try {
            const data = await $fetch('/api/login', {
                method: 'POST',
                body: JSON.stringify(formData.value)
            })
            await useUserSession().fetch();
            navigateTo('/')
        } catch (error) {

        }
    }
}

</script>
  
<style></style>