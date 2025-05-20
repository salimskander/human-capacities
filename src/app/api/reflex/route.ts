import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'reflex-results.json');

interface ReflexResult {
  timestamp: number;
  reactionTime: number;
}

export async function POST(request: Request) {
  try {
    const { reactionTime } = await request.json();
    
    // Créer le dossier data s'il n'existe pas
    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
    
    // Lire les données existantes ou initialiser un tableau vide
    let results: ReflexResult[] = [];
    try {
      const data = await fs.readFile(DATA_FILE, 'utf-8');
      results = JSON.parse(data);
    } catch (error) {
      NextResponse.json({ error }, { status: 500 });
    }

    // Ajouter le nouveau résultat
    results.push({
      timestamp: Date.now(),
      reactionTime
    });

    // Sauvegarder les résultats
    await fs.writeFile(DATA_FILE, JSON.stringify(results, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    let results: ReflexResult[] = [];
    try {
      const data = await fs.readFile(DATA_FILE, 'utf-8');
      results = JSON.parse(data);
    } catch (error) {
      NextResponse.json({ error }, { status: 500 });
    }
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
