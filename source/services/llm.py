import requests


class LLMService:
    """
    Cliente do serviço de LLM (container "llm" do docker-compose: llama.cpp
    server, com API compatível com a da OpenAI). O serviço só faz a
    inferência - prompts e regras de simplificação ficam aqui no back, então
    trocar de servidor (Ollama, vLLM, API externa) é só mudar a URL.
    """

    def __init__(self, base_url, system_prompt, timeout=180):
        self.chat_url = f"{base_url.rstrip('/')}/v1/chat/completions"
        self.system_prompt = system_prompt
        self.timeout = timeout
        self.session = requests.Session()

    def simplify(self, text, title=None):
        """
        Reescreve um texto técnico-científico (ex: resumo de um artigo) em
        linguagem acessível ao público leigo, seguindo o system_prompt do
        config.yaml. O título, quando existe, dá contexto ao modelo.
        """
        content = f"Título: {title}\n\nResumo:\n{text}" if title else text
        response = self.session.post(
            self.chat_url,
            json={
                "messages": [
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": content},
                ],
                # temperatura baixa: queremos fidelidade ao texto original, não criatividade
                "temperature": 0.3,
                "max_tokens": 700,
            },
            timeout=self.timeout,
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"].strip()
