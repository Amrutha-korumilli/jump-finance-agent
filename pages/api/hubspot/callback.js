import prisma from "../../../lib/prisma";
import { getToken } from "next-auth/jwt";
import axios from "axios";

export default async function handler(req, res) {
  const code = req.query.code;

  if (!code) return res.status(400).send("Missing code");

  const tokenRes = await axios.post(
    "https://api.hubapi.com/oauth/v1/token",
    new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.HUBSPOT_CLIENT_ID,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/hubspot/callback`,
      code,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const { access_token, refresh_token, expires_in } = tokenRes.data;

  const userToken = await getToken({ req });
  const email = userToken?.email;
  if (!email) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return res.status(404).json({ error: "User not found" });

  await prisma.hubspotToken.upsert({
    where: { userId: user.id },
    update: {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
    },
    create: {
      userId: user.id,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
    },
  });

  return res.redirect("/?connected=hubspot");
}
