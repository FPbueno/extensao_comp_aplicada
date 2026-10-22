# CLAUDE.md

Orientações para o Claude Code (e para quem mais trabalhar neste repositório).

## Contexto do projeto

**Hub de Divulgação Científica do Programa Queimadas: Simplificação da Linguagem Técnica com Uso de LLMs.**
Projeto da disciplina *Extensão em Computação Aplicada e Tecnologias Digitais*, de Caique Frederico Pereira de Moura e Fillipe Bueno de Almeida.

- **O que é:** uma página web que funciona como hub (vitrine) das produções científicas e tecnológicas do Programa Queimadas do INPE. O diferencial é usar LLMs para reescrever resumos acadêmicos, relatórios técnicos e descrições de pesquisa em linguagem acessível, clara e didática.
- **Para quem:** o público geral, incluindo estudantes, professores da educação básica, jornalistas, gestores públicos e cidadãos interessados no meio ambiente. Hoje a produção científica do programa fica restrita a artigos e relatórios com forte rigor técnico; o hub quer democratizar esse conhecimento.
- **Como é usado:** o visitante navega por um catálogo visual das pesquisas, lê um *overview* simplificado gerado com LLM (objetivo, método e aplicações práticas) e pode **alternar entre a explicação simplificada e as informações ou publicações técnicas originais**.
- **Destino:** ser integrado à plataforma do BDQueimadas (<https://data.inpe.br/queimadas/>) como um módulo/seção. Por isso o front segue a identidade visual desse portal.

Entregas previstas até o fim da disciplina:

1. **Protótipo funcional do hub**, com interface pronta para futura integração ao BDQueimadas.
2. **Pipeline de simplificação textual com LLM**, via engenharia de prompts e PLN.
3. **Conjunto inicial de projetos catalogados**: uma amostra real de pesquisas do programa já processadas, para demonstração e validação.

A proposta é preliminar e pode mudar ao longo da disciplina. Prefira entregas concretas e realistas a soluções grandes.

## Arquitetura

Três serviços no `docker-compose.yml`:

```
navegador ──> front (nginx :80) ──/api/*──> back (Flask :5555) ──> llm (llama.cpp :8080)
                                                  └──> BibDigital/INPE (scraping)
```

| Serviço | Pasta | Tecnologia | Porta interna | Porta no host |
|---|---|---|---|---|
| `front` | `web/` | React 19 + Vite 8; build servido por nginx | 80 | `8080` (`FRONT_PORT`) |
| `back` | `source/` | Flask (Python 3.12) | 5555 | `127.0.0.1:5000` (`BACK_PORT`) |
| `llm` | (imagem oficial) | llama.cpp server `ghcr.io/ggml-org/llama.cpp:server-b11277` | 8080 | `127.0.0.1:8081` (`LLM_PORT`) |

- O navegador só fala com o `front`. O nginx serve o build do React e repassa `/api/*` para `http://back:5555/*`, então não há CORS nem URL de API fixa no código do front.
- O `back` concentra a lógica: o scraping do BibDigital e o pipeline de simplificação (prompts).
- O `llm` é só o runtime de inferência, com API compatível com a da OpenAI (`POST /v1/chat/completions`). Para trocar de servidor (Ollama, vLLM, API externa), basta mudar `LLM_SERVICE_URL`.
- O modelo (por padrão `Qwen/Qwen2.5-1.5B-Instruct-GGUF`, arquivo `qwen2.5-1.5b-instruct-q4_k_m.gguf`) é baixado do Hugging Face na primeira subida e fica no volume `llm-cache`. Para trocar de modelo, use `LLM_MODEL_REPO`/`LLM_MODEL_FILE` no `.env`, e não o `config.yaml`.
- A porta 5555 **não** é publicada no host, porque nesta máquina ela já é usada por um processo do VS Code. Por isso o back aparece em `localhost:5000`.

## Estrutura

```
docker-compose.yml        # orquestra front, back e llm
.env.example              # portas e modelo (copie para .env para sobrescrever)
source/                   # serviço back (Flask)
  app.py                  # rotas; lê config/config.yaml via get_params()
  config/config.yaml      # configuração do back (rotas, autores, system_prompt...)
  services/data_scraping.py  # scraping do BibDigital (DataScraping)
  services/llm.py         # cliente do serviço llm (LLMService)
  Dockerfile, requirements.txt
web/                      # serviço front (React + Vite)
  nginx.conf, Dockerfile  # build multi-stage: node:22-slim -> nginx:1.30-alpine
  vite.config.js          # proxy de /api no `npm run dev`
  src/api.js              # todas as chamadas HTTP ao back
  src/hooks/              # useArticles, useCatalogFilters, useSimplifications
  src/components/         # um componente por arquivo + *.module.css
  src/styles/tokens.css   # tokens da identidade visual do INPE
  src/assets/brand/       # logotipos oficiais (INPE e Programa Queimadas)
```

## Como rodar

```bash
docker compose up --build        # sobe tudo; abra http://localhost:8080
docker compose logs -f back      # acompanhar o scraping
docker compose up -d --build --no-deps front   # rebuild só do front, sem reiniciar o back
docker compose down              # parar (o modelo continua no volume llm-cache)
```

Sem `--no-deps`, rebuildar o front também recria o back, e o cache em memória do scraping se perde.

Na primeira vez, o `llm` baixa o modelo (cerca de 1 GB) antes de ficar `healthy`, e a primeira consulta de publicações leva cerca de 2 minutos (veja "Scraping" abaixo).

Desenvolvimento fora do Docker:

- **Back:** `cd source && pip install -r requirements.txt && python app.py`. Rode a partir de `source/`, porque o `app.py` abre `./config/config.yaml`. O LLM é acessado em `llm_service_url` (`http://localhost:8081`, a porta publicada pelo compose); para ter só o LLM no ar, use `docker compose up llm`.
- **Front:** `cd web && npm install && npm run dev`. O Vite 8 exige **Node ≥ 20.19** (recomendado 22 LTS); a máquina de desenvolvimento ainda tem Node 18. O proxy do Vite manda `/api` para `http://localhost:5000` (o back do compose); para usar um Flask local, rode `VITE_API_PROXY=http://localhost:5555 npm run dev`. Se o front for servido longe do back (ex.: dentro do BDQueimadas), defina `VITE_API_BASE_URL` no build.
- Não há testes automatizados ainda. Para validar o front, use `npm run build` e a página no navegador; para validar o back, use `curl` nas rotas abaixo.

## API do back

Os erros usam o formato `{"error": "<mensagem em português>"}`, com status 400 para entrada inválida e 502 quando um serviço externo (BibDigital ou LLM) falha.

| Rota | Corpo | Resposta |
|---|---|---|
| `POST /scrapping` | `{"authors": [...]}` (opcional; padrão `queimadas_authors`) | `{"total", "articles": [...]}` |
| `POST /simplify` | `{"title", "text"}` | `{"simplified"}` |

Pelo front, as mesmas rotas ficam em `/api/scrapping` e `/api/simplify`. Cada artigo tem `citation_key`, `reference_type` (tipos do BibDigital, ex.: `Journal Article`), `authors` (`"Sobrenome, Nome; ..."`), `year`, `title`, `link`, `identifier`, `doi`, `abstract` (pode ser `null`), `matched_authors` (quais autores do config deram match) e `source`.

## Configuração do back

`source/config/config.yaml` é uma lista de pares chave/valor lida por `get_params()` em `app.py`. Variáveis de ambiente sobrescrevem só o que muda entre ambientes (hoje, `LLM_SERVICE_URL`).

- `system_prompt`: prompt base da simplificação. É o principal ponto de iteração do pipeline de LLM.
- `queimadas_authors`: pesquisadores do programa usados no scraping.
- `scrap_cache_ttl_seconds`: tempo de vida do cache em memória do `/scrapping` (6 h). O cache se perde quando o container reinicia.

## Scraping do BibDigital (`source/services/data_scraping.py`)

- Para cada autor, busca pelo primeiro nome **e** pelo sobrenome, porque cada busca só retorna os 10 resultados mais recentes e nomes comuns enterram os artigos certos. Depois valida sobrenome + inicial (`_author_matches`) e deduplica por DOI.
- Para cada artigo novo, baixa a página de metadados completos, de onde saem a lista completa de autores, o DOI e o resumo (`abstract`).
- É **lento**: a busca completa dos 8 autores do config leva cerca de 100 s (medido em out/2026; até ~35 s para um único autor). Não chame em loop; o `app.py` guarda o resultado em cache e o front compartilha uma única requisição entre montagens (StrictMode).
- Muitos resumos estão em inglês; o `system_prompt` pede a resposta sempre em português.

## Identidade visual (front)

Ela é baseada no portal <https://data.inpe.br/queimadas/> e no Guia de Estilo oficial (<https://data.inpe.br/queimadas/design-system/>).

- **Tokens** em `web/src/styles/tokens.css`, com **os mesmos nomes de variáveis CSS do portal** (`--primary-color-*`, `--secondary-color-*`, `--neutral-gray-*`, `--institutional-blue-*`). Mantenha esses nomes para facilitar a integração.
- **Cores oficiais:** primária *Primary Red* `#cf4c39`; secundária *Secundary Orange* `#e69627`. O azul institucional `#3478b7` vai no texto do logotipo do cabeçalho e o laranja `#f79c04` nos ícones dos cards.
- **Fonte:** Rawline (carregada de `fonts.cdnfonts.com`, como no portal), com fallback para Raleway.
- **Ícones:** Font Awesome (`@fortawesome/react-fontawesome`), o mesmo do portal.
- **Padrões do portal reproduzidos:** títulos de seção em caixa-alta com ícone de fogo entre linhas (`SectionTitle`); cards cinza-claro (`--neutral-gray-50`, raio 15px, sombra `0 3px 6px rgba(0,0,0,.16)`) com ícone laranja em círculo branco; cabeçalho branco com logos do INPE e do programa; rodapé recolhível com títulos sublinhados em laranja.
- **Logotipos** (`web/src/assets/brand/`): são oficiais. O guia pede para não distorcer, não mudar as cores e não aplicar sombra, gradiente ou contorno; use-os sobre fundo neutro, com área de respiro, e em fundo escuro use a versão invertida.
- **Contraste:** texto branco sobre `#cf4c39` não atinge o AA para texto normal. Em botões, use `--primary-color-600` ou mais escuro.

## Convenções

- **Idioma:** interface, comentários, docstrings e mensagens de erro da API em português do Brasil; identificadores de código em inglês (padrão do código existente).
- **Back:** cada integração é uma classe em `source/services/` (`DataScraping`, `LLMService`), instanciada em `app.py`. As rotas e parâmetros ficam no `config.yaml`.
- **Front:** componentes funcionais, um por arquivo, com CSS Modules. As chamadas HTTP passam por `src/api.js` e o estado de dados fica em hooks (`src/hooks/`). Sem bibliotecas de UI; os estilos usam os tokens.
- **Texto gerado por LLM** deve sempre aparecer identificado como tal na interface e com acesso ao texto original. É uma questão de responsabilidade científica.
- Não versionar `node_modules/`, `dist/`, `__pycache__/`, `.env` nem `venv/`.

## Próximos passos sugeridos

- **Persistência e pré-processamento:** salvar o catálogo e as explicações geradas (JSON ou SQLite) e processá-los em lote, em vez de fazer o scraping e a geração a cada requisição. A proposta prevê projetos "já processados"; hoje `/simplify` aceita texto livre e gera sob demanda.
- **Qualidade do pipeline:** o modelo de 1.5B (Q4) gera em ~7 s, mas erra termos técnicos (*lightning* virou "estrelas" ou "trovões" em vez de "raios") e ignora o formato pedido (devolve um parágrafo único e longo). Vale testar modelos maiores (Qwen2.5 3B/7B Instruct), saída estruturada (objetivo / como foi feito / por que importa) com `response_format` JSON schema do llama.cpp, métricas de legibilidade e fidelidade, e revisão humana.
- **Curadoria:** incluir projetos além de artigos (relatórios, sistemas) e permitir a revisão dos textos pelos pesquisadores.
- **Integração ao BDQueimadas:** `base` configurável no Vite para servir em um subcaminho, e cabeçalho/rodapé reais do portal (`components/loader.js`).
- **Encoding do BibDigital:** as páginas declaram `ISO-8859-1`, mas usam caracteres do Windows-1252. O navegador trata esse rótulo como Windows-1252; o `requests`, não, e o travessão (byte `0x96`) vira um caractere de controle invisível ("Landsat–Sentinel-2" aparece como "LandsatSentinel-2"). Definir `response.encoding = "cp1252"` nas respostas do `DataScraping` resolve. Já "ContemporaryFire" vem colado do próprio registro no BibDigital.
