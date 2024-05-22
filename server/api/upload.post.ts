import formidable from "formidable";
import * as fs from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';
import userCheck from '../middlewere/userCheck';
import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/server/supabase';
import child from 'child_process';
import { Resend } from "resend";
import type { H3Event } from 'h3';
import { getCookie } from 'h3';

ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');

export const config = {
    api: {
        bodyParser: false,
    },
};

// Function to get video metadata using ffprobe
function getVideoMetadata(filePath: string): Promise<ffmpeg.FfprobeData> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                reject(err);
            } else {
                resolve(metadata);
            }
        });
    });
}
async function createCheckLockfile(screen_id: string | string[] | undefined) {
    try {
        await fs.access(`./screens/${screen_id}/lock`);
        console.log('Lockfile exists, skipping');
        return false;
    }
    catch (error) {
        await fs.writeFile(`./screens/${screen_id}/lock`, '');
        return true;
    }
}
// Function to prepare the prepend video based on the main video's attributes
async function preparePrependVideo(mainVideoPath: string, prependVideoPath: string, prepareForProcession: boolean = false, screen_id: string | string[] | undefined) {
    if (await createCheckLockfile(screen_id)) {
        try {
            const metadata = await getVideoMetadata(mainVideoPath);
            const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');

            if (!videoStream) {
                throw new Error('No video stream found in main video');
            }
            const crf = videoStream.tags?.['lavfi.ravg_crf'] || 23;
            const { width, height, r_frame_rate, codec_name, pix_fmt } = videoStream;
            const outputPrependPath = `./screens/${screen_id}/prepend_prepared.mp4`;

            return new Promise((resolve, reject) => {
                ffmpeg(prependVideoPath)
                    .outputOptions([
                        `-vf scale=${width}:${height},setsar=1`, // Scale video and then set SAR
                        `-r ${r_frame_rate}`,           // Match frame rate
                        `-c:v ${prepareForProcession ? 'libx264' : codec_name}`, // Encode video using libx264
                        `-preset veryfast`,             // Use a fast preset to speed up processing
                        `-crf ${prepareForProcession ? '23' : crf}`,                      // Set the Constant Rate Factor to 23
                        `-c:a aac`,                     // Encode audio using AAC
                        `-movflags faststart`,          // Move the moov atom to the beginning of the file
                        `-pix_fmt ${prepareForProcession ? pix_fmt : 'yuv420p'}`,             // Set pixel format
                    ])
                    .on('end', () => {
                        console.log('Prepend video has been prepared.');
                        fs.unlink(`./screens/${screen_id}/lock`)
                        resolve(outputPrependPath);
                    })
                    .on('error', (err) => {
                        console.error('Error preparing prepend video:', err);
                        reject(err);
                    })
                    .save(outputPrependPath);
            });
        } catch (error) {
            console.error('Error preparing prepend video:', error);
            throw error;
        }
    } else {
        console.log('Lockfile exists, skipping');
    }
}
async function deleteChunks(screen_id: string | string[] | undefined) {
    //read the directory, find all the chunks and delete them
    const files = await fs.readdir(`./screens/${screen_id}`);
    for (const file of files) {
        if (file.startsWith('chunk')) {
            await fs.unlink(`./screens/${screen_id}/${file}`);
        }
    }
    await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, 1000);
    });
}
async function mergeChunks(screen_id: string | string[] | undefined, totalChunks: number, originalFilename: string) {
    if (await createCheckLockfile(screen_id)) {
        //this should never happen, but we will create a lock file to tell the client that the server is processing the video
        const chunks = [];
        try {
            for (let i = 0; i < totalChunks; i++) {
                chunks.push(await fs.readFile(`./screens/${screen_id}/chunk${i}`));
            }
        } catch (error) {
            throw error;
        }

        try {
            await fs.writeFile(`./screens/${screen_id}/video`, Buffer.concat(chunks));
        } catch (error) {
            console.log(error);
        }
        try {
            fs.rename(`./screens/${screen_id}/video`, `./screens/${screen_id}/video.${originalFilename.split('.').pop()}`);
        } catch (error) {
        }
        let fileFinished = {
            originalFilename,
            filepath: `./screens/${screen_id}/video.${originalFilename.split('.').pop()}`
        };
        //delete the lock file
        await fs.unlink(`./screens/${screen_id}/lock`);
        return fileFinished;
    }
}

