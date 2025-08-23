import { Request, Response } from "express";import dotenv from "dotenv";
dotenv.config();
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

export const lorryReceiptsFileUpload = async (req: Request, res: Response) => {
  try {
    const { filename, contentType } = req.body;

    if (!filename || !contentType) {
      res.status(400).json({ error: "filename and contentType required" });
      return;
    }
    const key = `lorryReceipts/${Date.now()}-${filename}`;
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType as string,
    });
    const signedUrl = await getSignedUrl(s3Client as any, command as any, {
      expiresIn: 3600,
    });
    if (signedUrl) {
      const data = {
        uploadUrl: signedUrl,
        fileUrl: `https://${bucketName}.s3.${region}.amazonaws.com/${key}`,
      };
      res.status(200).json({ data });
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
