import { Fragment, useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowUpRightFromSquare,
  faCircleInfo,
  faFlask,
  faLightbulb,
  faRobot,
  faTriangleExclamation,
  faWandMagicSparkles,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import {
  displayName,
  isProgramResearcher,
  isRestricted,
  referenceTypeInfo,
  splitAuthors,
} from '../utils/articles'
import styles from './ArticleModal.module.css'

export default function ArticleModal({ article, simplification, onSimplify, onClose }) {
  const dialogRef = useRef(null)
  const pressedOnBackdrop = useRef(false)
  const [view, setView] = useState('simple')
  const type = referenceTypeInfo(article.reference_type)
  const authors = splitAuthors(article.authors)

  useEffect(() => {
    // sem cleanup de propósito: fechar o dialog dispara onClose, que desmonta o modal
    if (!dialogRef.current.open) dialogRef.current.showModal()
  }, [])

  const close = () => dialogRef.current.close()

  // clique no fundo escurecido fecha o modal - mas só se começou nele, para não
  // fechar quando a pessoa seleciona um trecho do resumo e solta o mouse fora
  const handlePointerDown = (event) => {
    pressedOnBackdrop.current = event.target === dialogRef.current
  }
  const handleClick = (event) => {
    if (pressedOnBackdrop.current && event.target === dialogRef.current) close()
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClose={onClose}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      aria-labelledby="modal-titulo"
    >
      <div className={styles.panel}>
        <header className={styles.header}>
          <div className={styles.meta}>
            <span className={styles.icon} aria-hidden="true">
              <FontAwesomeIcon icon={type.icon} />
            </span>
            <span className={styles.type}>{type.label}</span>
            {article.year && <span className={styles.year}>{article.year}</span>}
          </div>
          <h2 id="modal-titulo" className={styles.title}>
            {article.title}
          </h2>
          <p className={styles.authors}>
            {authors.map((author, index) => (
              <Fragment key={`${author}-${index}`}>
                {index > 0 && ', '}
                {isProgramResearcher(author, article.matched_authors) ? (
                  <strong>{displayName(author)}</strong>
                ) : (
                  displayName(author)
                )}
              </Fragment>
            ))}
          </p>
          <button type="button" className={styles.close} onClick={close} aria-label="Fechar">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <div className={styles.switch} role="group" aria-label="Formato do conteúdo">
          <button type="button" aria-pressed={view === 'simple'} onClick={() => setView('simple')}>
            <FontAwesomeIcon icon={faLightbulb} /> Explicação simplificada
          </button>
          <button type="button" aria-pressed={view === 'technical'} onClick={() => setView('technical')}>
            <FontAwesomeIcon icon={faFlask} /> Versão técnica
          </button>
        </div>

        <div className={styles.body}>
          {view === 'simple' ? (
            <SimplifiedView
              article={article}
              simplification={simplification}
              onSimplify={onSimplify}
              onShowTechnical={() => setView('technical')}
            />
          ) : (
            <TechnicalView article={article} type={type} authors={authors} />
          )}
        </div>
      </div>
    </dialog>
  )
}

function SimplifiedView({ article, simplification, onSimplify, onShowTechnical }) {
  const technicalLink = (
    <button type="button" className={styles.linkButton} onClick={onShowTechnical}>
      versão técnica
    </button>
  )

  if (!article.abstract) {
    return (
      <div className={styles.notice}>
        <FontAwesomeIcon icon={faCircleInfo} />
        <p>
          Esta publicação não tem resumo cadastrado no BibDigital, por isso ainda não é possível gerar
          uma explicação simplificada. Veja os dados na {technicalLink} ou acesse a publicação original.
        </p>
      </div>
    )
  }

  if (simplification?.status === 'loading') {
    return (
      <div className={styles.generating} role="status">
        <span className={styles.ctaIcon}>
          <FontAwesomeIcon icon={faWandMagicSparkles} />
        </span>
        <p className={styles.ctaTitle}>Lendo o resumo e preparando uma explicação…</p>
        <p>O modelo de linguagem roda nos servidores do projeto e pode levar alguns segundos.</p>
        <div className={styles.lines} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    )
  }

  if (simplification?.status === 'done') {
    return (
      <>
        <div className={styles.simplified}>
          <RichText text={simplification.text} />
        </div>
        <p className={styles.disclaimer}>
          <FontAwesomeIcon icon={faRobot} />
          <span>
            Texto gerado automaticamente por Inteligência Artificial a partir do resumo original e pode
            conter imprecisões. Em caso de dúvida, consulte a {technicalLink}.
          </span>
        </p>
      </>
    )
  }

  const failed = simplification?.status === 'error'
  return (
    <div className={styles.cta}>
      <span className={styles.ctaIcon}>
        <FontAwesomeIcon icon={faWandMagicSparkles} />
      </span>
      <p className={styles.ctaTitle}>Entenda esta pesquisa em linguagem simples</p>
      <p>
        Um modelo de linguagem (LLM) lê o resumo técnico da publicação e o reescreve de forma clara e
        didática, em português.
      </p>
      {failed && (
        <p className={styles.error} role="alert">
          <FontAwesomeIcon icon={faTriangleExclamation} /> {simplification.error}. Tente novamente em
          instantes.
        </p>
      )}
      <button type="button" className={styles.primaryButton} onClick={() => onSimplify(article)}>
        <FontAwesomeIcon icon={faWandMagicSparkles} />
        {failed ? 'Tentar novamente' : 'Gerar explicação simplificada'}
      </button>
    </div>
  )
}

function TechnicalView({ article, type, authors }) {
  const details = [
    ['Tipo', type.label],
    ['Ano', article.year],
    ['Autores', authors.map(displayName).join('; ')],
    ['Pesquisadores do programa', article.matched_authors?.join(', ')],
    [
      'DOI',
      article.doi && (
        <a href={`https://doi.org/${article.doi}`} target="_blank" rel="noopener noreferrer">
          {article.doi}
        </a>
      ),
    ],
    ['Acesso', isRestricted(article) && 'Restrito no BibDigital'],
    ['Identificador no BibDigital', article.identifier],
    ['Chave de citação', article.citation_key && <code>{article.citation_key}</code>],
  ].filter(([, value]) => value)

  return (
    <>
      <h3 className={styles.sectionLabel}>Resumo original</h3>
      {article.abstract ? (
        <p className={styles.abstract}>{article.abstract}</p>
      ) : (
        <p className={styles.muted}>Resumo não disponível no BibDigital.</p>
      )}

      <h3 className={styles.sectionLabel}>Dados da publicação</h3>
      <dl className={styles.details}>
        {details.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      {article.link && (
        <a className={styles.primaryButton} href={article.link} target="_blank" rel="noopener noreferrer">
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} /> Acessar publicação original
        </a>
      )}
    </>
  )
}

// Texto do LLM em parágrafos, sem injetar HTML: só **negrito** vira <strong>
function RichText({ text }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/^#+\s*/, '').trim())
    .filter(Boolean)

  return paragraphs.map((paragraph, index) => (
    <p key={index}>
      {paragraph.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) =>
        part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
          <strong key={partIndex}>{part.slice(2, -2)}</strong>
        ) : (
          part
        ),
      )}
    </p>
  ))
}
