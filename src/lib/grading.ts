export interface GradeCriteria {
  grade: number
  label: string
  summary: string
  source: 'PSA'
}

export const PSA_REFERENCE_URL = 'https://www.psacard.com/grades'

export const PSA_CRITERIA: Record<7 | 8 | 9 | 10, GradeCriteria> = {
  7: {
    grade: 7,
    label: 'Near Mint',
    summary:
      'Slight surface wear visible on close inspection. Slight corner fraying, slightly out-of-register focus, a minor printing blemish, or slight wax staining on the back is acceptable; most original gloss retained. Centering 70/30 to 75/25 or better on the front.',
    source: 'PSA',
  },
  8: {
    grade: 8,
    label: 'Near Mint-Mint',
    summary:
      'Appears Mint 9 at first glance but closer inspection reveals slight imperfections — slight wax stain on reverse, very slight fraying at one or two corners, a minor printing imperfection, or slightly off-white borders. Centering 65/35 to 70/30 or better on the front.',
    source: 'PSA',
  },
  9: {
    grade: 9,
    label: 'Mint',
    summary:
      'A superb condition card that exhibits only one of the following minor flaws: a very slight wax stain on reverse, a minor printing imperfection, or slightly off-white borders. Centering 60/40 to 65/35 or better on the front.',
    source: 'PSA',
  },
  10: {
    grade: 10,
    label: 'Gem Mint',
    summary:
      'A virtually perfect card. Four sharp corners, sharp focus, and full original gloss; image centering within 55/45 to 60/40 on the front and 75/25 on the reverse.',
    source: 'PSA',
  },
}

const BELOW_7_SUMMARY =
  'Significant condition issues — corner or edge wear, surface defects, or off-centering beyond mint tolerances. See the full PSA scale for details.'

/**
 * Returns the criteria for a grade. Grades 7-10 return the verbatim PSA entry.
 * Anything below 7 returns a synthetic "Below 7" placeholder so callers can
 * render a fallback card without needing a separate code path.
 */
export function getCriteriaFor(grade: number): GradeCriteria {
  if (grade >= 7 && grade <= 10) {
    return PSA_CRITERIA[grade as 7 | 8 | 9 | 10]
  }
  return {
    grade,
    label: 'Below 7',
    summary: BELOW_7_SUMMARY,
    source: 'PSA',
  }
}
