// pages/api/debug/token.js
import { getToken } from "next-auth/jwt";
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  const session = await getToken({ req });
  const email = session?.email;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { hubspotToken: true },
  });

  res.status(200).json(user);
}
