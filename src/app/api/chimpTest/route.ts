import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'chimpTest.json');

// Type pour la structure des données
type TestResult = {
    timestamp: number;
    score: number;
};

// Assure que le fichier existe
async function ensureFile() {
    try {
        await fs.access(dataFilePath);
    } catch {
        await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
        await fs.writeFile(dataFilePath, '[]');
    }
}

export async function GET() {
    await ensureFile();
    const data = await fs.readFile(dataFilePath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
}

export async function POST(request: Request) {
    await ensureFile();
    
    const result: TestResult = await request.json();
    
    // Validation basique
    if (!result.timestamp || typeof result.score !== 'number') {
        return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Lire les données existantes
    const data = JSON.parse(await fs.readFile(dataFilePath, 'utf-8'));
    
    // Ajouter le nouveau résultat
    data.push(result);
    
    // Sauvegarder les données
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ success: true });
}
