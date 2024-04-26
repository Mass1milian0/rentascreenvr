export default defineEventHandler(async (event) => {
    const runtimeConfig = await useRuntimeConfig()

    const body = await readBody(event)
    body['access_key'] = runtimeConfig.WEB3FORM_ACCESS_KEY
    try {
        let res: any = await $fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body
        })
        if (res.status === 200) {
            return { body: res, status: 200 }
        }
    } catch (e) {
        return { body: e, status: 500 }
    }
})