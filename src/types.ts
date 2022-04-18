export interface SynthesizerLambdaPayload {
    s3OutputKey: string;
    s3OutputBucket: string;
}

export interface UploadS3ObjectResponse {
    key: string;
}

export interface MultiVoicedPollyOptions {
    region: string;
    accountId: string;
}
