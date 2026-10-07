from flask import Flask, jsonify, request
from flask_cors import CORS
from config.yaml_reader import ConfigReader
import requests
import logging
import traceback
import requests

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

@app.route(scrap_service_route, methods=["POST"])
def scrap_service():
    pass