/**
 * Fuzzy search utility
 * Matches strings even with typos, missing characters, or out-of-order characters
 */

export interface FuzzyMatch {
  score: number
  matches: boolean
}

/**
 * Fuzzy match a search query against a target string
 * Returns a score (higher is better) and whether it matches
 *
 * Algorithm:
 * - Exact match: highest score
 * - Case-insensitive match: high score
 * - Fuzzy match (chars in order): medium score based on distance
 * - No match: score 0
 */
export function fuzzyMatch(search: string, target: string): FuzzyMatch {
  if (!search) return { score: 0, matches: true }
  if (!target) return { score: 0, matches: false }

  const searchLower = search.toLowerCase()
  const targetLower = target.toLowerCase()

  // Exact match
  if (target === search) {
    return { score: 1000, matches: true }
  }

  // Case-insensitive exact match
  if (targetLower === searchLower) {
    return { score: 900, matches: true }
  }

  // Contains match (case-insensitive)
  if (targetLower.includes(searchLower)) {
    // Score higher if match is at the start
    const index = targetLower.indexOf(searchLower)
    const score = 800 - index * 10
    return { score: Math.max(score, 700), matches: true }
  }

  // Fuzzy match - all characters must appear in order
  let searchIndex = 0
  let targetIndex = 0
  let lastMatchIndex = -1
  let consecutiveMatches = 0
  let totalDistance = 0

  while (searchIndex < searchLower.length && targetIndex < targetLower.length) {
    if (searchLower[searchIndex] === targetLower[targetIndex]) {
      // Calculate distance from last match
      if (lastMatchIndex >= 0) {
        const distance = targetIndex - lastMatchIndex - 1
        totalDistance += distance

        // Bonus for consecutive matches
        if (distance === 0) {
          consecutiveMatches++
        } else {
          consecutiveMatches = 0
        }
      }

      lastMatchIndex = targetIndex
      searchIndex++
    }
    targetIndex++
  }

  // All search characters must be matched
  if (searchIndex < searchLower.length) {
    return { score: 0, matches: false }
  }

  // Calculate score based on:
  // - Total distance between matches (lower is better)
  // - Length of target (shorter is better)
  // - Consecutive matches (more is better)
  const baseScore = 500
  const distancePenalty = totalDistance * 5
  const lengthPenalty = (targetLower.length - searchLower.length) * 2
  const consecutiveBonus = consecutiveMatches * 20

  const score = baseScore - distancePenalty - lengthPenalty + consecutiveBonus

  return {
    score: Math.max(score, 100), // Minimum score for a match
    matches: true,
  }
}

/**
 * Search multiple fields and return the best score
 */
export function fuzzyMatchMultiField(search: string, fields: string[]): FuzzyMatch {
  let bestScore = 0
  let anyMatch = false

  for (const field of fields) {
    const result = fuzzyMatch(search, field)
    if (result.matches) {
      anyMatch = true
      bestScore = Math.max(bestScore, result.score)
    }
  }

  return {
    score: bestScore,
    matches: anyMatch,
  }
}

/**
 * Filter and sort items by fuzzy match score
 */
export function fuzzyFilter<T>(
  items: T[],
  search: string,
  getSearchFields: (item: T) => string[],
  limit: number = 50
): T[] {
  if (!search) {
    return items.slice(0, limit)
  }

  // Split search by spaces and match all terms
  const searchTerms = search.trim().split(/\s+/).filter(Boolean)

  // Calculate scores for all items
  const scored = items
    .map((item) => {
      const fields = getSearchFields(item)

      // All search terms must match at least one field
      let allTermsMatch = true
      let totalScore = 0

      for (const term of searchTerms) {
        const result = fuzzyMatchMultiField(term, fields)
        if (!result.matches) {
          allTermsMatch = false
          break
        }
        totalScore += result.score
      }

      return {
        item,
        matches: allTermsMatch,
        score: allTermsMatch ? totalScore / searchTerms.length : 0,
      }
    })
    .filter((x) => x.matches)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.item)

  return scored
}