async function processVideoAndMerge(prependVideoPath: string, fileFinished: { filepath: string, originalFilename: string }, outputFilepath: string, screen_id: string | string[] | undefined, originalFilename: string) {
    if (await createCheckLockfile(screen_id) === false) return { status: 200 };
    await new Promise<void>((resolve, reject) => {
        ffmpeg()
            .input(prependVideoPath)
            .input(fileFinished.filepath)
            .complexFilter([
                {
                    filter: 'concat', options: { n: 2, v: 1, a: 1 }, inputs: ['0:v', '0:a', '1:v', '1:a'], outputs: ['video', 'audio']
                }
            ], ['video', 'audio'])
            .outputOptions([
                '-c:v libx264',
                '-preset faster',
                '-crf 23',
                '-c:a aac',
                '-movflags faststart',
                '-pix_fmt yuv420p',
                '-profile:v main',
                '-level 3.1',
            ])
            .on('end', () => {
                resolve();
            })
            .on('error', (err, stdout, stderr) => {
                console.error('Error:', err.message);
                console.error('ffmpeg stdout:', stdout);
                console.error('ffmpeg stderr:', stderr);
                reject(err);
            })
            .on('stderr', (stderrLine) => {
                console.log('Stderr output:', stderrLine);
            })
            .on('progress', (progress) => {
                console.log('Processing: ' + progress.percent + '% done');
            })
            .on('start', (commandLine) => {
                console.log('Spawned Ffmpeg with command: ' + commandLine);
            })
            .on('stdout', (stdoutLine) => {
                console.log('Stdout output:', stdoutLine);
            })
            .save(outputFilepath);
    });

    await Promise.all([
        fs.unlink(`./screens/${screen_id}/video.${originalFilename.split('.').pop()}`),
        fs.unlink(`./screens/${screen_id}/lock`)
    ]);
}

async function mergeVideos(prependVideoPath: string, mainVideoPath: string, outputFilepath: string, temp: string, screen_id: string | string[] | undefined) {
    //use MP4Box to concatenate the videos, prepend video first then the main video
    if (await createCheckLockfile(screen_id) === false) return { status: 200 };
    const childProcess = child.spawn('MP4Box', ['-cat', prependVideoPath, '-cat', mainVideoPath, '-new', temp]);
    return new Promise<void>((resolve, reject) => {
        childProcess.on('exit', async () => {
            await fs.unlink(outputFilepath)
            await fs.unlink(`./screens/${screen_id}/lock`)
            await fs.rename(temp, outputFilepath)
            resolve();
        });
        childProcess.on('error', (err) => {
            console.log(err);
            reject(err);
        });
        childProcess.stdout?.on('data', (data) => {
            console.log(data.toString());
        });
        childProcess.stderr?.on('data', (data) => {
            console.error(data.toString());
        });
    });
}

