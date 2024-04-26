<script setup lang="ts">
const props = defineProps({
  preCompileHead: {
    type: String,
    default: ''
  }
})
import * as yup from 'yup';
const schema = ref({
  name: yup.string().required(),
  email: yup.string().email().required(),
  message: yup.string().required(),
})
async function submit(values: any, formActions: any) {
  const url = '/api/contact';
  const formData = {
    name: values.name,
    email: values.email,
    message: values.message,
  };
  let res = await $fetch(url, {
    method: 'POST',
    body: JSON.stringify(formData),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  formActions.resetForm();
}
</script>

<template>

  <VeeForm :validation-schema="schema"  class="flex flex-col flex-auto"
    @submit="submit">
    <VeeField type="text" name="name" placeholder="Full Name" class="form-input text-black" />
    <VeeErrorMessage name="name" class="invalid-feedback" >
      <p class="invalid-feedback">name is required</p>
    </VeeErrorMessage>
    <VeeField type="email" name="email" placeholder="Email Address" class="form-input text-black" />
    <VeeErrorMessage name="email">
      <p class="invalid-feedback">email is invalid</p>
    </VeeErrorMessage>
    <VeeField as="textarea" name="message" placeholder="Your Message" class="form-textarea text-black" rows=5 :value="preCompileHead? 'issue with screen: '+preCompileHead+'\n' : ''"/>
    <VeeErrorMessage name="textarea" class="invalid-feedback" >
      <p class="invalid-feedback">message is required</p>
    </VeeErrorMessage>
    <button class="landing-button mt-1">Submit</button>
  </VeeForm>
</template>

<style>
.form-input,
.form-textarea {
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.25rem;
}

.invalid-feedback {
  color: #dc3545;
  margin-top: 0.5rem;
}

.was-validated .form-input:invalid,
.was-validated .form-textarea:invalid {
  border-color: #dc3545;
}

.was-validated .form-input:invalid~.invalid-feedback,
.was-validated .form-textarea:invalid~.invalid-feedback {
  display: block;
}

.landing-button {
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.landing-button:hover {
  background-color: #0056b3;
}
</style>