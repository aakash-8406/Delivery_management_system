import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const s3 = new S3Client({ region: process.env.AWS_REGION || "ap-southeast-1" });
const BUCKET = process.env.S3_BUCKET;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,x-master-key",
  "Content-Type": "application/json",
};

export const handler = async (event) => {
  try {
    const { fileType = "image/jpeg", folder = "restaurants" } = JSON.parse(event.body ?? "{}");
    const ext = fileType.split("/")[1] || "jpg";
    const key = `${folder}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    const publicUrl = `https://${BUCKET}.s3.ap-southeast-1.amazonaws.com/${key}`;

    return {
      statusCode: 200, headers: cors,
      body: JSON.stringify({ uploadUrl, publicUrl, key })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
