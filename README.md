# extensao_comp_aplicada
projeto da disciplina de extensão em computação aplicada e tecnologias digitais III

Hub de Divulgação Científica do Programa Queimadas (INPE): as publicações do programa explicadas em linguagem simples com apoio de LLMs.

## Como executar

Requer Docker com o plugin Compose.

```bash
docker compose up --build
```

Abra <http://localhost:8080>. Na primeira execução, o serviço de LLM baixa o modelo (cerca de 1 GB) e a primeira busca de publicações no BibDigital leva cerca de 2 minutos.

Arquitetura (front, back e llm), API, configuração e convenções do projeto estão em [CLAUDE.md](CLAUDE.md).
