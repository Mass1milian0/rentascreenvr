<template>
    <LandingContainer v-if="loggedIn">
        <div class="flex flex-col gap-10 justify-center min-w-full">
            <div class="text-center min-w-full border-b-[1px] rounded">
                <div class="mb-2">
                    <h1 class="text-lg text-gray-100">Welcome back {{user.username}}!</h1>
                    <h2 class="text-base text-gray-300">Here you can control your screens and your account</h2>
                </div>
            </div>
            <div class="text-center min-w-full border-b-[1px] rounded">
                <h1 class="text-lg text-gray-100">Screens</h1>
                <div class="lg:grid-cols-3 grid align-middle items-center gap-5">
                    <ProfileScreen :expires="calculateTimeFromToday(screen.expires_in)" :screenName=screen.name
                        :onlineState="screen.status === 'Online' ? true : false" :screenId=screen.screen_id
                        v-for="screen of userScreens" @refreshList="refetchUserScreens" />
                </div>
                <div v-if="!userScreens || Object.keys(userScreens).length === 0" class="text-gray-300 flex flex-wrap justify-center mt-2 mb-2">
                    <p>You currently have no Screens.<br><NuxtLink to="/purchase" class="text-blue-600">Click Here To Get One</NuxtLink></p>
                </div>
            </div>
        </div>
    </LandingContainer>
    <ProfileLoginErr v-else />
</template>

<script lang="ts" setup>
definePageMeta({
    layout: "landing"
});
const supabase = useSupabaseClient()
let { loggedIn, user, session, fetch, clear } = useUserSession();
let userScreens = ref()
if (loggedIn) {
    refetchUserScreens()
}
function calculateTimeFromToday(inputDateIso: string) {
    // Parse the input ISO date and the current date
    const inputDate = new Date(inputDateIso);
    const now = new Date();

    // Calculate the difference in milliseconds
    const differenceInTime = (new Date(inputDate)).getTime() - (new Date(now)).getTime();

    // Convert the difference in time to total hours
    const differenceInTotalHours = differenceInTime / (1000 * 3600);

    // Check if the difference is within 20 to 24 hours to round up to a day
    if (differenceInTotalHours >= 20) {
        const days = Math.ceil(differenceInTotalHours / 24);
        return days + " day(s)";
    } else if (differenceInTotalHours > 0) {
        // If less than 20 hours, show in hours
        return Math.round(differenceInTotalHours) + " hour(s)";
    } else {
        // If the date is in the past or exactly now
        return "0 hour(s)";
    }
}

async function refetchUserScreens(tries : number = 0) {
    let { data, error } = await supabase.from('user_screens').select('*').eq('user', user.value.id).neq('status', 'Expired')
    if (error) {
        console.error(error)
        if (tries < 3) {
            refetchUserScreens(tries + 1)
        }else {
            console.error("Failed to fetch user screens")
        }
    } else {
        userScreens.value = data
    }
}

</script>

<style scoped>
.text-6xl {
    font-size: 6rem;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.01562em;
    color: #fff;
    margin-top: 20%;
    margin-bottom: 20%;
}

.text-blue-600 {
    color: #2563EB;
    text-decoration: underline;
}

.link {
    cursor: pointer;
}

th {
    border-right: 1px solid #fff;
    border-bottom: 1px solid #fff;
}

td {
    border-right: 1px solid #fff;
    padding: 0.75rem;
}
</style>