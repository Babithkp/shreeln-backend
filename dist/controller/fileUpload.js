"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLRFile = exports.lorryReceiptsFileUpload = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const region = process.env.AWS_REGION;
const bucketName = process.env.AWS_BUCKET_NAME;
const accessKeyId = process.env.AWS_ACCESS_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error("AWS_REGION and AWS_ACCESS_ KEY and AWS_SECRET_ACCESS_KEY are required");
}
const s3Client = new client_s3_1.S3Client({
    region,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});
const lorryReceiptsFileUpload = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { filename, contentType } = req.body;
        if (!filename || !contentType) {
            res.status(400).json({ error: "filename and contentType required" });
            return;
        }
        const key = `lorryReceipts/${Date.now()}-${filename}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: contentType,
        });
        const signedUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, {
            expiresIn: 3600,
        });
        if (signedUrl) {
            const data = {
                uploadUrl: signedUrl,
                fileUrl: `https://${bucketName}.s3.${region}.amazonaws.com/${key}`,
            };
            res.status(200).json({ data });
        }
    }
    catch (err) {
        console.log(err);
    }
});
exports.lorryReceiptsFileUpload = lorryReceiptsFileUpload;
const deleteLRFile = (url) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const key = new URL(url).pathname.slice(1);
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
        });
        yield s3Client.send(command);
    }
    catch (error) {
        console.log(error);
    }
});
exports.deleteLRFile = deleteLRFile;
