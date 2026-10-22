import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBookOpen,
  faChartLine,
  faEarthAmericas,
  faFire,
  faLeaf,
  faMagnifyingGlass,
  faSatellite,
} from '@fortawesome/free-solid-svg-icons'
import logoQueimadas from '../assets/brand/LogoQmd.svg'
import styles from './Hero.module.css'

const ORBIT_ICONS = [faSatellite, faLeaf, faChartLine, faEarthAmericas, faBookOpen]

export default function Hero({ query, onQueryChange, onSearch, stats, loading }) {
  const handleSubmit = (event) => {
    event.preventDefault()
    onSearch()
  }

  return (
    <section id="inicio" className={styles.hero}>
      <div className={`container ${styles.banner}`}>
        <div>
          <p className={styles.kicker}>
            <FontAwesomeIcon icon={faFire} /> Hub de Divulgação Científica
          </p>
          <h1 className={styles.title}>
            A ciência sobre queimadas, <span className={styles.highlight}>explicada para todo mundo</span>
          </h1>
          <p className={styles.lead}>
            Conheça as pesquisas do Programa Queimadas do INPE em linguagem simples, com explicações
            geradas com apoio de Inteligência Artificial, e consulte o texto técnico original sempre que
            quiser se aprofundar.
          </p>

          <form role="search" className={styles.search} onSubmit={handleSubmit}>
            <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.searchIcon} />
            <label htmlFor="busca-hero" className="visually-hidden">
              Buscar publicações
            </label>
            <input
              id="busca-hero"
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Busque por tema, título ou pesquisador"
            />
            <button type="submit">Buscar</button>
          </form>

          <dl className={styles.stats}>
            <Stat label="publicações" value={stats.total} loading={loading} />
            <Stat label="pesquisadores" value={stats.researchers} loading={loading} />
            <Stat label="período" value={stats.period} loading={loading} />
          </dl>
        </div>

        <div className={styles.visual} aria-hidden="true">
          <div className={styles.ring}>
            {ORBIT_ICONS.map((icon, index) => (
              <span
                key={icon.iconName}
                className={styles.planet}
                style={{ '--index': index, '--total': ORBIT_ICONS.length }}
              >
                <FontAwesomeIcon icon={icon} />
              </span>
            ))}
          </div>
          <span className={styles.core}>
            <img src={logoQueimadas} alt="" />
          </span>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value, loading }) {
  return (
    <div className={styles.stat}>
      <dt>{label}</dt>
      <dd>{loading ? <span className={styles.skeleton} /> : value}</dd>
    </div>
  )
}
