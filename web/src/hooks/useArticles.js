import { useCallback, useEffect, useState } from 'react'
import { fetchArticles } from '../api'

// Requisição compartilhada entre montagens: o StrictMode monta os componentes
// duas vezes em desenvolvimento, e cada scraping no back leva minutos.
let articlesRequest = null

function requestArticles() {
  articlesRequest ??= fetchArticles().catch((error) => {
    articlesRequest = null
    throw error
  })
  return articlesRequest
}

export function useArticles() {
  const [state, setState] = useState({ status: 'loading', articles: [], error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    requestArticles().then(
      (articles) => active && setState({ status: 'success', articles, error: null }),
      (error) => active && setState({ status: 'error', articles: [], error }),
    )
    return () => {
      active = false
    }
  }, [attempt])

  const reload = useCallback(() => {
    setState({ status: 'loading', articles: [], error: null })
    setAttempt((n) => n + 1)
  }, [])

  return { ...state, reload }
}
