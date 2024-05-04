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
  //clean the screen folder
    try {
      //check if the folder exists before hand, if it doesn't return
      try{
        await fs.access(`./screens/`)
      } catch (error) {
        return { status: 200 }
      }
      try {
          await fs.access(`./screens/${screen_id}`)
      } catch (error) {
        //if the folder doesn't exist, return 200, cuz it's already clean
        return { status: 200 }
      }
        await fs.rm(`./screens/${screen_id}/`, { recursive: true })
    } catch (error : any) {
        return { msg: error.message, status: 500 }
    }
})