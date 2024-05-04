import * as fs from 'fs/promises';
import screenCheck from "../middlewere/screenCheck"
import userCheck from "../middlewere/userCheck"

export default defineEventHandler(async (event) => {   
    //get post data
    const body = await readBody(event)
    const screen_id = body.screen_id
    
    //check if screen exists, belongs to the user and is active
    await userCheck(event);
    await screenCheck(event);
    //check if the screen folder exists
    try {
        await fs.access(`./screens/${screen_id}`)
    } catch (error) {
    }
    const filesInFolder = await fs.readdir(`./screens/${screen_id}`)
    for (const file of filesInFolder) {
        try {
            await fs.unlink(`./screens/${screen_id}/${file}`)
        } catch (error) {
            //if it fails to delete the file, try again max 3 times waiting 5 seconds between each try
            for (let i = 0; i < 3; i++) {
                try {
                    await fs.unlink(`./screens/${screen_id}/${file}`)
                    break
                } catch (error) {
                    await new Promise<void>((resolve) => {
                        setTimeout(() => {
                            resolve()
                        }, 5000)
                    })
                    if(i === 2) return { msg: 'failed to delete file', status: 500 }
                }
            }           
        }
    }
    return { status: 200 }
})