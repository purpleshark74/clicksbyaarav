'use server';

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from '@/lib/r2';
import { createClient } from '@/utils/supabase/server';
import crypto from "crypto";
import { cookies } from "next/headers";

export async function uploadFile(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file || file.size === 0) {
        return {success: false, error: 'No file provided.'};
    }

    try {
        const cookieStore = await cookies();
        const supabase = await createClient(cookieStore);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

    
        const fileKey = `${Date.now()}-${file.name}`;
        
        const r2PublicDomain = 'https://pub-4da73b765e5f4f8e80d161c0db017ad4.r2.dev';
        const displayUrl = `${r2PublicDomain}/${fileKey}`;

        await r2Client.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileKey,
            Body: Buffer.from(await file.arrayBuffer()),
            ContentType: file.type,
        }));

        const { data, error: dbError } = await supabase
            .from('photos')
            .insert([
                {
                    storage_key: fileKey,
                    display_url: displayUrl,
                    file_hash: fileHash,
                },
            ])
            .select()
            .single();

        if (dbError) {
            console.error('Supabase DB Error: ', dbError.message);
            return {success: false, error: 'Uploaded to R2 but failed to save to DB'};
        }

        return { success: true, key: fileKey, data};
    } catch (error) {
        console.error('Upload Process Error: ', error);
        return {success: false, error: 'An unexpected error occured during the upload.'};
    }

}