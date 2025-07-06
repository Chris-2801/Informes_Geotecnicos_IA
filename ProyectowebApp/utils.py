
import google.generativeai as genai
from google.api_core.exceptions import GoogleAPIError

# Lista de claves API
API_KEYS = [
    "AIzaSyDLZ6sGa-mzaLI9H_v2A4JddzaErK1Rc48",
    "AIzaSyAA2VJ8wrZRDaEN_AuWx_yZrfExkSOrido",  #silviayesse2016
    "AIzaSyD9mMBzYnOsE69YZv-bZHWCUrSP26dNstI",
    "AIzaSyDKBNXovYsdXXMFB4HN_YkCOanxTpMBtyA",
    "AIzaSyChbb_TmSiJCBRunhIimrzn0FhMYiZ3EfY",   #silvia.yess25"
]

# --- CONFIGURACIÓN DE GEMINI ---
def configurar_genai():
    for api_key in API_KEYS:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content("ping")
            if response.text:
                print(f"[✔] Clave válida usada: {api_key[:30]}...")
                return model
        except GoogleAPIError as e:
            print(f"[✘] Clave inválida: {api_key[:30]}... | {e.message}")
        except Exception as e:
            print(f"[✘] Otro error con clave {api_key[:30]}... | {e}")
    raise Exception("Ninguna clave API válida disponible.")

# --- DESCRIPCIÓN DE IMAGEN ---
def describir_imagen(image_path, prompt, model):
    with open(image_path, "rb") as img_file:
        image_bytes = img_file.read()
    response = model.generate_content([
        prompt,
        {
            "mime_type": "image/jpeg",
            "data": image_bytes
        }
    ])
    return response.text.strip()

# --- DESCRIPCIÓN SEGÚN TIPO ---
def describir_imagen_por_tipo(image_path, tipo, model):
    if tipo == "afloramiento":
        prompt = (
            "Describe en un solo párrafo, con aproximadamente 100 palabras, "
            "el afloramiento geológico visible en la imagen desde un punto de vista geotécnico. "
            "Incluye características como la estructura, fracturamiento, estabilidad, tipos de discontinuidades, "
            "orientación, posibles riesgos de deslizamientos o fallas, propiedades mecánicas visibles, "
            "y cualquier otro aspecto relevante para la ingeniería geotécnica. "
            "El texto debe ser técnico, claro y fluido, sin enumeraciones, formando un párrafo continuo."
        )
    elif tipo == "roca":
        prompt = (
            "Genera una descripción en un solo párrafo de aproximadamente 100 palabras sobre la roca mostrada en la imagen, "
            "desde un enfoque geotécnico. Incluye detalles sobre textura, fracturamiento, resistencia esperada, tipo de roca, "
            "posibles defectos o debilidades, compactación, y cualquier característica que impacte la estabilidad o comportamiento mecánico. "
            "La descripción debe ser técnica, coherente y redactada como un párrafo continuo, sin listas ni puntos."
        )
    else:
        raise ValueError("Tipo desconocido para descripción de imagen.")

    return describir_imagen(image_path, prompt, model)

# --- INFORME GENERAL - INTRODUCCIÓN ---
def generar_informe_general(bloques, model):
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

    response = model.generate_content(prompt)
    return response.text.strip()

# --- DISCUSIÓN ---
def generar_discusion(bloques, model):
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

    response = model.generate_content(prompt)
    return response.text.strip()

# --- CONCLUSIONES ---
def generar_conclusiones(bloques, model):
    prompt = (
        "Con base en los datos de afloramientos y rocas que se describen a continuación, redacta una sección de *Conclusiones* "
        "sintética, clara y técnica. Incluye entre 3 y 5 conclusiones numeradas.\n\n"
    )
    for bloque in bloques:
        prompt += f"Afloramiento {bloque.get('id', 'N/A')} - Calidad: {bloque.get('calidad', 'N/A')} | "
        prompt += f"Tipo de roca: {bloque.get('roca', 'N/A')} | "
        prompt += f"Familias: {len(bloque.get('familias', []))}\n"

    prompt += "\nRedacta las conclusiones usando viñetas o numeración clara."

    response = model.generate_content(prompt)
    return response.text.strip()

# --- OBJETIVOS ---
def generar_objetivos_desde_titulo(model, titulo_proyecto):
    prompt = (
        "Eres un redactor técnico. Tu tarea es redactar los objetivos para un informe geológico "
        "basándote únicamente en el siguiente título del proyecto:\n\n"
        f"Título del proyecto: {titulo_proyecto}\n\n"
        "Escribe sólo el objetivo general y dos objetivos específicos, "
        "en texto plano, sin encabezados, sin etiquetas, sin asteriscos ni formatos markdown. "
        "El texto debe ser claro, técnico y académico, y no debe repetir literalmente el título."
    )

    response = model.generate_content(prompt)
    return response.text.strip()

# ---EVALUACIÓN ---

from sklearn.metrics.pairwise import cosine_similarity
from rouge import Rouge
import numpy as np
from nltk.translate.bleu_score import sentence_bleu
import nltk
nltk.download('punkt')

def evaluate_response(predicted_text: str, expected_text: str) -> dict:
    """Evalúa la respuesta usando métricas locales (sin dependencias de Google Cloud)"""
    # 1. BLEU Score
    bleu = sentence_bleu(
        [expected_text.split()],
        predicted_text.split(),
        weights=(0.5, 0.5))
    
    # 2. ROUGE-L
    rouge = Rouge()
    rouge_scores = rouge.get_scores(predicted_text, expected_text)[0]
    
    # 3. Similitud de coseno (mock - reemplazar con embeddings reales si es necesario)
    mock_embedding = np.random.rand(10)  # Ejemplo con vector aleatorio
    similarity = cosine_similarity(
        [mock_embedding],
        [mock_embedding]
    )[0][0]
    
    return {
        "bleu_score": round(bleu, 4),
        "rouge_l": round(rouge_scores["rouge-l"]["f"], 4),
        "embedding_similarity": round(similarity, 4)
    }

def generar_interpretacion_esclerometro(resultados, model):
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
    
    response = model.generate_content(prompt)
    return response.text.strip()
