import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/server/supabase'
import { readFiles } from 'h3-formidable'
import * as fs from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';
ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');
import * as path from 'path';
import { createWriteStream } from 'fs';

// Keep track of uploaded chunks for each file
const uploadedChunks: { [key: string]: Set<number> } = {};

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient<Database>(event)
    const session = await getUserSession(event)

    //get post data
    //@ts-ignore
    const { files, fields } = await readFiles(event, { maxFileSize: 5 * 1024 * 1024 * 1024 })
    const screen_id = fields.screenId
    const chunkIndex = fields.chunkIndex
    const isCanceled = fields.isCanceled

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
    const file = files.file[0]

    // If the upload is canceled, delete the temporary file and the record of uploaded chunks
    if (isCanceled) {
        const tempFilePath = path.join(process.cwd(), `/screens/${screen_id}/temp.mp4`);
        await fs.unlink(tempFilePath);
        delete uploadedChunks[screen_id];
        return { status: 200, msg: 'Upload canceled' };
    }

    // Append chunk to temporary file
    const tempFilePath = path.join(process.cwd(), `/screens/${screen_id}/temp.mp4`);
    const writeStream = createWriteStream(tempFilePath, { flags: 'a' });
    writeStream.write(file);
    writeStream.end();

    // Record that this chunk has been uploaded
    if (!uploadedChunks[screen_id]) {
        uploadedChunks[screen_id] = new Set();
    }
    uploadedChunks[screen_id].add(chunkIndex);

    // If this is the last chunk, rename the temporary file to the final file name
    if (chunkIndex === fields.totalChunks - 1 && uploadedChunks[screen_id].size === fields.totalChunks) {
        const finalFilePath = path.join(process.cwd(), `/screens/${screen_id}/video.mp4`);
        await fs.rename(tempFilePath, finalFilePath);
        delete uploadedChunks[screen_id];
    }

    return { status: 200 }
})