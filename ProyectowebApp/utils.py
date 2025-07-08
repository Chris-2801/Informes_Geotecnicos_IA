import os
import logging
import google.generativeai as genai
from google.api_core.exceptions import GoogleAPIError
from sklearn.metrics.pairwise import cosine_similarity
from rouge import Rouge
import numpy as np
from nltk.translate.bleu_score import sentence_bleu
import nltk

# Configuración inicial
nltk.download('punkt')
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuración segura de API Keys (usar variables de entorno en producción)
API_KEYS = [
    os.getenv("GEMINI_API_KEY_5", "AIzaSyDKBNXovYsdXXMFB4HN_YkCOanxTpMBtyA"),
    os.getenv("GEMINI_API_KEY_1", "AIzaSyDKBNXovYsdXXMFB4HN_YkCOanxTpMBtyA"),
    os.getenv("GEMINI_API_KEY_2", "AIzaSyDLZ6sGa-mzaLI9H_v2A4JddzaErK1Rc48"),
    os.getenv("GEMINI_API_KEY_3", "AIzaSyAA2VJ8wrZRDaEN_AuWx_yZrfExkSOrido"),
    os.getenv("GEMINI_API_KEY_4", "AIzaSyD9mMBzYnOsE69YZv-bZHWCUrSP26dNstI"),
    os.getenv("GEMINI_API_KEY_6", "AIzaSyChbb_TmSiJCBRunhIimrzn0FhMYiZ3EfY"),
]

def configurar_genai():
    """Configura las API Keys y devuelve el primer modelo válido encontrado"""
    estados_api = []
    for api_key in API_KEYS:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content("ping")
            if response.text:
                # Devuelve el primer modelo válido que encuentre
                return model
        except Exception as e:
            estados_api.append({
                "clave": api_key[:10] + "..." + api_key[-10:],
                "estado": "Inválida",
                "error": str(e)
            })
    
    # Si ninguna API funcionó, levanta una excepción
    raise RuntimeError("Ninguna API Key funcionó. Estados: " + str(estados_api))

def obtener_modelo_por_indice(api_index):
    """Obtiene un modelo configurado con una API Key específica."""
    try:
        if api_index < 0 or api_index >= len(API_KEYS):
            raise ValueError(f"Índice {api_index} fuera de rango. Debe ser entre 0 y {len(API_KEYS)-1}")
            
        api_key = API_KEYS[api_index]
        logger.info(f"Configurando modelo con clave API índice {api_index}")
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # Prueba de conexión básica
        prueba = model.generate_content("Responde con 'OK'")
        if not prueba.text or "OK" not in prueba.text:
            raise RuntimeError("La API no respondió correctamente")
            
        return model
        
    except IndexError as ie:
        logger.error(f"Índice de API inválido: {str(ie)}")
        raise ValueError("Índice de API inválido") from ie
    except GoogleAPIError as gae:
        logger.error(f"Error de API Google: {str(gae)}")
        raise RuntimeError(f"Error con clave API: {gae.message}") from gae
    except Exception as e:
        logger.error(f"Error general al configurar la API: {str(e)}")
        raise RuntimeError(f"Error general al configurar la API: {str(e)}") from e

def describir_imagen(image_path, prompt, model):
    """Describe una imagen usando el modelo proporcionado."""
    try:
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"La imagen no existe en la ruta: {image_path}")
            
        with open(image_path, "rb") as img_file:
            image_bytes = img_file.read()
            
        logger.info(f"Procesando imagen: {image_path}")
        response = model.generate_content([prompt, {"mime_type": "image/jpeg", "data": image_bytes}])
        
        if not response.text:
            raise ValueError("La respuesta de la API está vacía")
            
        return response.text.strip()
        
    except Exception as e:
        logger.error(f"Error al describir imagen: {str(e)}")
        raise RuntimeError(f"Error al procesar la imagen: {str(e)}") from e