export default defineEventHandler(async (event) => {
    async function getUserSession(event: H3Event) {
        const session = getCookie(event, 'session');
        return session ? JSON.parse(session) : null;
    }
    const client = await serverSupabaseClient<Database>(event);
    const session = await getUserSession(event);
    const runtimeConfig = useRuntimeConfig(event);
    const resend = new Resend(runtimeConfig.RESEND_API_KEY);
    // Parse form data
    const form = formidable({});
    let files, fields;
    try {
        [fields, files] = await form.parse(event.node.req);
    } catch (error) {
        console.log(error);
        return { msg: 'Failed to read files', status: 400 };
    }

    const screen_id = fields.screenId;
    const index = parseInt(fields.index?.[0] ?? '0', 10);
    const totalChunks = parseInt(fields.totalChunks?.[0] ?? '0', 10);
    const originalFilename = fields.originalFileName?.[0] ?? '';

    // Ensure the folder exists
    try {
        await fs.access('./screens');
    } catch (error) {
        await fs.mkdir('./screens');
    }
    try {
        await fs.access(`./screens/${screen_id}`);
    } catch (error) {
        await fs.mkdir(`./screens/${screen_id}`);
    }

    if (!files || !files.file) {
        return { msg: 'No files found', status: 400 };
    }

    if (files.file.length > 1) {
        return { msg: 'Only one file is allowed', status: 400 };
    }

    const file = files.file[0];
    try {
        const buffer = await fs.readFile(file.filepath);
        await fs.writeFile(`./screens/${screen_id}/chunk${index}`, buffer);
    } catch (error) {
        console.log("Failed to write chunk");
        setResponseStatus(event, 500);
        return { status: 500 };
    }

    const filesInFolder = await fs.readdir(`./screens/${screen_id}`);
    if (filesInFolder.length === totalChunks) {

        await userCheck(event);

        if (!screen_id) {
            return { msg: 'screen_id is required', status: 400 };
        }

        const { data: screens, error: screenError } = await client
            .from('user_screens')
            .select('id')
            .eq('screen_id', screen_id)
            .eq('user', (session.user as { id: string }).id)
            .neq('status', 'Expired')
            .single();

        if (!screens) {
            return { msg: 'screen not found', status: 400 };
        }

        const { data: userMail, error: err } = await client
            .from('users')
            .select('email')
            .eq('id', (session.user as { id: string }).id)
            .single();


        //at this point, we are safe to merge the chunks, however, we need to stop the retry mechanism on the front
        //which will wait for the response from the server, 40 seconds after the last chunk is uploaded after the last chunk is uploaded again
        //so we send a 200 response to the client while we merge the chunks
        event.node.res.end();
        let fileFinished;
        try {
            fileFinished = await mergeChunks(screen_id, totalChunks, originalFilename);
        } catch (error) {
            //retry 3 times before failing
            for (let i = 0; i < 3; i++) {
                await new Promise<void>((resolve, reject) => {
                    setTimeout(() => {
                        resolve();
                    }, 1000);
                });
                try {
                    fileFinished = await mergeChunks(screen_id, totalChunks, originalFilename);
                    break;
                } catch (error) {
                    console.log(error);
                }
            }
        }
        // Prepare prepend video
        let prependVideoPath = './screenerrors/prepend.mp4';
        if (!fileFinished) return { status: 500 };
        let isntMp4 = fileFinished.originalFilename.split('.').pop() !== 'mp4';
        await preparePrependVideo(fileFinished.filepath, prependVideoPath, isntMp4, screen_id);
        prependVideoPath = `./screens/${screen_id}/prepend_prepared.mp4`;
        let outputFilepath = `./screens/${screen_id}/video.mp4`;
        // Convert and merge the video
        await new Promise<void>((resolve, reject) => { //wait for the lock file to be deleted
            setTimeout(() => {
                resolve();
            }, 1000);
        });
        if (isntMp4) {
            await processVideoAndMerge(prependVideoPath, fileFinished, outputFilepath, screen_id, originalFilename);
            let email_template: string = await useStorage('assets:server').getItem('email_template.html') ?? 'your video is ready! <a href="{{screenLink}}">Click here to view</a>';
            //in the email template, replace the placeholders that are defined by {{}} with the actual values
            //replace all screenLink with the actual screen link
            email_template = email_template.replace(/{{screenLink}}/g, `https://rentascreenvr.com/screens/${screen_id}`);
            if (userMail?.email) {
                await resend.emails.send({
                    from: 'notify@rentascreenvr.com',
                    to: userMail.email,
                    subject: 'Your video is ready!',
                    html: email_template,
                })
            }
        } else {
            let temp = `./screens/${screen_id}/video_tmp.mp4`;
            await mergeVideos(prependVideoPath, fileFinished.filepath, outputFilepath, temp, screen_id);
        }
        deleteChunks(screen_id);
        await fs.unlink(prependVideoPath);
        return;
    }

    return { status: 200 };
});