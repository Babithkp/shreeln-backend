import { Request, Response } from "express";import dotenv from "dotenv";
dotenv.config();
import {
  DeleteObjectCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";

const region = process.env.AWS_REGION;
const bucketName = process.env.AWS_BUCKET_NAME;
const accessKeyId = process.env.AWS_ACCESS_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
  throw new Error(
    "AWS_REGION and AWS_ACCESS_ KEY and AWS_SECRET_ACCESS_KEY are required"
  );
}

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});
const s3uploadFile = async (files: any) => {
  return await Promise.all(
    files.map(async (file: { originalname: string; buffer: Buffer }) => {
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: bucketName,
          Key: `lorryReceipts/${file.originalname}`,
          Body: Readable.from(file.buffer), // convert buffer to stream
        },
      });

      await upload.done();

      // Construct the public URL (optional)
      return {
        fileName: file.originalname,
        url: `https://${bucketName}.s3.${region}.amazonaws.com/lorryReceipts/${file.originalname}`,
      };
    })
  );
};

export const lorryReceiptsFileUpload = async (req: Request, res: Response) => {
  try {
    const response = await s3uploadFile(req.files);
    if (response) {
      res.status(200).json({ data: response });
    }
  } catch (err) {
    console.log(err);
  }
};

export const deleteLRFile = async (url: string) => {
  try {
    const key = new URL(url).pathname.slice(1);
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await s3Client.send(command);
  } catch (error) {
    console.log(error);
  }
};
