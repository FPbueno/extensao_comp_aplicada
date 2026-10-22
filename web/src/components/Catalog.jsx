import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEraser,
  faFire,
  faMagnifyingGlass,
  faRotateRight,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import ArticleCard from './ArticleCard'
import SectionTitle from './SectionTitle'
import { articleKey, referenceTypeInfo, SORT_OPTIONS } from '../utils/articles'
import styles from './Catalog.module.css'

const PAGE_SIZE = 12

export default function Catalog({ status, error, onRetry, articles, catalog, onOpen }) {
  return (
    <section id="publicacoes" className={`container ${styles.catalog}`} aria-labelledby="publicacoes-titulo">
      <SectionTitle id="publicacoes-titulo">Publicações</SectionTitle>
      <p className={styles.intro}>
        Artigos, trabalhos em eventos e outras produções de pesquisadores do Programa Queimadas,
        reunidos a partir da Biblioteca Digital do INPE (BibDigital). Abra uma publicação para ler a
        explicação simplificada ou a versão técnica original.
      </p>

      {status === 'loading' && <LoadingState />}
      {status === 'error' && <ErrorState error={error} onRetry={onRetry} />}
      {status === 'success' &&
        (articles.length === 0 ? (
          <div className={styles.empty}>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <p>Nenhuma publicação dos pesquisadores do programa foi encontrada no BibDigital.</p>
          </div>
        ) : (
          <>
            <Toolbar catalog={catalog} />
            {/* a key reinicia a paginação sempre que os filtros mudam */}
            <Results
              key={JSON.stringify(catalog.filters)}
              articles={catalog.filtered}
              onOpen={onOpen}
              onReset={catalog.resetFilters}
              isFiltered={catalog.isFiltered}
            />
          </>
        ))}
    </section>
  )
}

function Toolbar({ catalog }) {
  const { filters, setFilter, typeOptions, researcherOptions } = catalog

  return (
    <div className={styles.toolbar}>
      <div className={styles.fields}>
        <div className={styles.searchField}>
          <FontAwesomeIcon icon={faMagnifyingGlass} />
          <label htmlFor="busca-catalogo" className="visually-hidden">
            Buscar nas publicações
          </label>
          <input
            id="busca-catalogo"
            type="search"
            value={filters.query}
            onChange={(event) => setFilter('query', event.target.value)}
            placeholder="Buscar por título, autor, ano ou palavra do resumo"
          />
        </div>

        <label htmlFor="filtro-pesquisador" className="visually-hidden">
          Pesquisador do programa
        </label>
        <select
          id="filtro-pesquisador"
          className={styles.select}
          value={filters.researcher}
          onChange={(event) => setFilter('researcher', event.target.value)}
        >
          <option value="all">Todos os pesquisadores</option>
          {researcherOptions.map(({ value, count }) => (
            <option key={value} value={value}>
              {value} ({count})
            </option>
          ))}
        </select>

        <label htmlFor="ordenacao" className="visually-hidden">
          Ordenar por
        </label>
        <select
          id="ordenacao"
          className={styles.select}
          value={filters.sort}
          onChange={(event) => setFilter('sort', event.target.value)}
        >
          {Object.entries(SORT_OPTIONS).map(([value, option]) => (
            <option key={value} value={value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.chips} role="group" aria-label="Tipo de publicação">
        <button
          type="button"
          className={styles.chip}
          aria-pressed={filters.type === 'all'}
          onClick={() => setFilter('type', 'all')}
        >
          Todos os tipos
        </button>
        {typeOptions.map(({ value, count }) => (
          <button
            key={value}
            type="button"
            className={styles.chip}
            aria-pressed={filters.type === value}
            onClick={() => setFilter('type', value)}
          >
            <FontAwesomeIcon icon={referenceTypeInfo(value).icon} />
            {referenceTypeInfo(value).label}
            <span className={styles.chipCount}>{count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Results({ articles, onOpen, onReset, isFiltered }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const remaining = articles.length - visibleCount

  return (
    <>
      <div className={styles.summary} aria-live="polite">
        <span>
          <strong>{articles.length}</strong>{' '}
          {articles.length === 1 ? 'publicação encontrada' : 'publicações encontradas'}
        </span>
        {isFiltered && (
          <button type="button" className={styles.clear} onClick={onReset}>
            <FontAwesomeIcon icon={faEraser} /> Limpar filtros
          </button>
        )}
      </div>

      {articles.length === 0 ? (
        <div className={styles.empty}>
          <FontAwesomeIcon icon={faMagnifyingGlass} />
          <p>Nenhuma publicação corresponde aos filtros escolhidos.</p>
          <button type="button" className={styles.secondaryButton} onClick={onReset}>
            Limpar filtros
          </button>
        </div>
      ) : (
        <ul className={styles.grid}>
          {articles.slice(0, visibleCount).map((article) => (
            <li key={articleKey(article)}>
              <ArticleCard article={article} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}

      {remaining > 0 && (
        <button
          type="button"
          className={`${styles.secondaryButton} ${styles.more}`}
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
        >
          Mostrar mais publicações ({remaining} restantes)
        </button>
      )}
    </>
  )
}

function LoadingState() {
  const elapsed = useElapsedSeconds()
  const minutes = Math.floor(elapsed / 60)
  const seconds = String(elapsed % 60).padStart(2, '0')

  return (
    <div role="status">
      <div className={styles.loadingBox}>
        <span className={styles.flame}>
          <FontAwesomeIcon icon={faFire} />
        </span>
        <div>
          <p className={styles.loadingTitle}>Buscando publicações na Biblioteca Digital do INPE…</p>
          <p>
            A primeira consulta reúne os trabalhos de todos os pesquisadores do programa e pode levar
            alguns minutos. Depois disso, os resultados ficam guardados e carregam na hora.{' '}
            <span className={styles.elapsed}>
              {minutes}:{seconds}
            </span>
          </p>
        </div>
      </div>
      <ul className={styles.grid} aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index} className={styles.skeletonCard} />
        ))}
      </ul>
    </div>
  )
}

function ErrorState({ error, onRetry }) {
  return (
    <div className={styles.errorBox} role="alert">
      <FontAwesomeIcon icon={faTriangleExclamation} />
      <div>
        <p className={styles.errorTitle}>Não foi possível carregar as publicações</p>
        <p>Motivo: {error?.message}. Tente novamente em alguns instantes.</p>
        <button type="button" className={styles.primaryButton} onClick={onRetry}>
          <FontAwesomeIcon icon={faRotateRight} /> Tentar novamente
        </button>
      </div>
    </div>
  )
}

function useElapsedSeconds() {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [])
  return elapsed
}
