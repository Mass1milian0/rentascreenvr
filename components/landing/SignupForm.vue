<template>
  <div>
    <form
    id="form"
    class="needs-validation"
    @submit.prevent="submitForm"
  >
  <div class="mb-5">
      <label for="email_address" class="sr-only">Email Address</label
      ><input
        id="email_address"
        type="email"
        placeholder="Email Address"
        name="email"
        required
        class="w-full px-4 py-3 border-2 placeholder:text-gray-800 rounded-md outline-none focus:ring-4 border-gray-300 focus:border-gray-600 ring-gray-100 text-black"
        v-model="formData.email"
        />
      <div class=" text-red-400 text-sm mt-1" v-show="!validation.emptyMail">
        Please provide your email address.
      </div>
      <div class=" text-red-400 text-sm mt-1" v-show="!validation.email">
        Please provide a valid email address.
      </div>
    </div>
    <div class="mb-5">
      <input
        type="text"
        placeholder="Username"
        required
        class="w-full px-4 py-3 border-2 text-black placeholder:text-gray-800 rounded-md outline-none focus:ring-4 border-gray-300 focus:border-gray-600 ring-gray-100"
        name="name"
        v-model="formData.username"
      />
      <div class="  text-red-400 text-sm mt-1" v-show="!validation.username">
        Please provide your username.
      </div>
    </div>
    <div class="mb-5">
      <input
        type="password"
        placeholder="Password"
        required
        class="w-full px-4 py-3 border-2 text-black placeholder:text-gray-800 rounded-md outline-none focus:ring-4 border-gray-300 focus:border-gray-600 ring-gray-100"
        name="password"
        v-model="formData.password"
      />
      <div class="  text-red-400 text-sm mt-1" v-show="!validation.password">
        Please provide a valid password. <br>
        Password must contain at least one number and one uppercase and lowercase letter, and at least 8 or more characters
      </div>
    </div>
    <div class="mb-5">
      <input
        type="password"
        placeholder="Repeat Password"
        required
        class="w-full px-4 py-3 border-2 text-black placeholder:text-gray-800 rounded-md outline-none focus:ring-4 border-gray-300 focus:border-gray-600 ring-gray-100"
        name="repassword"
        v-model="formData.repassword"
      />
      <div class="  text-red-400 text-sm mt-1" v-show="!validation.repassword">
        Password doesn't match.
      </div>
    </div>

    <LandingButton type="submit" size="lg" class="mb-3" block>Sign Up</LandingButton>
    <NuxtLink to="/login" class="text-gray-600 underline">Login instead</NuxtLink>
  </form>
  </div>
</template>

<script lang="ts" setup>

let validation = reactive({
  username: true,
  emptyMail: true,
  email: true,
  password: true,
  repassword: true
})

const formData = ref({
  email: '',
  username: '',
  password: '',
  repassword: ''
})

function validateEmail(email: string) {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
}

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
  if(formData.value.email === '') {
    validation.emptyMail = formData.value.email !== '';
  }else{
    validation.email = validateEmail(formData.value.email);
  }
  validation.username = validateUsername(formData.value.username);
  validation.password = validatePassword(formData.value.password);
  validation.repassword = formData.value.password == formData.value.repassword;
  if(checkAllValidations()) {
    try {
      const data = await $fetch('/api/register',{
        method: 'POST',
        body: JSON.stringify(formData.value)
      })
      if(data.status === 302){
        //redirect to verify email page
        navigateTo('/verify-email')
      }else if(data.status === 400){
        //show error message
        alert((data as { msg?: string }).msg ? (data as { msg?: string }).msg : 'Something went wrong');
      }
    } catch (error) {
      
    }
  }
}

</script>

<style>

</style>