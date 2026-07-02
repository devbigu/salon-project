import { createHash } from "node:crypto";
import { prisma } from "../../config/prisma.js";
import { verifyRefreshToken } from "../../utils/jwt.js";

export const hashRefreshToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const createRefreshSession = async (userId: string, refreshToken: string) => {
  const decoded = verifyRefreshToken(refreshToken) as { exp?: number };
  if (!decoded.exp) throw new Error("Refresh token expiry is missing");

  return prisma.userSession.create({
    data: {
      userId,
      refreshTokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(decoded.exp * 1000),
    },
  });
};

export const findActiveRefreshSession = (refreshToken: string) =>
  prisma.userSession.findFirst({
    where: {
      refreshTokenHash: hashRefreshToken(refreshToken),
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

export const revokeRefreshSession = (refreshToken: string) =>
  prisma.userSession.updateMany({
    where: {
      refreshTokenHash: hashRefreshToken(refreshToken),
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
