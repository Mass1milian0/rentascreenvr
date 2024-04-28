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
    const index = parseInt(fields.index, 10)
    const totalChunks = parseInt(fields.totalChunks, 10)
    const originalFilename = fields.originalFileName[0]

    //if the folder screen_id or screens doesn't exist create it
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
    //check if there are files
    if (!files) {
        return { msg: 'no files found', status: 400 }
    }

    //only 1 file is allowed
    if (files.file.length > 1) {
        return { msg: 'only 1 file is allowed', status: 400 }
    }

    const file = files.file[0]
    try {
        const buffer = await fs.readFile(file.filepath)
        await fs.writeFile(`./screens/${screen_id}/chunk${index}`, buffer)
    } catch (error) {
        console.log("failed to write chunk")
        setResponseStatus(event, 500)
        return { status: 500 }
    }

    //if this is the last chunk, merge all chunks but because they might not come sequentially we must wait for all chunks to be uploaded
    //the index cannot be used reliably to check if all chunks are uploaded because it just shows which chunk is being uploaded at the moment
    //we must check if all chunks are uploaded by checking if the number of files in the folder is equal to the total number of chunks

    const filesInFolder2 = await fs.readdir(`./screens/${screen_id}`)

    if (filesInFolder2.length === totalChunks) {
        const chunks = []
        //we must read the chunks in order to merge them
        for (let i = 0; i < totalChunks; i++) {
            chunks.push(await fs.readFile(`./screens/${screen_id}/chunk${i}`))
        }
        try {
            await fs.writeFile(`./screens/${screen_id}/video`, Buffer.concat(chunks))
        } catch (error) {
            console.log(error)
        }
        //delete all chunks
        for (let i = 0; i < totalChunks; i++) {
            try {
                await fs.unlink(`./screens/${screen_id}/chunk${i}`)
            } catch (error) {
            }
        }

        let fileFinished = {
            originalFilename: originalFilename,
            filepath: `./screens/${screen_id}/video`
        }

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

        //convert whatever video format to mp4
        //if not mp4
        try {
            if (originalFilename.split('.').pop() !== 'mp4') {
                //if it doesn't exist, create a lock file, if it exists, return
                try {
                    await fs.access(`./screens/${screen_id}/lock`)
                    return { status: 200 }
                } catch (error) {
                    fs.writeFile(`./screens/${screen_id}/lock`, '')
                }
                try {
                    //first rename the file to video . it's original format so that ffmpeg can convert it to mp4
                    await fs.rename(fileFinished.filepath, `./screens/${screen_id}/video.${originalFilename.split('.').pop()}`)
                } catch (error) {
                }
                //update the fileFinished object
                fileFinished.filepath = `./screens/${screen_id}/video.${originalFilename.split('.').pop()}`
                await new Promise<void>((resolve, reject) => {
                    ffmpeg(fileFinished.filepath)
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
                        //remove the lock file and the original file
                        .on('end', async () => {
                            try {
                                await fs.unlink(`./screens/${screen_id}/video.${originalFilename.split('.').pop()}`)    
                            } catch (error) {
                                //retry after 1 second
                                setTimeout(async () => {
                                    await fs.unlink(`./screens/${screen_id}/video.${originalFilename.split('.').pop()}`)
                                }, 2000)
                            }
                            await fs.unlink(`./screens/${screen_id}/lock`)
                        })
                })
            } else {
                //move the file to the screen folder
                await fs.rename(fileFinished.filepath, process.cwd() + `/screens/${screen_id}/video.mp4`)
            }
            //check if video.mp4 exists in the folder
            try {
                await fs.access(`./screens/${screen_id}/video.mp4`)
                return { status: 201 }
            } catch (error) {
                return { status: 200 } //file hasn't been merged yet
            }
        } catch (error) {
            console.log(error)
        }

    }
    return { status: 200 }

})