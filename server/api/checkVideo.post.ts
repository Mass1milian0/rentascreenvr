import * as fs from 'fs/promises';
import userCheck from '../middlewere/userCheck';
import screenCheck from '../middlewere/screenCheck';

export default defineEventHandler(async (event) => {
    //get post data
    const body = await readBody(event)
    const screen_id = body.screen_id

    //check if screen exists, belongs to the user and is active
    await userCheck(event);
    await screenCheck(event);

    //check if the lock file exists, if it does, return file exists status
    try {
        await fs.access(`./screens/${screen_id}/lock`)
        return { status: 104 }
    } catch (error) {
        return { status: 200 }
    }
})