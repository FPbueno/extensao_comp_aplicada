import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons'
import styles from './Footer.module.css'

const PORTAL = 'https://data.inpe.br/queimadas'

const COLUMNS = [
  {
    title: 'Hub',
    links: [
      { label: 'Início', href: '#inicio' },
      { label: 'Publicações', href: '#publicacoes' },
      { label: 'Como funciona', href: '#como-funciona' },
    ],
  },
  {
    title: 'Sistemas',
    links: [
      { label: 'BDQueimadas', href: `${PORTAL}/bdqueimadas/` },
      { label: 'Situação Atual', href: `${PORTAL}/situacao_atual/` },
      { label: 'Área Queimada', href: `${PORTAL}/aq1km/` },
      { label: 'Estatísticas', href: `${PORTAL}/estatisticas/?tipo=paises&item=brasil` },
    ],
  },
  {
    title: 'Relatórios',
    links: [
      { label: 'Painel do Fogo', href: `${PORTAL}/painel-do-fogo/` },
      { label: 'Boletim InfoQueima', href: `${PORTAL}/boletim-infoqueima/` },
      { label: 'Anuário Risco de Fogo', href: `${PORTAL}/anuario-risco-de-fogo/` },
    ],
  },
  {
    title: 'Informações',
    links: [
      { label: 'Portal do Programa Queimadas', href: `${PORTAL}/portal/` },
      { label: 'Perguntas Frequentes', href: `${PORTAL}/faq/` },
      { label: 'Equipe', href: `${PORTAL}/equipe/` },
      { label: 'Guia de Estilo', href: `${PORTAL}/design-system/` },
    ],
  },
]

// Rodapé recolhível, como o do portal: a barra com o endereço abre as colunas de links
export default function Footer() {
  const [open, setOpen] = useState(false)

  return (
    <footer className={styles.footer}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls="rodape-links"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={styles.tab} aria-hidden="true">
          <FontAwesomeIcon icon={open ? faCaretDown : faCaretUp} />
        </span>
        {new Date().getFullYear()} • Hub de Divulgação Científica • Programa Queimadas do INPE • Av. dos
        Astronautas, 1.758 • São José dos Campos • SP
      </button>

      <div id="rodape-links" className={styles.links} hidden={!open}>
        <div className={`container ${styles.columns}`}>
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3>{column.title}</h3>
              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...(link.href.startsWith('http') && { target: '_blank', rel: 'noopener noreferrer' })}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}
