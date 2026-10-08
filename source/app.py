from flask import Flask, jsonify, request
from flask_cors import CORS
from config.yaml_reader import ConfigReader
from services.data_scraping import DataScraping
import logging
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
queimadas_authors = get_params('queimadas_authors') or []

data_scraping = DataScraping()

@app.route(scrap_service_route, methods=["POST"])
def scrap_service():
    body = request.get_json(silent=True) or {}
    authors = body.get("authors") or queimadas_authors
    if not authors:
        return jsonify({"error": "nenhum autor configurado em queimadas_authors"}), 400
    try:
        articles = data_scraping.search_by_authors(authors)
    except Exception:
        logging.error(traceback.format_exc())
        return jsonify({"error": "falha ao buscar artigos no BibDigital"}), 502
    return jsonify({"total": len(articles), "articles": articles})


if __name__ == "__main__":
    app.run(host=host, port=port, debug=debug)