def describir_imagen_por_tipo(image_path, tipo, model):
    """Genera una descripción técnica según el tipo de imagen."""
    try:
        tipos_validos = ["afloramiento", "roca"]
        if tipo not in tipos_validos:
            raise ValueError(f"Tipo '{tipo}' no válido. Debe ser: {', '.join(tipos_validos)}")
            
        if tipo == "afloramiento":
            prompt = (
                "Describe en un solo párrafo, con aproximadamente 100 palabras, "
                "el afloramiento geológico visible en la imagen desde un punto de vista geotécnico. "
                "Incluye características como la estructura, fracturamiento, estabilidad, tipos de discontinuidades, "
                "orientación, posibles riesgos de deslizamientos o fallas, propiedades mecánicas visibles, "
                "y cualquier otro aspecto relevante para la ingeniería geotécnica. "
                "El texto debe ser técnico, claro y fluido, sin enumeraciones, formando un párrafo continuo."
            )
        else:  # roca
            prompt = (
                "Genera una descripción en un solo párrafo de aproximadamente 100 palabras sobre la roca mostrada en la imagen, "
                "desde un enfoque geotécnico. Incluye detalles sobre textura, fracturamiento, resistencia esperada, tipo de roca, "
                "posibles defectos o debilidades, compactación, y cualquier característica que impacte la estabilidad o comportamiento mecánico. "
                "La descripción debe ser técnica, coherente y redactada como un párrafo continuo, sin listas ni puntos."
            )
            
        return describir_imagen(image_path, prompt, model)
        
    except Exception as e:
        logger.error(f"Error en describir_imagen_por_tipo: {str(e)}")
        raise

def generar_informe_general(bloques, model):
    """Genera un informe técnico integrando datos de múltiples afloramientos."""
    try:
        if not bloques or len(bloques) == 0:
            raise ValueError("La lista de bloques está vacía")
            
        prompt = (
            "Eres un experto geólogo. A partir de los datos de varios afloramientos y rocas, "
            "redacta una introducción técnica y académica que integre toda la información. "
            "Escribe sólo el texto de la introducción, sin encabezados, sin títulos, sin formato markdown ni etiquetas. "
            "Utiliza un estilo claro, coherente, en párrafos de aproximadamente 100 palabras cada uno, "
            "sin repetir datos textualmente y usando conectores para enlazar ideas."
            "\n\n"
        )
        
        for bloque in bloques:
            prompt += f"Afloramiento {bloque.get('id', 'N/A')}:\n"
            prompt += f"- Sistema de referencia: {bloque.get('sistema_ref', 'No especificado')}\n"
            coords = bloque.get("coordenadas", {})
            prompt += f"- Coordenadas: X={coords.get('x', 'N/A')}, Y={coords.get('y', 'N/A')}, Z={coords.get('z', 'N/A')}\n"
            prompt += f"- Calidad de la roca: {bloque.get('calidad', 'No especificado')}\n"
            prompt += f"- Descripción afloramiento: {bloque.get('descripcion_afloramiento', 'No disponible')}\n"
            prompt += f"- Roca: {bloque.get('roca', 'No especificado')}\n"
            prompt += f"- Matriz: {bloque.get('matriz', 'No especificado')}\n"
            prompt += f"- Textura: {bloque.get('textura', 'No especificado')}\n"
            prompt += f"- Mineralogía: {bloque.get('mineralogia', 'No especificado')}\n"
            prompt += f"- Tamaño de grano: {bloque.get('grano', 'No especificado')}\n"
            prompt += f"- Descripción roca: {bloque.get('descripcion_roca', 'No disponible')}\n"

            familias = bloque.get("familias", [])
            prompt += "- Familias:\n"
            if familias:
                for fam in familias:
                    prompt += (
                        f"  Nº {fam.get('numero', '')}, Orientación: {fam.get('orientacion', '')}, "
                        f"Espaciamiento: {fam.get('espaciamiento', '')}, Apertura: {fam.get('apertura', '')}, "
                        f"Continuidad: {fam.get('continuidad', '')}, Relleno: {fam.get('relleno', '')}, "
                        f"Seepage: {fam.get('seepage', '')}, Rugosidad: {fam.get('rugosidad', '')}, "
                        f"Meteorización: {fam.get('meteorizacion', '')}, Resistencia: {fam.get('resistencia', '')}\n"
                    )
            else:
                prompt += "  No hay familias registradas.\n"
            prompt += "\n"

        prompt += (
            "Redacta un texto de introducción general que sintetice los datos, con párrafos de 100 palabras aprox., "
            "en estilo técnico, académico y claro. Utiliza conectores y evita listar los datos directamente. "
            "Concluye con una valoración preliminar de la calidad de los afloramientos observados."
        )

        logger.info("Generando informe general...")
        response = model.generate_content(prompt)
        
        if not response.text:
            raise ValueError("La respuesta del modelo está vacía")
            
        return response.text.strip()
        
    except Exception as e:
        logger.error(f"Error al generar informe general: {str(e)}")
        raise

