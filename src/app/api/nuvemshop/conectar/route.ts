import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { randomToken } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { authorizeUrl } from "@/lib/nuvemshop";

// Inicia o OAuth: grava um state de uso único ligado à conta e manda o lojista para a Nuvemshop.
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/entrar", req.url));

  const state = randomToken(24);
  await prisma.oAuthState.create({
    data: { state, accountId: user.accountId, expiresAt: new Date(Date.now() + 10 * 60_000) },
  });
  return NextResponse.redirect(authorizeUrl(state));
}
