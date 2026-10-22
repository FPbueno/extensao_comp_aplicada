import {
  faBook,
  faBookOpen,
  faClipboardList,
  faFileLines,
  faFilm,
  faGlobe,
  faGraduationCap,
  faMicrophoneLines,
  faNewspaper,
  faPeopleGroup,
} from '@fortawesome/free-solid-svg-icons'

// Tipos de referência do BibDigital -> rótulo em português e ícone
const REFERENCE_TYPES = {
  'Journal Article': { label: 'Artigo em periódico', icon: faNewspaper },
  'Conference Paper': { label: 'Trabalho em evento', icon: faPeopleGroup },
  'Conference Abstract': { label: 'Resumo em evento', icon: faMicrophoneLines },
  Thesis: { label: 'Tese ou dissertação', icon: faGraduationCap },
  Book: { label: 'Livro', icon: faBook },
  'Book Section': { label: 'Capítulo de livro', icon: faBookOpen },
  Report: { label: 'Relatório', icon: faClipboardList },
  'Audiovisual Material': { label: 'Material audiovisual', icon: faFilm },
  'Electronic Source': { label: 'Fonte eletrônica', icon: faGlobe },
}

// O BibDigital marca publicações fechadas no próprio tipo: "Journal Article restricted access"
const RESTRICTED_SUFFIX = /\s*restricted access$/i

export function baseReferenceType(type) {
  return (type ?? '').replace(RESTRICTED_SUFFIX, '')
}

export function isRestricted(article) {
  return RESTRICTED_SUFFIX.test(article.reference_type ?? '')
}

export function referenceTypeInfo(type) {
  const baseType = baseReferenceType(type)
  return REFERENCE_TYPES[baseType] ?? { label: baseType || 'Publicação', icon: faFileLines }
}

export function articleKey(article) {
  return article.identifier || article.citation_key || article.doi || article.title
}

// Remove acentos e caixa para buscas e comparações ("Caíque" == "caique")
export function normalize(text) {
  return (text ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

// "Morelli, Fabiano; Setzer, Alberto W." -> ["Morelli, Fabiano", "Setzer, Alberto W."]
export function splitAuthors(authors) {
  return (authors ?? '')
    .split(';')
    .map((author) => author.trim())
    .filter(Boolean)
}

// "Morelli, Fabiano" -> "Fabiano Morelli"
export function displayName(author) {
  const [surname, given] = author.split(',').map((part) => part.trim())
  return given ? `${given} ${surname}` : surname
}

// Mesmo critério do back (_author_matches): sobrenome + inicial do primeiro nome
export function isProgramResearcher(author, matchedAuthors = []) {
  const [surname = '', given = ''] = author.split(',').map((part) => normalize(part.trim()))
  const lastSurname = surname.split(/\s+/).at(-1)
  return matchedAuthors.some((name) => {
    const tokens = normalize(name).split(/\s+/)
    return tokens.at(-1) === lastSurname && tokens[0][0] === given[0]
  })
}

export function searchableText(article) {
  return normalize(
    [
      article.title,
      article.authors,
      article.abstract,
      article.year,
      referenceTypeInfo(article.reference_type).label,
      ...(article.matched_authors ?? []),
    ].join(' '),
  )
}

export const SORT_OPTIONS = {
  recent: { label: 'Mais recentes', compare: (a, b) => (b.year ?? '').localeCompare(a.year ?? '') },
  oldest: { label: 'Mais antigas', compare: (a, b) => (a.year ?? '9999').localeCompare(b.year ?? '9999') },
  title: { label: 'Título (A–Z)', compare: (a, b) => a.title.localeCompare(b.title, 'pt-BR') },
}
