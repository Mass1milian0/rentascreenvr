import { serverSupabaseServiceRole } from '#supabase/server'
import { Database } from '~/server/supabase'
import { ServerResponse } from 'http';
import  * as fs from 'fs'

export default defineEventHandler(async (event) => {
    const client = serverSupabaseServiceRole<Database>(event)
    const res = event.node.res
    const req = event.node.req
    const root = process.cwd()
    
    //get post data
    const screen_id = getRouterParam(event, 'video_id')

    function streamVideo(res : ServerResponse, videopath: string){
        const
        stat = fs.statSync(videopath),
        fileSize = stat.size,
        range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-")
            const start = parseInt(parts[0], 10)
            const end = parts[1] ?
                parseInt(parts[1], 10) :
                fileSize - 1
            const chunksize = (end - start) + 1
            const file = fs.createReadStream(videopath, {
                start,
                end
            })
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            }
            res.writeHead(206, head);
            file.pipe(res);
        }else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            }
            res.writeHead(200, head)
            fs.createReadStream
                (videopath).pipe(res)
        }
    }

    
    //check if screen exists, belongs to the user and is active
    
    if (!screen_id) {
        streamVideo(res,`${root}/screenerrors/screen_not_found.mp4`)
    }
    
    const { data: screens, error: screenError } = await client
        .from('user_screens').select('*').eq('screen_id', screen_id??'')
        .single()
        try {
            if (!screens) {
                streamVideo(res,`${root}/screenerrors/screen_not_found.mp4`)
            }else if(!(Object.keys(screens as object).length)){
                streamVideo(res,`${root}/screenerrors/screen_not_found.mp4`)
            }else if(screens.status === 'Offline'){
                streamVideo(res,`${root}/screenerrors/screen_offline.mp4`)
            }else if (screens.status === 'Expired'){
                streamVideo(res,`${root}/screenerrors/screen_not_found.mp4`)
            }else{
                streamVideo(res,`${root}/screens/${screen_id}/video.mp4`)
            }
        } catch (error) {
            streamVideo(res,`${root}/screenerrors/unexpected_error.mp4`)   
        }
})