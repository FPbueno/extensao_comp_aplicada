import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBookOpenReader,
  faChalkboardUser,
  faDatabase,
  faLandmark,
  faNewspaper,
  faPeopleGroup,
  faSatelliteDish,
  faUserGraduate,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons'
import SectionTitle from './SectionTitle'
import styles from './HowItWorks.module.css'

const STEPS = [
  {
    icon: faDatabase,
    title: 'Coleta das publicações',
    text: 'Reunimos os trabalhos dos pesquisadores do Programa Queimadas catalogados na Biblioteca Digital do INPE (BibDigital).',
  },
  {
    icon: faWandMagicSparkles,
    title: 'Simplificação com IA',
    text: 'Um modelo de linguagem (LLM) reescreve os resumos técnicos em linguagem clara, explicando o problema, o método e a importância de cada pesquisa.',
  },
  {
    icon: faBookOpenReader,
    title: 'Acesso para todos',
    text: 'Qualquer pessoa pode explorar o catálogo e alternar entre a explicação simplificada e o texto técnico original.',
  },
]

const AUDIENCES = [
  { icon: faUserGraduate, label: 'Estudantes' },
  { icon: faChalkboardUser, label: 'Professores' },
  { icon: faNewspaper, label: 'Jornalistas' },
  { icon: faLandmark, label: 'Gestores públicos' },
  { icon: faPeopleGroup, label: 'Cidadãos' },
]

export default function HowItWorks() {
  return (
    <section id="como-funciona" className={styles.section} aria-labelledby="como-funciona-titulo">
      <div className="container">
        <SectionTitle id="como-funciona-titulo">Como funciona</SectionTitle>
        <p className={styles.intro}>
          Grande parte do que o Programa Queimadas produz fica restrita a artigos e relatórios com forte
          rigor técnico. O hub aproxima essa ciência da sociedade, mostrando o que é pesquisado nos
          bastidores do monitoramento de queimadas no Brasil.
        </p>

        <ol className={styles.steps}>
          {STEPS.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <span className={styles.stepIcon} aria-hidden="true">
                <FontAwesomeIcon icon={step.icon} />
              </span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>

        <div className={styles.audience}>
          <h3>Para quem é o hub</h3>
          <ul>
            {AUDIENCES.map((audience) => (
              <li key={audience.label}>
                <FontAwesomeIcon icon={audience.icon} /> {audience.label}
              </li>
            ))}
          </ul>
        </div>

        <aside className={styles.about}>
          <span className={styles.aboutIcon} aria-hidden="true">
            <FontAwesomeIcon icon={faSatelliteDish} />
          </span>
          <p>
            <strong>Sobre o projeto.</strong> Este hub é um protótipo desenvolvido na disciplina de
            Extensão em Computação Aplicada e Tecnologias Digitais por Caique Frederico Pereira de Moura
            e Fillipe Bueno de Almeida, pensado para ser integrado à plataforma do BDQueimadas.
          </p>
        </aside>
      </div>
    </section>
  )
}
