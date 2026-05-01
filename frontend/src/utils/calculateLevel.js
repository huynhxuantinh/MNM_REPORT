/**
 * Utility functions for XP and Level calculations
 */

// XP required for each level (formula: 100 * level * (level + 1) / 2)
// Level 1: 100 XP to reach level 2
// Level 2: 300 XP total to reach level 3
// etc.

/**
 * Get total XP required to reach a specific level
 * @param {number} level - Target level
 * @returns {number} Total XP required
 */
export const getLevelXp = (level) => {
  if (level <= 0) return 0;
  return (100 * level * (level + 1)) / 2;
};

/**
 * Get XP required to go from current level to next level
 * @param {number} currentLevel - Current level
 * @returns {number} XP needed for next level
 */
export const getXpForNextLevel = (currentLevel) => {
  const currentLevelBase = getLevelXp(currentLevel - 1);
  const nextLevelBase = getLevelXp(currentLevel);
  return nextLevelBase - currentLevelBase;
};

/**
 * Calculate current level based on total XP
 * @param {number} xp - Total XP
 * @returns {number} Current level (minimum 1)
 */
export const calculateLevel = (xp) => {
  if (!xp || xp < 0) return 1;

  // Inverse formula: solve for level
  // xp = 100 * level * (level + 1) / 2
  // level^2 + level - xp/50 = 0
  // Using quadratic formula
  const a = 1;
  const b = 1;
  const c = -xp / 50;

  const discriminant = b * b - 4 * a * c;
  const level = (-b + Math.sqrt(discriminant)) / (2 * a);

  return Math.max(1, Math.floor(level));
};

/**
 * Calculate progress percentage within current level
 * @param {number} xp - Total XP
 * @param {number} level - Current level
 * @returns {number} Progress percentage (0-100)
 */
export const calculateLevelProgress = (xp, level) => {
  if (!xp || xp < 0 || !level || level < 1) return 0;

  const prevLevelXp = getLevelXp(level - 1);
  const nextLevelXp = getLevelXp(level);

  if (nextLevelXp <= prevLevelXp) return 100;

  const currentLevelXp = xp - prevLevelXp;
  const levelRange = nextLevelXp - prevLevelXp;

  return Math.min(100, Math.round((currentLevelXp / levelRange) * 100));
};

/**
 * Get XP info object with all calculated values
 * @param {number} xp - Total XP
 * @returns {Object} XP and level info
 */
export const getXpInfo = (xp) => {
  const safeXp = Math.max(0, xp || 0);
  const level = calculateLevel(safeXp);
  const progress = calculateLevelProgress(safeXp, level);
  const currentLevelBase = getLevelXp(level - 1);
  const nextLevelBase = getLevelXp(level);
  const xpInCurrentLevel = safeXp - currentLevelBase;
  const xpNeededForNext = nextLevelBase - currentLevelBase;

  return {
    xp: safeXp,
    level,
    progress,
    xpInCurrentLevel,
    xpNeededForNext,
    xpToNextLevel: xpNeededForNext - xpInCurrentLevel,
  };
};

/**
 * XP rewards constants
 */
export const XP_REWARDS = {
  NEW_WORD: 10,        // XP for learning a new word
  LESSON_BONUS: 20,    // Bonus for completing a lesson
  REVIEW_CORRECT: 5,   // XP for correct review (quality >= 3)
  REVIEW_WRONG: 2,     // XP for wrong review (quality < 3)
  STREAK_BONUS: 5,     // Daily streak bonus
};

/**
 * Calculate XP for completing a study session
 * @param {number} wordsLearned - Number of words learned
 * @returns {number} Total XP earned
 */
export const calculateStudyXp = (wordsLearned) => {
  return wordsLearned * XP_REWARDS.NEW_WORD + XP_REWARDS.LESSON_BONUS;
};

/**
 * Calculate XP for review session
 * @param {number} correctCount - Number of correct answers (quality >= 3)
 * @param {number} wrongCount - Number of wrong answers (quality < 3)
 * @returns {number} Total XP earned
 */
export const calculateReviewXp = (correctCount, wrongCount) => {
  return (
    correctCount * XP_REWARDS.REVIEW_CORRECT +
    wrongCount * XP_REWARDS.REVIEW_WRONG
  );
};

export default {
  getLevelXp,
  getXpForNextLevel,
  calculateLevel,
  calculateLevelProgress,
  getXpInfo,
  calculateStudyXp,
  calculateReviewXp,
  XP_REWARDS,
};
