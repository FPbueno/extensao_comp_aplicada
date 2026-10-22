from flask import Flask, jsonify, request
from flask_cors import CORS
from config.yaml_reader import ConfigReader
from services.data_scraping import DataScraping
from services.llm import LLMService
import logging
import os
import time
import traceback

app = Flask(__name__)
CORS(app)

config_reader = ConfigReader()
app_config = config_reader.read_config("./config/config.yaml")

params = app_config.get('configuration_parameters', [])

def get_params(param_name):
    return next((param.get(param_name) for param in params if param_name in param), None)

port = get_params('port')
host =  get_params('host')
debug = get_params('debug')
scrap_service_route = get_params('scrap_service_route')
simplify_service_route = get_params('simplify_service_route')
scrap_cache_ttl_seconds = get_params('scrap_cache_ttl_seconds') or 0
queimadas_authors = get_params('queimadas_authors') or []
system_prompt = get_params('system_prompt') or ""
# no docker-compose o back acessa o LLM pelo nome do serviço (LLM_SERVICE_URL=http://llm:8080)
llm_service_url = os.getenv('LLM_SERVICE_URL') or get_params('llm_service_url')

data_scraping = DataScraping()
llm_service = LLMService(llm_service_url, system_prompt)

# o scraping do BibDigital leva minutos (várias buscas por autor), então o
# resultado de cada lista de autores fica em memória por scrap_cache_ttl_seconds
scrap_cache = {}

@app.route(scrap_service_route, methods=["POST"])
def scrap_service():
    body = request.get_json(silent=True) or {}
    authors = body.get("authors") or queimadas_authors
    if not authors:
        return jsonify({"error": "nenhum autor configurado em queimadas_authors"}), 400

    cache_key = tuple(authors)
    cached = scrap_cache.get(cache_key)
    if cached and time.time() - cached["timestamp"] < scrap_cache_ttl_seconds:
        articles = cached["articles"]
    else:
        try:
            articles = data_scraping.search_by_authors(authors)
        except Exception:
            logging.error(traceback.format_exc())
            return jsonify({"error": "falha ao buscar artigos no BibDigital"}), 502
        scrap_cache[cache_key] = {"timestamp": time.time(), "articles": articles}
    return jsonify({"total": len(articles), "articles": articles})


@app.route(simplify_service_route, methods=["POST"])
def simplify_service():
    body = request.get_json(silent=True) or {}
    text = (body.get("text") or "").strip()
    if not text:
        return jsonify({"error": "nenhum texto informado para simplificar"}), 400
    try:
        simplified = llm_service.simplify(text, body.get("title"))
    except Exception:
        logging.error(traceback.format_exc())
        return jsonify({"error": "falha ao gerar a explicação simplificada no serviço de LLM"}), 502
    return jsonify({"simplified": simplified})


if __name__ == "__main__":
    app.run(host=host, port=port, debug=debug)