def generar_discusion(bloques, model):
    """Genera una sección de discusión técnica basada en los datos."""
    try:
        if not bloques or len(bloques) == 0:
            raise ValueError("La lista de bloques está vacía")
            
        prompt = (
            "Eres un experto geólogo. A partir de la información técnica de los siguientes afloramientos y rocas, "
            "redacta una discusión clara y técnica. "
            "Escribe sólo el texto de la discusión, sin encabezados, sin etiquetas, sin formato markdown, sin títulos. "
            "Analiza patrones, relaciones e interpretaciones geológicas usando lenguaje técnico, con conectores lógicos y sin repetir datos textualmente. "
            "Incluye inferencias e hipótesis geológicas cuando sea apropiado.\n\n"
        )
        
        for bloque in bloques:
            prompt += f"Afloramiento {bloque.get('id', 'N/A')}:\n"
            prompt += f"- Descripción afloramiento: {bloque.get('descripcion_afloramiento', 'No disponible')}\n"
            prompt += f"- Descripción roca: {bloque.get('descripcion_roca', 'No disponible')}\n"
            familias = bloque.get("familias", [])
            prompt += f"- Familias: {len(familias)} discontinuidades registradas.\n\n"

        prompt += "Redacta una sección de discusión en estilo técnico y académico, de aproximadamente 2 o 3 párrafos."

        logger.info("Generando discusión técnica...")
        response = model.generate_content(prompt)
        
        if not response.text:
            raise ValueError("La respuesta del modelo está vacía")
            
        return response.text.strip()
        
    except Exception as e:
        logger.error(f"Error al generar discusión: {str(e)}")
        raise

def generar_conclusiones(bloques, model):
    """Genera conclusiones técnicas basadas en los datos."""
    try:
        if not bloques or len(bloques) == 0:
            raise ValueError("La lista de bloques está vacía")
            
        prompt = (
            "Con base en los datos de afloramientos y rocas que se describen a continuación, redacta una sección de *Conclusiones* "
            "sintética, clara y técnica. Incluye entre 3 y 5 conclusiones numeradas.\n\n"
        )
        
        for bloque in bloques:
            prompt += f"Afloramiento {bloque.get('id', 'N/A')} - Calidad: {bloque.get('calidad', 'N/A')} | "
            prompt += f"Tipo de roca: {bloque.get('roca', 'N/A')} | "
            prompt += f"Familias: {len(bloque.get('familias', []))}\n"

        prompt += "\nRedacta las conclusiones usando viñetas o numeración clara."

        logger.info("Generando conclusiones...")
        response = model.generate_content(prompt)
        
        if not response.text:
            raise ValueError("La respuesta del modelo está vacía")
            
        return response.text.strip()
        
    except Exception as e:
        logger.error(f"Error al generar conclusiones: {str(e)}")
        raise

def generar_objetivos_desde_titulo(model, titulo_proyecto):
    """Genera objetivos técnicos a partir del título del proyecto."""
    try:
        if not titulo_proyecto or len(titulo_proyecto.strip()) == 0:
            raise ValueError("El título del proyecto no puede estar vacío")
            
        prompt = (
            "Eres un redactor técnico. Tu tarea es redactar los objetivos para un informe geológico "
            "basándote únicamente en el siguiente título del proyecto:\n\n"
            f"Título del proyecto: {titulo_proyecto}\n\n"
            "Escribe sólo el objetivo general y dos objetivos específicos, "
            "en texto plano, sin encabezados, sin etiquetas, sin asteriscos ni formatos markdown. "
            "El texto debe ser claro, técnico y académico, y no debe repetir literalmente el título."
        )

        logger.info(f"Generando objetivos para proyecto: {titulo_proyecto}")
        response = model.generate_content(prompt)
        
        if not response.text:
            raise ValueError("La respuesta del modelo está vacía")
            
        return response.text.strip()
        
    except Exception as e:
        logger.error(f"Error al generar objetivos: {str(e)}")
        raise

