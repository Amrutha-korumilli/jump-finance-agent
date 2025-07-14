import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getGoogleAccessToken(userEmail) {
    console.log("Getting Google access token for user:", userEmail);
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user?.googleAccessToken || !user?.googleRefreshToken) {
    throw new Error("Missing Google credentials");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
  });

  try {
    // Test token validity
    await oauth2Client.getTokenInfo(user.googleAccessToken);
    return user.googleAccessToken;
  } catch (err) {
    // Token expired → refresh it
    const { credentials } = await oauth2Client.refreshAccessToken();
    await prisma.user.update({
      where: { email: userEmail },
      data: { googleAccessToken: credentials.access_token },
    });
    return credentials.access_token;
  }
}
