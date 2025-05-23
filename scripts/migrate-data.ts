import { prisma } from '../src/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

async function migrateData() {
  console.log('🚀 Début de la migration des données...')
  
  const dataDir = path.join(process.cwd(), 'data')
  
  const testConfigs = [
    { type: 'reflex', file: 'reflex-results.json', scoreField: 'reactionTime' },
    { type: 'chimpTest', file: 'chimpTest.json', scoreField: 'score' },
    { type: 'numberMemory', file: 'numberMemory.json', scoreField: 'score' },
    { type: 'visualMemory', file: 'visualMemory.json', scoreField: 'score' },
    { type: 'verbalMemory', file: 'verbalMemory.json', scoreField: 'score' },
    { type: 'sequenceMemory', file: 'sequenceMemory.json', scoreField: 'score' },
    { type: 'symbolMemory', file: 'symbolMemory.json', scoreField: 'score' },
    { type: 'typingSpeed', file: 'typingSpeed.json', scoreField: 'wpm' }
  ]
  
  let totalMigrated = 0
  
  for (const config of testConfigs) {
    try {
      const filePath = path.join(dataDir, config.file)
      const fileContent = await fs.readFile(filePath, 'utf-8')
      const data = JSON.parse(fileContent)
      
      // Gérer différents formats de données
      let globalData = []
      if (Array.isArray(data)) {
        globalData = data
      } else if (data.global) {
        globalData = data.global
      } else if (data.results) {
        globalData = data.results
      }
      
      let migratedCount = 0
      
      for (const result of globalData) {
        try {
          const createData: any = {
            testType: config.type,
            userId: result.userId || null,
            timestamp: new Date(result.timestamp || Date.now())
          }
          
          // Mapper les champs spécifiques
          if (config.type === 'reflex') {
            createData.reactionTime = result.reactionTime
          } else if (config.type === 'typingSpeed') {
            createData.wpm = result.wpm
            createData.accuracy = result.accuracy
          } else {
            createData.score = result[config.scoreField] || result.score
          }
          
          await prisma.testResult.create({ data: createData })
          migratedCount++
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`⚠️ Erreur lors de la migration d'un résultat ${config.type}:`, errorMessage)
        }
      }
      
      totalMigrated += migratedCount
      console.log(`✅ Migré ${migratedCount} résultats pour ${config.type}`)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`⚠️ Pas de données pour ${config.type}:`, errorMessage)
    }
  }
  
  console.log(`🎉 Migration terminée ! Total: ${totalMigrated} résultats migrés`)
}

migrateData()
  .catch(console.error)
  .finally(() => prisma.$disconnect()) 
