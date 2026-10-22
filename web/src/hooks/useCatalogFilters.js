import { useCallback, useMemo, useState } from 'react'
import { baseReferenceType, normalize, searchableText, SORT_OPTIONS } from '../utils/articles'

const INITIAL_FILTERS = { query: '', type: 'all', researcher: 'all', sort: 'recent' }

export function useCatalogFilters(articles) {
  const [filters, setFilters] = useState(INITIAL_FILTERS)

  const setFilter = useCallback((name, value) => {
    setFilters((current) => ({ ...current, [name]: value }))
  }, [])

  const resetFilters = useCallback(() => setFilters(INITIAL_FILTERS), [])

  const indexed = useMemo(
    () => articles.map((article) => ({ article, text: searchableText(article) })),
    [articles],
  )

  const filtered = useMemo(() => {
    const terms = normalize(filters.query).split(/\s+/).filter(Boolean)
    return indexed
      .filter(
        ({ article, text }) =>
          (filters.type === 'all' || baseReferenceType(article.reference_type) === filters.type) &&
          (filters.researcher === 'all' || article.matched_authors?.includes(filters.researcher)) &&
          terms.every((term) => text.includes(term)),
      )
      .map(({ article }) => article)
      .sort(SORT_OPTIONS[filters.sort].compare)
  }, [indexed, filters])

  const typeOptions = useMemo(
    () => countValues(articles, (a) => [baseReferenceType(a.reference_type)]),
    [articles],
  )
  const researcherOptions = useMemo(
    () => countValues(articles, (a) => a.matched_authors ?? []),
    [articles],
  )

  const isFiltered = filters.query.trim() !== '' || filters.type !== 'all' || filters.researcher !== 'all'

  return { filters, setFilter, resetFilters, filtered, typeOptions, researcherOptions, isFiltered }
}

// [{ value, count }] ordenado do mais frequente para o menos frequente
function countValues(items, getValues) {
  const counts = new Map()
  for (const item of items) {
    for (const value of getValues(item)) {
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1)
    }
  }
  return [...counts].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count)
}
