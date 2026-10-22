import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFire } from '@fortawesome/free-solid-svg-icons'
import styles from './SectionTitle.module.css'

// Título de seção do portal: caixa-alta, ícone de fogo e linhas dos dois lados
export default function SectionTitle({ id, children }) {
  return (
    <div className={styles.tile}>
      <h2 id={id} className={styles.title}>
        <FontAwesomeIcon icon={faFire} />
        {children}
      </h2>
    </div>
  )
}
