import { getToken } from "next-auth/jwt";
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  const code = req.query.code;

  if (!code) {
    return res.status(400).json({ error: "No code provided in query" });
  }

  try {
    const tokenRes = await fetch("https://api.hubapi.com/oauth/v1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.HUBSPOT_CLIENT_ID,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET,
        redirect_uri: "http://localhost:3000/api/hubspot/callback",
        code,
      }),
    });

    const tokenJson = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("HubSpot Token Error:", tokenJson);
      return res.status(400).json({ error: "Failed to exchange token" });
    }

    const { access_token, refresh_token, expires_in } = tokenJson;

    const session = await getToken({ req });
    const email = session?.email;

    if (!email) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Save token in DB
    await prisma.user.upsert({
      where: { email },
      update: {
        hubspotToken: {
            upsert: {
              create: {
                accessToken: access_token,
                refreshToken: refresh_token,
                expiresAt: new Date(Date.now() + expires_in * 1000),
              },
              update: {
                accessToken: access_token,
                refreshToken: refresh_token,
                expiresAt: new Date(Date.now() + expires_in * 1000),
              },
            },
          }
          
      },
      create: {
        email,
        hubspotToken: {
          create: {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: new Date(Date.now() + expires_in * 1000),
          },
        },
      },
      include: { hubspotToken: true },
    });

    res.redirect("/");
  } catch (err) {
    console.error("OAuth Callback Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
