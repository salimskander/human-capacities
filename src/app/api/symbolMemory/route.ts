import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'symbolMemory.json');

async function ensureFileExists() {
  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
    await fs.writeFile(dataFilePath, '[]');
  }
}

export async function GET() {
  try {
    await ensureFileExists();
    const data = await fs.readFile(dataFilePath, 'utf-8');
    const results = JSON.parse(data);
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureFileExists();
    const { score } = await request.json();
    const timestamp = Date.now();
    
    const data = await fs.readFile(dataFilePath, 'utf-8');
    const results = JSON.parse(data);
    results.push({ timestamp, score });
    await fs.writeFile(dataFilePath, JSON.stringify(results, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}