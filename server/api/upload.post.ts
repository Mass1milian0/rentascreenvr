import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/server/supabase'
import { readFiles } from 'h3-formidable'
import * as fs from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';
ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient<Database>(event)
    const session = await getUserSession(event)

    //get post data
    //@ts-ignore
    const { files, fields } = await readFiles(event, { maxFileSize: 5 * 1024 * 1024 * 1024 })
    const screen_id = fields.screenId


    if (!screen_id) {
        return { msg: 'screen_id is required', status: 400 }
    }

    if (!session.user) {
        return { msg: 'user not found', status: 400 }
    }
    const userid = (session.user as { id?: string })?.id || '000'

    const { data: screens, error: screenError } = await client
        .from('user_screens')
        .select('id')
        .eq('screen_id', screen_id)
        .eq('user', userid)
        .neq('status', 'Expired')
        .single()

    if (!screens) {
        return { msg: 'screen not found', status: 400 }
    }


    //check if there are files
    if (!files) {
        return { msg: 'no files found', status: 400 }
    }

    //check if screen folder exists if not create it
    try {
        await fs.access(`./screens/${screen_id}`)
    } catch (error) {
        //try to access the screen directory, if it doesn't exist create it
        try {
            await fs.access('./screens')
        } catch (error) {
            await fs.mkdir('./screens')
        }
        await fs.mkdir(`./screens/${screen_id}`)
    }

    //if there is anything in the folder delete it
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
    //only 1 file is allowed
    if (files.file.length > 1) {
        return { msg: 'only 1 file is allowed', status: 400 }
    }

    const file = files.file[0]

    //convert whatever video format to mp4
    //if not mp4
    if (file.originalFilename.split('.').pop() !== 'mp4'){
        await new Promise<void>((resolve, reject) => {
            ffmpeg(file.filepath)
                .outputOptions('-f', 'mp4') //high quality
                .outputOptions('-c:v', 'libx264') //high quality
                .outputOptions('-preset', 'slow') //high quality
                .outputOptions('-crf', '18') //high quality
                .outputOptions('-c:a', 'aac') //high quality
                .outputOptions('-b:a', '192k') //high quality
                .outputOptions('-movflags', 'faststart') //high quality
                .outputOptions('-vf', 'scale=1280:720') //high quality
                .outputOptions('-r', '30') //high quality
                .outputOptions('-pix_fmt', 'yuv420p') //high quality
                .outputOptions('-profile:v', 'main') //high quality
                .outputOptions('-level', '3.1') //high quality
                .on('end', () => {
                    resolve()
                })
                .on('error', (err: any) => {
                    reject(err)
                })
                .save(process.cwd() + `/screens/${screen_id}/video.mp4`)
        })
    }else {
        //move the file to the screen folder
        await fs.rename(file.filepath, process.cwd() + `/screens/${screen_id}/video.mp4`)
    }

    return { status: 200 }
})