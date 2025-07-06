from waitress import serve
from Proyecto.wsgi import application

serve(application, host='127.0.0.1', port=8000)