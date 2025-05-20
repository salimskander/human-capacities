import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'sequenceMemory.json');

async function ensureFileExists() {
  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.writeFile(dataFilePath, JSON.stringify({ results: [] }));
  }
}

async function readData() {
  await ensureFileExists();
  const fileContent = await fs.readFile(dataFilePath, 'utf8');
  try {
    return JSON.parse(fileContent);
  } catch {
    return { results: [] };
  }
}

async function writeData(data: unknown) {
  await ensureFileExists();
  await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));
}

export async function POST(request: Request) {
  try {
    const { score } = await request.json();
    const data = await readData();
    
    // S'assurer que data.results existe
    if (!data.results) {
      data.results = [];
    }
    
    const newResult = {
      timestamp: Date.now(),
      score: score
    };
    
    data.results.push(newResult);
    await writeData(data);
    
    return NextResponse.json(newResult);
  } catch (error) {
    console.error('Error in POST:', error);
    return NextResponse.json({ error: 'Failed to save result' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const data = await readData();
    return NextResponse.json(data.results || []);
  } catch (error) {
    console.error('Error in GET:', error);
    return NextResponse.json([], { status: 500 });
  }
}