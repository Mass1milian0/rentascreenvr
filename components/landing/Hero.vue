<template>
  <main class="grid lg:grid-cols-2 place-items-center pt-16 pb-8 md:pt-8">
    <div class="p-24 md:order-1 hidden md:block -z-10">
      <img
        class="rounded-full transition-transform transform hover:scale-125"
        src="~/assets/img/hero.png"
        alt="virtual reality headset"
        loading="eager"
        format="avif"
        width="512"
        height="512"
      />
    </div>

    <div>
      <h1 class="text-5xl lg:text-6xl xl:text-7xl font-bold lg:tracking-tight">
        Your own cinema screen
      </h1>
      <p class="text-lg mt-4 text-slate-600 max-w-xl">
        Rent a screen VR is a platform that allows you to rent a virtual media server.
        You can use it to watch movies, with your friends, on virtually any media player.
      </p>
      <div class="mt-6 flex flex-col sm:flex-row gap-3">
        <LandingLink
          href="/purchase"
          target="_blank"
          rel="noopener"
          >Rent a screen</LandingLink
        >
      </div>
    </div>
  </main>
</template>
