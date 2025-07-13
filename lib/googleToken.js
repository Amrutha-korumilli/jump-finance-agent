import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getGoogleAccessToken(userEmail) {
    console.log("userEmail:", userEmail);
  if (!userEmail) throw new Error("No user email provided to getGoogleAccessToken");

  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user?.googleAccessToken) throw new Error("No Google token found");
  return user.googleAccessToken;
}
