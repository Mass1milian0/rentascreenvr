<template>
  <footer class="my-20">
    <div class="md:grid-cols-3 grid ml-4 justify-center content-center justify-items-center">
      <div>
        <p class="font-small text-m text-gray-800">Biondi LTD</p>
        <p class="text-left text-xs text leading-relaxed text-slate-500 mt-3">20-22 Wenlock Road, London, N1 7GU</p>
      </div>
      <div>
        <p class="font-small text-m text-gray-800">Mail and Info</p>
        <p class="text-left text-xs text leading-relaxed text-slate-500 mt-3">massimilianobiondi07@gmail.com</p>
        <NuxtLink target="_blank" to="https://discord.gg/dgM3VXbBVE" class="cursor-pointer text-blue-500">
          <p class="text-left text-xs text leading-relaxed text-slate-300 underline mt-3">RentAScreenVR Official Discord</p>
        </NuxtLink>
      </div>
      <div>
        <p class="font-small text-m text-gray-800">TOS</p>
        <NuxtLink to="/tos"> <p class="text-left text-xs text leading-relaxed text-slate-500 mt-3">Terms of Service</p></NuxtLink>
        <NuxtLink to="/privacy-policy"> <p class="text-left text-xs text leading-relaxed text-slate-500 mt-3">Privacy Policy</p></NuxtLink>
      </div>
    </div>
  </footer>
</template>
