import { useCallback, useState } from 'react'
import { simplifyArticle } from '../api'
import { articleKey } from '../utils/articles'

// Guarda as explicações geradas pelo LLM durante a visita, por publicação,
// para não gerar de novo ao reabrir a mesma publicação.
export function useSimplifications() {
  const [entries, setEntries] = useState({})

  const simplify = useCallback(async (article) => {
    const key = articleKey(article)
    setEntries((current) => ({ ...current, [key]: { status: 'loading' } }))
    try {
      const text = await simplifyArticle(article)
      setEntries((current) => ({ ...current, [key]: { status: 'done', text } }))
    } catch (error) {
      setEntries((current) => ({ ...current, [key]: { status: 'error', error: error.message } }))
    }
  }, [])

  return [entries, simplify]
}
