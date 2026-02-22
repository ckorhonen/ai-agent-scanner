export interface ScanResult {
  url: string
  timestamp: string
  scores: CategoryScores
  overall: number
  grade: Grade
  level: ReadinessLevel
  summary: string
  recommendations: Recommendation[]
  categoryDetails: CategoryDetail[]
  responseTimeMs?: number
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

export interface ReadinessLevel {
  level: 1 | 2 | 3 | 4 | 5
  label: string
  emoji: string
  color: string
  description: string
}

export type Impact = 'high' | 'medium' | 'low'
export type Effort = 'low' | 'medium' | 'high'

export interface CheckResult {
  name: string
  passed: boolean
  impact: Impact
  detail: string
  fix?: string
  example?: string
}

export interface CategoryDetail {
  category: keyof CategoryScores
  label: string
  score: number
  max: number
  checks: CheckResult[]
  educationalNote: string
}

export interface Recommendation {
  category: keyof CategoryScores
  title: string
  description: string
  points: number
  effort: Effort
  impact: Impact
  example?: string
}

export interface ScanRequest {
  urls: string[]
}
