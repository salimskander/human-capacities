import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const firebaseUid = searchParams.get('userId');

    if (!firebaseUid) {
      return NextResponse.json({ error: 'ID utilisateur requis' }, { status: 400 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { firebaseUid },
      select: { firebaseUid: true, username: true, createdAt: true },
    });

    return NextResponse.json(profile ?? { firebaseUid, username: null });
  } catch (error) {
    console.error('Erreur user/profile GET:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { firebaseUid, username } = await request.json();

    if (!firebaseUid || typeof firebaseUid !== 'string') {
      return NextResponse.json({ error: 'ID utilisateur requis' }, { status: 400 });
    }

    const trimmed = typeof username === 'string' ? username.trim().slice(0, 32) : null;

    const profile = await prisma.userProfile.upsert({
      where: { firebaseUid },
      create: { firebaseUid, username: trimmed },
      update: { username: trimmed },
      select: { firebaseUid: true, username: true },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('Erreur user/profile POST:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
