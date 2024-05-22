// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app : {
    head : {
      title : "Rent A Screen VR",
      meta : [
        {
          charset : "utf-8"
        },
        {
          name : "viewport",
          content : "width=device-width, initial-scale=1"
        },
        {
          hid : "description",
          name : "description",
          content : "Rent A Screen VR is a platform that allows you to rent a screen in virtual reality and watch your favorite movies, series, or virtually anything."
        },
        {
          hid: 'og:title',
          property: 'og:title',
          content: 'Rent A Screen VR'
        },
        {
          hid: 'og:description',
          property: 'og:description',
          content: 'Rent your own screens.'
        },
        {
          hid: 'og:image',
          property: 'og:image',
          content: 'https://rentascreenvr.com/icon.png'
        }
      ],
      link: [{ rel: 'icon', type: 'image/png', href: "/favicon.png" }]
    }
  },
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  runtimeConfig : {
    WEB3FORM_ACCESS_KEY : process.env.WEB3FORM_ACCESS_KEY,
    STRIPE_SK : process.env.STRIPE_SK,
    STRIPE_WEBHOOK_SECRET : process.env.STRIPE_WEBHOOK_SECRET,
    NUXT_SESSION_PASSWORD : process.env.NUXT_SESSION_PASSWORD,
    SUPABASE_URL : process.env.SUPABASE_URL,
    SUPABASE_KEY : process.env.SUPABASE_KEY,
    RESEND_API_KEY : process.env.RESEND_API_KEY,
    public: {
      STRIPE_PK : process.env.STRIPE_PK,
    },
    session:{
      password : process.env.NUXT_SESSION_PASSWORD
    }
  },
  supabase:{
    redirect : false
  },
  modules: ["nuxt-icon", "@nuxtjs/supabase", "@nuxtjs/tailwindcss", "nuxt-headlessui", "@vee-validate/nuxt", '@pinia/nuxt'],
  veeValidate: {
    // disable or enable auto imports
    autoImports: true,
    // Use different names for components
    componentNames: {
      Form: 'VeeForm',
      Field: 'VeeField',
      FieldArray: 'VeeFieldArray',
      ErrorMessage: 'VeeErrorMessage',
    },
  }
});
