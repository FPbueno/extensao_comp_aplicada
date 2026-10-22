import { useMemo, useState } from 'react'
import ArticleModal from './components/ArticleModal'
import Catalog from './components/Catalog'
import Footer from './components/Footer'
import Header from './components/Header'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import { useArticles } from './hooks/useArticles'
import { useCatalogFilters } from './hooks/useCatalogFilters'
import { useSimplifications } from './hooks/useSimplifications'
import { articleKey } from './utils/articles'

export default function App() {
  const { status, articles, error, reload } = useArticles()
  const catalog = useCatalogFilters(articles)
  const [simplifications, simplify] = useSimplifications()
  const [selected, setSelected] = useState(null)
  const stats = useMemo(() => summarize(articles), [articles])

  return (
    <>
      <Header />
      <main>
        <Hero
          query={catalog.filters.query}
          onQueryChange={(query) => catalog.setFilter('query', query)}
          onSearch={() => document.getElementById('publicacoes')?.scrollIntoView()}
          stats={stats}
          loading={status === 'loading'}
        />
        <Catalog
          status={status}
          error={error}
          onRetry={reload}
          articles={articles}
          catalog={catalog}
          onOpen={setSelected}
        />
        <HowItWorks />
      </main>
      <Footer />

      {selected && (
        <ArticleModal
          key={articleKey(selected)}
          article={selected}
          simplification={simplifications[articleKey(selected)]}
          onSimplify={simplify}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}

function summarize(articles) {
  const years = articles.map((article) => Number(article.year)).filter(Boolean)
  const first = Math.min(...years)
  const last = Math.max(...years)
  return {
    total: articles.length,
    researchers: new Set(articles.flatMap((article) => article.matched_authors ?? [])).size,
    period: years.length === 0 ? '—' : first === last ? `${first}` : `${first}–${last}`,
  }
}
