import prisma from "./prisma";

export async function getGoogleAccessToken(userEmail) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user?.googleAccessToken) throw new Error("No Google token found");
  return user.googleAccessToken;
}
