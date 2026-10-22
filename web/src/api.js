// Todas as chamadas ao back passam por /api: em produção o nginx repassa para o
// container "back"; no `npm run dev` quem repassa é o proxy do Vite.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

async function post(path, body) {
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('não foi possível conectar ao servidor')
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.error) {
    throw new Error(data.error || `o servidor respondeu com erro ${response.status}`)
  }
  return data
}

export async function fetchArticles() {
  const data = await post('/scrapping', {})
  return data.articles ?? []
}

export async function simplifyArticle(article) {
  const data = await post('/simplify', { title: article.title, text: article.abstract })
  return data.simplified
}