def evaluate_response(predicted_text: str, expected_text: str) -> dict:
    """Evalúa la respuesta usando métricas de similitud."""
    try:
        # 1. BLEU Score
        bleu = sentence_bleu(
            [expected_text.split()],
            predicted_text.split(),
            weights=(0.5, 0.5))
        
        # 2. ROUGE-L
        rouge = Rouge()
        rouge_scores = rouge.get_scores(predicted_text, expected_text)[0]
        
        # 3. Similitud de coseno (versión simplificada)
        # En producción usar embeddings reales
        tokens_pred = set(predicted_text.lower().split())
        tokens_exp = set(expected_text.lower().split())
        intersection = tokens_pred.intersection(tokens_exp)
        union = tokens_pred.union(tokens_exp)
        similarity = len(intersection) / len(union) if union else 0
        
        return {
            "bleu_score": round(bleu, 4),
            "rouge_l": round(rouge_scores["rouge-l"]["f"], 4),
            "similarity_score": round(similarity, 4)
        }
        
    except Exception as e:
        logger.error(f"Error en evaluación de respuesta: {str(e)}")
        return {
            "bleu_score": 0,
            "rouge_l": 0,
            "similarity_score": 0,
            "error": str(e)
        }

def generar_interpretacion_esclerometro(resultados, model):
    """Genera una interpretación técnica de resultados de esclerómetro."""
    try:
        if not resultados:
            raise ValueError("Los resultados del esclerómetro no pueden estar vacíos")
            
        prompt = (
            "Eres un experto geotécnico. Con base en los siguientes resultados del esclerómetro Schmidt:\n"
            f"- Método: {resultados.get('metodo', 'N/A')}\n"
            f"- HR promedio 10 mayores: {resultados.get('hr_promedio', 'N/A')}\n"
            f"- HR mediana 10 mayores: {resultados.get('hr_mediana', 'N/A')}\n"
            f"- Peso específico: {resultados.get('peso_esp', 'N/A')} kN/m³\n"
            f"- UCS media: {resultados.get('ucs_prom', 'N/A')}\n"
            f"- UCS mediana: {resultados.get('ucs_mediana', 'N/A')}\n"
            f"- Módulo de Young (E): {resultados.get('e', 'N/A')} MPa\n\n"
            "Redacta una interpretación clara y profesional que explique qué indican estos resultados sobre la calidad y resistencia de la roca, posibles aplicaciones y recomendaciones. "
            "El texto debe ser técnico, coherente y claro, sin repetir datos textualmente."
        )
        
        logger.info("Generando interpretación de esclerómetro...")
        response = model.generate_content(prompt)
        
        if not response.text:
            raise ValueError("La respuesta del modelo está vacía")
            
        return response.text.strip()
        
    except Exception as e:
        logger.error(f"Error al generar interpretación de esclerómetro: {str(e)}")
        raise

# Función de prueba para verificar el funcionamiento
def prueba_funcionamiento():
    """Función para probar que todo el sistema funciona correctamente."""
    try:
        logger.info("Iniciando prueba de funcionamiento...")
        
        # 1. Verificar conexión con API
        estados = configurar_genai()
        logger.info(f"Estado de APIs: {estados}")
        
        # 2. Obtener un modelo válido
        modelo = None
        for i in range(len(API_KEYS)):
            try:
                modelo = obtener_modelo_por_indice(i)
                logger.info(f"API Key {i} funciona correctamente")
                break
            except Exception as e:
                logger.warning(f"API Key {i} falló: {str(e)}")
                continue
                
        if not modelo:
            raise RuntimeError("Ninguna API Key funcionó")
            
        # 3. Probar generación de texto simple
        prueba = modelo.generate_content("Responde con 'OK' si estás funcionando")
        logger.info(f"Prueba de conexión: {prueba.text}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error en prueba de funcionamiento: {str(e)}")
        return False
