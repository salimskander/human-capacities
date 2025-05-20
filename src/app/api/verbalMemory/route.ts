import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dataFile = path.join(process.cwd(), 'data', 'verbalMemory.json');

async function ensureFile() {
    try {
        await fs.access(dataFile);
    } catch {
        await fs.mkdir(path.dirname(dataFile), { recursive: true });
        await fs.writeFile(dataFile, '[]');
    }
}

export async function GET() {
    await ensureFile();
    const data = await fs.readFile(dataFile, 'utf-8');
    return NextResponse.json(JSON.parse(data));
}

export async function POST(request: Request) {
    const { score } = await request.json();
    await ensureFile();
    
    const newResult = {
        timestamp: Date.now(),
        score: score
    };

    const data = JSON.parse(await fs.readFile(dataFile, 'utf-8'));
    data.push(newResult);
    await fs.writeFile(dataFile, JSON.stringify(data));

    return NextResponse.json(newResult);
}
