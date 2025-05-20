import { promises as fs } from 'fs'
import { NextResponse } from 'next/server'
import path from 'path'

const dataFilePath = path.join(process.cwd(), 'data', 'visualMemory.json')

async function ensureDirectoryExists() {
  const dir = path.dirname(dataFilePath)
  try {
    await fs.access(dir)
  } catch {
    await fs.mkdir(dir, { recursive: true })
  }
}

export async function GET() {
  try {
    await ensureDirectoryExists()
    const data = await fs.readFile(dataFilePath, 'utf8').catch(() => '[]')
    return NextResponse.json(JSON.parse(data))
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { score } = await request.json()
    await ensureDirectoryExists()
    
    const data = await fs.readFile(dataFilePath, 'utf8').catch(() => '[]')
    const results = JSON.parse(data)
    
    results.push({
      timestamp: Date.now(),
      score: score
    })
    
    await fs.writeFile(dataFilePath, JSON.stringify(results))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 })
  }
}
