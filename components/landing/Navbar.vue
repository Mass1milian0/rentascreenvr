<script setup>
import { useRoute } from 'vue-router';
const menuitems = [
  {
    title: "Home",
    path: "/",
  },
  {
    title: "Pricing",
    path: "/pricing",
  },
  {
    title: "About",
    path: "/about",
  },
  {
    title: "Contact",
    path: "/contact",
  },
];
const open = ref(false);
//location updated in real time
let route = useRoute();
let location = ref(route.path);

//make sure location is reactive
watchEffect(() => {
  location.value = route.path;
});

let { loggedIn, user, session, clear, fetch } = useUserSession();

onMounted(() => {
  fetch();
});

</script>

<template>
    <header class="flex flex-col lg:flex-row justify-between items-center bg-zinc-900 rounded-2xl pl-4 pr-4 pb-1 fixed w-11/12 inset-x-0 mx-auto top-8">
      <div class="flex w-full lg:w-auto items-center justify-between">
        <a href="/" class="text-lg"><span class="font-bold text-slate-800">Rent A Screen </span><span
            class="text-slate-500">VR</span>
        </a>
        <div class="block lg:hidden">
          <button @click="open = !open" class="text-gray-800">
            <svg fill="currentColor" class="w-4 h-4" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <title>Menu</title>
              <path v-show="open" fill-rule="evenodd" clip-rule="evenodd"
                d="M18.278 16.864a1 1 0 01-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 01-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 011.414-1.414l4.829 4.828 4.828-4.828a1 1 0 111.414 1.414l-4.828 4.829 4.828 4.828z">
              </path>
              <path v-show="!open" fill-rule="evenodd"
                d="M4 5h16a1 1 0 010 2H4a1 1 0 110-2zm0 6h16a1 1 0 010 2H4a1 1 0 010-2zm0 6h16a1 1 0 010 2H4a1 1 0 010-2z">
              </path>
            </svg>
          </button>
        </div>
      </div>
      <nav class="w-full lg:w-auto mt-2 lg:flex lg:mt-0" :class="{ block: open, hidden: !open }">
        <ul class="flex flex-col lg:flex-row lg:gap-5">
          <li v-for="item of menuitems">
            <NuxtLink :href="item.path" class="flex lg:px-3 py-2 text-gray-600 hover:text-gray-900 pointer"
              :class="{ 'tabSelected': item.path == location }">
              {{ item.title }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink href="/purchase" class="flex lg:px-3 py-2 border rounded bg-white-important border-gray-100 text-gray-900 pointer" :class="{'tabSelected' : location == '/purchase'}">Rent a Screen</NuxtLink>
          </li>
        </ul>
        <div v-if="!loggedIn" class="lg:hidden flex items-center mt-3 gap-4">
          <LandingLink href="/login" styleName="muted" block size="md">Log in</LandingLink>
          <LandingLink href="/signup" size="md" block>Sign up</LandingLink>
        </div>
        <div v-else class="lg:hidden flex items-center mt-3 gap-4">
          <LandingLink href="/profile" styleName="muted" block size="md">{{ user.username }}</LandingLink>
          <LandingLink href="#" @click="clear" size="md" block>Log out</LandingLink>
        </div>
      </nav>
      <div v-if="!loggedIn">
        <div class="hidden lg:flex items-center mt-3 gap-4">
          <LandingLink href="/login" styleName="muted" class="h-10 border-0" size="md">Log in</LandingLink>
          <LandingLink href="/signup" size="md" class="h-10 border-0">Sign up</LandingLink>
        </div>
      </div>
      <div v-else>
        <div class="hidden lg:flex items-center mt-3 gap-5">
          <LandingUserprofile :username="user.username" />
          <LandingLink href="#" @click="clear" size="md" class="h-10 border-0 cursor-pointer">Log out</LandingLink>
        </div>
      </div>
    </header>
    <div class="mt-32"></div>
</template>