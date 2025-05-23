import { prisma } from '../src/lib/prisma'

async function checkData() {
  console.log('🔍 Vérification des données migrées...')
  
  const testTypes = [
    'chimpTest', 'typingSpeed', 'symbolMemory', 'visualMemory', 
    'numberMemory', 'verbalMemory', 'sequenceMemory', 'reflex'
  ]
  
  for (const testType of testTypes) {
    const count = await prisma.testResult.count({
      where: { testType }
    })
    
    const userCount = await prisma.testResult.count({
      where: { 
        testType,
        userId: { not: null }
      }
    })
    
    console.log(`📊 ${testType}: ${count} total (${userCount} avec userId)`)
    
    // Afficher quelques exemples
    const examples = await prisma.testResult.findMany({
      where: { testType },
      take: 3,
      select: {
        id: true,
        testType: true,
        score: true,
        wpm: true,
        reactionTime: true,
        userId: true,
        timestamp: true
      }
    })
    
    console.log('Exemples:', examples)
  }
  
  await prisma.$disconnect()
}

checkData().catch(console.error) 