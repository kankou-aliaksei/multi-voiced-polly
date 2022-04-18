import fs from 'fs';

import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand, DeleteObjectCommand, GetObjectCommandOutput
} from '@aws-sdk/client-s3';
import { InvokeCommand, InvokeCommandOutput, Lambda } from '@aws-sdk/client-lambda';
import { PutObjectCommandInput } from '@aws-sdk/client-s3/dist-types/commands/PutObjectCommand';
import { MultiVoicedPollyOptions, SynthesizerLambdaPayload, UploadS3ObjectResponse } from './types';

const BUCKET_PREFIX: string = 'multi-voiced-polly';
const LAMBDA_SYNTHESIZER_NAME: string = 'multiVoicedPolly';

export class MultiVoicedPolly {
    private readonly inputBucket: string;
    private readonly outputBucket: string;
    private readonly s3Client: S3Client;
    private readonly lambdaClient: Lambda;
    private isInputUploaded: boolean = false;
    private isOutputAdded: boolean = false;

    public constructor(
        private readonly options: MultiVoicedPollyOptions) {
        this.inputBucket = `${BUCKET_PREFIX}-input-${options.accountId}-${options.region}`;
        this.outputBucket = `${BUCKET_PREFIX}-output-${options.accountId}-${options.region}`;
        this.s3Client = new S3Client({ region: options.region });
        this.lambdaClient = new Lambda({ region: options.region });
    }

    public async synthesizeSpeech(inputFilename: string, outputFilename: string): Promise<void> {
        let inputKey: string | undefined;
        let outputKey: string | undefined;

        try {
            const { key } = await this.uploadObject(inputFilename);
            inputKey = key;
            this.isInputUploaded = true;
            const synthesizerLambdaPayload: SynthesizerLambdaPayload = await this.invokeSynthesizerLambda(inputKey);
            this.isOutputAdded = true;
            outputKey = synthesizerLambdaPayload.s3OutputKey;
            await this.saveObjectToLocal(outputFilename, outputKey, this.outputBucket);
        } catch (e) {
            throw e;
        } finally {
            if (this.isInputUploaded && inputKey) {
                await this.deleteObject(inputKey, this.inputBucket);
            }
            if (this.isOutputAdded && outputKey) {
                await this.deleteObject(outputKey, this.outputBucket);
            }
        }
    }

    private readonly uploadObject = async (filename: string): Promise<UploadS3ObjectResponse> => {
        const readStream: fs.ReadStream = fs.createReadStream(filename);
        const key: string = `${Date.now()}.txt`;

        const input: PutObjectCommandInput = {
            Body: readStream,
            Bucket: this.inputBucket,
            Key: key,
        };

        const command: PutObjectCommand = new PutObjectCommand(input);

        await this.s3Client.send(command);

        return {
            key,
        };
    }

    private readonly saveObjectToLocal = async (filename: string, key: string, bucket: string): Promise<void> => {
        const response: GetObjectCommandOutput = await this.s3Client.send(new GetObjectCommand({
            Key: key,
            Bucket: bucket,
        }));

        const file: fs.WriteStream = fs.createWriteStream(filename);

        return new Promise((resolve: (value: (void)) => void, reject: (reason: Error) => void): void => {
            const stream: fs.WriteStream = (response.Body as NodeJS.ReadableStream).pipe(file);
            stream.on('error', reject);
            stream.on('close', resolve);
        });
    }

    private readonly invokeSynthesizerLambda = async (key: string): Promise<SynthesizerLambdaPayload> => {
        const output: InvokeCommandOutput = await this.lambdaClient.send(new InvokeCommand({
            FunctionName: LAMBDA_SYNTHESIZER_NAME,
            Payload: new TextEncoder().encode(JSON.stringify({
                s3InputKey: key
            })),
        }));
        return JSON
            .parse(new TextDecoder('utf-8').decode(output.Payload) || '{}') as SynthesizerLambdaPayload;
    }

    private readonly deleteObject = async (key: string, bucket: string): Promise<void> => {
        await this.s3Client.send(new DeleteObjectCommand({
            Key: key,
            Bucket: bucket,
        }));
    }
}
