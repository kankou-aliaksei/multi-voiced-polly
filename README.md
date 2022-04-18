# multi-voiced-polly

Multi-voiced Polly helps to turn text into lifelike speech with multiple voices in the same audio file.

# Warning

The library uses AWS Cloud Resources and you have to pay for it

# Prerequisites

* AWS Account
* npm
* Base AWS Infrastructure (see **Deploy base infrastructure** section)

# Deploy base infrastructure

* 
    ```
    git clone https://github.com/kankou-aliaksei/multi-voiced-polly-infra.git
    ```
* 
    ```
    cd multi-voiced-polly-infra
    ```
  
* Configure AWS Credentials
* 
  ```
  npm i && npm run build && npm run deploy
  ```



# How to use

## Code example

```
const { MultiVoicedPolly } = require('multi-voiced-polly');

const multiVoicedPolly = new MultiVoicedPolly({
    accountId: '123456789876',
    region: 'us-east-1',
});

const inputFilename = 'input-text.txt';
const outputFilename = 'output.mp3';

multiVoicedPolly.synthesizeSpeech(inputFilename, outputFilename).then();
```

## Input file example (e.g. input-text.txt)

```
@Matthew I really want to go to the beach this weekend.
@Joanna That sounds like fun. What's the weather going to be like?
@Matthew I heard that it's going to be warm this weekend.
@Kimberly Is it going to be perfect beach weather?
@Joanna I believe so.
```

## Available voices

* Salli
* Joanna
* Kendra
* Ivy
* Kimberly
* Kevin
* Matthew
* Justin
* Joey

# IAM Policy

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject"
            ],
            "Resource": [
                "arn:aws:s3:::multi-voiced-polly-input-<accountId>-<region>/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject"
            ],
            "Resource": [
                "arn:aws:s3:::multi-voiced-polly-output-<accountId>-<region>/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:DeleteObject"
            ],
            "Resource": [
                "arn:aws:s3:::multi-voiced-polly-input-<accountId>-<region>/*",
                "arn:aws:s3:::multi-voiced-polly-output-<accountId>-<region>/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction"
            ],
            "Resource": [
                "arn:aws:lambda:<region>:<accountId>:function:multiVoicedPolly"
            ]
        }
    ]
}
```
