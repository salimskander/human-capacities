import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const dataFilePath = path.join(process.cwd(), 'data', 'typingSpeed.json')

type Result = {
    timestamp: number;
    score: number;
}

async function ensureFileExists() {
    try {
        await fs.access(dataFilePath)
    } catch {
        await fs.writeFile(dataFilePath, '[]')
    }
}

export async function GET() {
    try {
        await ensureFileExists()
        const data = await fs.readFile(dataFilePath, 'utf-8')
        return NextResponse.json(JSON.parse(data))
    } catch (error) {
        return NextResponse.json({ error }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        await ensureFileExists()
        const newResult: Result = await request.json()
        
        const data = await fs.readFile(dataFilePath, 'utf-8')
        const results: Result[] = JSON.parse(data)
        results.push(newResult)
        
        await fs.writeFile(dataFilePath, JSON.stringify(results, null, 2))
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error }, { status: 500 })
    }
}
