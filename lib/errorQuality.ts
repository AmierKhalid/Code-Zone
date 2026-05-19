import { Solution } from "@/lib/generated/prisma/client";

export interface QualityMetrics {
  codeScore: number;        // 0-5
  explanationScore: number; // 0-5
  completenessScore: number;// 0-5
  uniquenessScore: number;  // 0-5
  finalScore: number;      // 0-5
}

export interface QualityAnalysis {
  metrics: QualityMetrics;
  rating: 'excellent' | 'good' | 'average' | 'poor';
  multiplier: number;
  feedback: string[];
}

const BASE_POINTS = {
  easy: 10,
  medium: 25,
  hard: 50,
  expert: 100,
} as const;

const QUALITY_MULTIPLIERS = {
  excellent: 1.5,
  good: 1.2,
  average: 1.0,
  poor: 0.8,
} as const;

export function analyzeSolutionQuality(
  solution: string,
  errorCode?: string,
  errorDescription?: string
): QualityAnalysis {
  const codeScore = analyzeCodeQuality(solution, errorCode);
  const explanationScore = analyzeExplanationQuality(solution, errorDescription);
  const completenessScore = analyzeCompleteness(solution, errorDescription);
  const uniquenessScore = analyzeUniqueness(solution);

  const finalScore = (
    codeScore * 0.4 +
    explanationScore * 0.3 +
    completenessScore * 0.2 +
    uniquenessScore * 0.1
  );

  const rating = getRating(finalScore);
  const multiplier = QUALITY_MULTIPLIERS[rating];
  const feedback = generateFeedback(codeScore, explanationScore, completenessScore, uniquenessScore);

  return {
    metrics: {
      codeScore,
      explanationScore,
      completenessScore,
      uniquenessScore,
      finalScore,
    },
    rating,
    multiplier,
    feedback,
  };
}

function analyzeCodeQuality(solution: string, errorCode?: string): number {
  let score = 2.5; // Base score

  // Code structure analysis
  const hasProperFormatting = solution.includes('\n') && solution.includes(' ');
  const hasComments = solution.includes('//') || solution.includes('/*') || solution.includes('#');
  const hasFunctions = /\b(function|def|class|const|let|var)\b/.test(solution);
  const hasErrorHandling = /\b(try|catch|throw|if.*error|error)\b/i.test(solution);

  if (hasProperFormatting) score += 0.5;
  if (hasComments) score += 0.5;
  if (hasFunctions) score += 0.5;
  if (hasErrorHandling) score += 0.5;

  // Language-specific best practices
  const hasVariableDeclarations = /\b(const|let|var)\b/.test(solution) || /\b(let|def)\b/.test(solution);
  const hasProperIndentation = solution.split('\n').every(line => 
    line.trim().length === 0 || line.startsWith(' ') || line === solution.split('\n')[0]
  );

  if (hasVariableDeclarations) score += 0.3;
  if (hasProperIndentation) score += 0.2;

  return Math.min(5, Math.max(0, score));
}

function analyzeExplanationQuality(solution: string, errorDescription?: string): number {
  let score = 2.5; // Base score

  // Text analysis (assuming solution contains explanation)
  const textContent = solution.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
  const wordCount = textContent.split(/\s+/).length;
  const hasTechnicalTerms = /\b(syntax|logic|runtime|compilation|undefined|null|error|exception)\b/i.test(textContent);
  const hasStepByStep = /\b(step|first|then|next|finally|1\.|2\.|3\.)\b/i.test(textContent);
  const hasCauseExplanation = /\b(because|due to|caused by|reason|issue)\b/i.test(textContent);

  if (wordCount >= 20) score += 0.5;
  if (wordCount >= 50) score += 0.5;
  if (hasTechnicalTerms) score += 0.5;
  if (hasStepByStep) score += 0.5;
  if (hasCauseExplanation) score += 0.5;

  return Math.min(5, Math.max(0, score));
}

function analyzeCompleteness(solution: string, errorDescription?: string): number {
  let score = 2.5; // Base score

  const hasCodeBlock = /```[\s\S]*?```/.test(solution);
  const hasExplanation = solution.replace(/```[\s\S]*?```/g, '').trim().length > 0;
  const hasExamples = /\b(example|for instance|such as|like)\b/i.test(solution);
  const hasPrevention = /\b(prevent|avoid|fix|solution|resolve)\b/i.test(solution);

  if (hasCodeBlock) score += 0.8;
  if (hasExplanation) score += 0.7;
  if (hasExamples) score += 0.5;
  if (hasPrevention) score += 0.5;

  return Math.min(5, Math.max(0, score));
}

function analyzeUniqueness(solution: string): number {
  // This is a simplified uniqueness check
  // In production, you'd compare against existing solutions
  let score = 3.0; // Base score

  const hasUniqueApproach = /\b(alternative|different|another|instead)\b/i.test(solution);
  const hasOptimization = /\b(optimize|improve|better|efficient)\b/i.test(solution);
  const hasCreativeSolution = /\b(clever|smart|elegant|simple)\b/i.test(solution);

  if (hasUniqueApproach) score += 0.7;
  if (hasOptimization) score += 0.7;
  if (hasCreativeSolution) score += 0.6;

  return Math.min(5, Math.max(0, score));
}

function getRating(score: number): 'excellent' | 'good' | 'average' | 'poor' {
  if (score >= 4.5) return 'excellent';
  if (score >= 3.5) return 'good';
  if (score >= 2.5) return 'average';
  return 'poor';
}

function generateFeedback(
  codeScore: number,
  explanationScore: number,
  completenessScore: number,
  uniquenessScore: number
): string[] {
  const feedback: string[] = [];

  if (codeScore < 3) {
    feedback.push("Add proper code formatting and comments for better readability");
  }
  if (explanationScore < 3) {
    feedback.push("Provide more detailed explanation of the solution");
  }
  if (completenessScore < 3) {
    feedback.push("Include code examples and prevention strategies");
  }
  if (uniquenessScore < 3) {
    feedback.push("Consider alternative approaches or optimizations");
  }

  if (codeScore >= 4) feedback.push("Excellent code structure and formatting");
  if (explanationScore >= 4) feedback.push("Clear and comprehensive explanation");
  if (completenessScore >= 4) feedback.push("Complete solution with examples");
  if (uniquenessScore >= 4) feedback.push("Creative and unique approach");

  return feedback;
}

export function calculateEarnedPoints(
  basePoints: number,
  qualityMultiplier: number
): number {
  return Math.round(basePoints * qualityMultiplier);
}

export function getBasePoints(difficulty: 'easy' | 'medium' | 'hard' | 'expert'): number {
  return BASE_POINTS[difficulty];
}
