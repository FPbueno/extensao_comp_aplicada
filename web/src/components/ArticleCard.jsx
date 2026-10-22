import { Fragment } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowUpRightFromSquare,
  faLightbulb,
  faLock,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons'
import {
  displayName,
  isProgramResearcher,
  isRestricted,
  referenceTypeInfo,
  splitAuthors,
} from '../utils/articles'
import styles from './ArticleCard.module.css'

const VISIBLE_AUTHORS = 3

export default function ArticleCard({ article, onOpen }) {
  const type = referenceTypeInfo(article.reference_type)
  const authors = splitAuthors(article.authors)
  const hiddenAuthors = authors.length - VISIBLE_AUTHORS

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          <FontAwesomeIcon icon={type.icon} />
        </span>
        <div className={styles.meta}>
          <span className={styles.type}>{type.label}</span>
          <span className={styles.year}>
            {article.year ?? 'Ano não informado'}
            {isRestricted(article) && (
              <span className={styles.restricted}>
                <FontAwesomeIcon icon={faLock} /> acesso restrito
              </span>
            )}
          </span>
        </div>
        {article.abstract && (
          <span className={styles.aiTag} title="Explicação simplificada com IA disponível">
            <FontAwesomeIcon icon={faWandMagicSparkles} /> IA
          </span>
        )}
      </div>

      <h3 className={styles.title}>{article.title}</h3>

      <p className={styles.authors}>
        {authors.slice(0, VISIBLE_AUTHORS).map((author, index) => (
          <Fragment key={`${author}-${index}`}>
            {index > 0 && ', '}
            {isProgramResearcher(author, article.matched_authors) ? (
              <strong>{displayName(author)}</strong>
            ) : (
              displayName(author)
            )}
          </Fragment>
        ))}
        {hiddenAuthors > 0 && ` e mais ${hiddenAuthors}`}
      </p>

      <div className={styles.actions}>
        <button type="button" className={styles.open} onClick={() => onOpen(article)}>
          <FontAwesomeIcon icon={faLightbulb} /> Entenda a pesquisa
        </button>
        {article.link && (
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.source}
            title="Abrir publicação original"
            aria-label={`Abrir publicação original: ${article.title}`}
          >
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
          </a>
        )}
      </div>
    </article>
  )
}
