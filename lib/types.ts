export interface ScanResult {
  url: string
  timestamp: string
  scores: CategoryScores
  overall: number
  grade: Grade
  recommendations: Recommendation[]
  error?: string
}

export interface CategoryScores {
  usability: number      // 0-30
  webmcp: number         // 0-25
  semantic: number       // 0-20
  structured: number     // 0-15
  crawlability: number   // 0-5
  content: number        // 0-5
}

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F'

export interface Recommendation {
  category: keyof CategoryScores
  title: string
  description: string
  points: number
}

export interface ScanRequest {
  urls: string[]
}
