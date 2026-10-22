import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowUpRightFromSquare,
  faBars,
  faBookOpen,
  faCircleInfo,
  faFire,
  faHouse,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import logoInpe from '../assets/brand/LogoINPE.svg'
import logoQueimadas from '../assets/brand/LogoQmd.svg'
import styles from './Header.module.css'

const SECTIONS = [
  { href: '#inicio', label: 'Início', icon: faHouse },
  { href: '#publicacoes', label: 'Publicações', icon: faBookOpen },
  { href: '#como-funciona', label: 'Como funciona', icon: faCircleInfo },
]

// Mesmo cabeçalho do portal do Programa Queimadas: logotipos do INPE e do
// programa, nome em azul institucional e navegação com ícones.
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <a href="#inicio" className={styles.brand} onClick={closeMenu}>
          <img src={logoInpe} alt="INPE" className={styles.logoInpe} />
          <img src={logoQueimadas} alt="" className={styles.logoQueimadas} />
          <span className={styles.brandText}>
            <span className={styles.brandKicker}>Programa</span>
            <span className={styles.brandTitle}>Queimadas</span>
            <span className={styles.brandDescription}>Instituto Nacional de Pesquisas Espaciais</span>
          </span>
        </a>

        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={menuOpen}
          aria-controls="menu-principal"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} />
        </button>

        <nav
          id="menu-principal"
          aria-label="Menu principal"
          className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}
        >
          {SECTIONS.map((section) => (
            <a key={section.href} href={section.href} onClick={closeMenu}>
              <FontAwesomeIcon icon={section.icon} /> {section.label}
            </a>
          ))}
          <a href="https://data.inpe.br/queimadas/portal/" target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={faFire} /> Portal Queimadas
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} className={styles.external} />
          </a>
        </nav>
      </div>
    </header>
  )
}
