import { tilteType } from "@/lib/generated/prisma/client";

export interface TitleThreshold {
  title: tilteType;
  pointsRequired: number;
  description: string;
}

export const TITLE_THRESHOLDS: TitleThreshold[] = [
  {
    title: 'novice',
    pointsRequired: 0,
    description: 'Just getting started with error hunting'
  },
  {
    title: 'apprentice',
    pointsRequired: 50,
    description: 'Learning the ropes of debugging'
  },
  {
    title: 'journeyman',
    pointsRequired: 150,
    description: 'Becoming a competent problem solver'
  },
  {
    title: 'expert',
    pointsRequired: 300,
    description: 'Skilled error hunter with proven track record'
  },
  {
    title: 'master',
    pointsRequired: 600,
    description: 'Master of debugging and problem solving'
  },
  {
    title: 'grandmaster',
    pointsRequired: 1200,
    description: 'Elite level error hunting expertise'
  },
  {
    title: 'legend',
    pointsRequired: 2500,
    description: 'Legendary status in the community'
  },
  {
    title: 'the_debuger',
    pointsRequired: 5000,
    description: 'The ultimate debugging master'
  },
  {
    title: 'master_of_Code',
    pointsRequired: 10000,
    description: 'Absolute master of code and problem solving'
  }
];

export function calculateNewTitle(currentPoints: number): tilteType {
  // Find the highest title the user qualifies for
  for (let i = TITLE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (currentPoints >= TITLE_THRESHOLDS[i].pointsRequired) {
      return TITLE_THRESHOLDS[i].title;
    }
  }
  return 'novice';
}

export function getNextTitle(currentPoints: number): TitleThreshold | null {
  const currentTitle = calculateNewTitle(currentPoints);
  const currentIndex = TITLE_THRESHOLDS.findIndex(t => t.title === currentTitle);
  
  if (currentIndex < TITLE_THRESHOLDS.length - 1) {
    return TITLE_THRESHOLDS[currentIndex + 1];
  }
  
  return null; // Already at highest title
}

export function getPointsToNextTitle(currentPoints: number): number {
  const nextTitle = getNextTitle(currentPoints);
  if (!nextTitle) return 0; // Already at max title
  
  return nextTitle.pointsRequired - currentPoints;
}

export function getProgressToNextTitle(currentPoints: number): {
  currentTitle: TitleThreshold;
  nextTitle: TitleThreshold | null;
  progressPercentage: number;
  pointsNeeded: number;
} {
  const currentTitle = TITLE_THRESHOLDS.find(t => t.title === calculateNewTitle(currentPoints))!;
  const nextTitle = getNextTitle(currentPoints);
  
  if (!nextTitle) {
    return {
      currentTitle,
      nextTitle: null,
      progressPercentage: 100,
      pointsNeeded: 0
    };
  }
  
  const pointsInCurrentTier = currentPoints - currentTitle.pointsRequired;
  const pointsNeededForNextTier = nextTitle.pointsRequired - currentTitle.pointsRequired;
  const progressPercentage = Math.min(100, (pointsInCurrentTier / pointsNeededForNextTier) * 100);
  
  return {
    currentTitle,
    nextTitle,
    progressPercentage,
    pointsNeeded: getPointsToNextTitle(currentPoints)
  };
}

export function getTitleInfo(title: tilteType): TitleThreshold | undefined {
  return TITLE_THRESHOLDS.find(t => t.title === title);
}

export interface PointAwardResult {
  pointsEarned: number;
  newTotalPoints: number;
  previousTitle: tilteType;
  newTitle: tilteType;
  titlePromoted: boolean;
  nextTitlePoints: number;
}

export function awardPoints(
  currentPoints: number,
  currentTitle: tilteType,
  pointsEarned: number
): PointAwardResult {
  const newTotalPoints = currentPoints + pointsEarned;
  const newTitle = calculateNewTitle(newTotalPoints);
  const titlePromoted = newTitle !== currentTitle;
  const nextTitlePoints = getPointsToNextTitle(newTotalPoints);
  
  return {
    pointsEarned,
    newTotalPoints,
    previousTitle: currentTitle,
    newTitle,
    titlePromoted,
    nextTitlePoints
  };
}
