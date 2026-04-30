import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CriteriaCard } from './CriteriaCard'

describe('CriteriaCard', () => {
  it('renders grade number, label, and summary for an in-range grade', () => {
    render(<CriteriaCard grade={9} />)

    expect(screen.getByText('9')).toBeInTheDocument()
    expect(screen.getByText('Mint · PSA 9')).toBeInTheDocument()
    expect(screen.getByText(/superb condition/i)).toBeInTheDocument()
  })

  it('renders the source attribution', () => {
    render(<CriteriaCard grade={10} />)
    expect(screen.getByText(/source: psa/i)).toBeInTheDocument()
  })

  it('renders the "Below 7" placeholder for grades < 7', () => {
    render(<CriteriaCard grade={5} />)
    expect(screen.getByText('Below 7')).toBeInTheDocument()
    expect(screen.getByText(/significant condition issues/i)).toBeInTheDocument()
  })

  it('renders the optional eyebrow label when provided', () => {
    render(<CriteriaCard grade={10} eyebrow="Actual" />)
    expect(screen.getByText('Actual')).toBeInTheDocument()
  })

  it('does not render the eyebrow when omitted', () => {
    render(<CriteriaCard grade={10} />)
    expect(screen.queryByText('Actual')).not.toBeInTheDocument()
    expect(screen.queryByText('Your guess')).not.toBeInTheDocument()
  })
})
