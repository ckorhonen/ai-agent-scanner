export interface ScanResult {
  url: string
  timestamp: string
  scores: CategoryScores
  overall: number
  grade: Grade
  recommendations: Recommendation[]
  categoryDetails: CategoryDetail[]
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

export type Impact = 'high' | 'medium' | 'low'
export type Effort = 'low' | 'medium' | 'high'

export interface CheckResult {
  name: string           // e.g. "Labels paired with inputs"
  passed: boolean
  impact: Impact
  detail: string         // e.g. "3/8 inputs have labels"
  fix?: string           // Actionable fix description
  example?: string       // Code snippet to fix it
}

export interface CategoryDetail {
  category: keyof CategoryScores
  label: string
  score: number
  max: number
  checks: CheckResult[]
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
