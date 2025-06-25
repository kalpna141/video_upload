import { getUploadAuthParams } from "@imagekit/next/server";

export async function GET() {
  try {
    const authentiationParameters = getUploadAuthParams({
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string, // Never expose this on client side
      publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY as string,
    });

    return Response.json({
      authentiationParameters,
      publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY,
    });
  } catch (error) {
    return Response.json(
      { error: "Authentication for Image kit failed" },
      { status: 500 }
    );
  }
}
