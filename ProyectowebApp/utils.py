import os, logging, nltk
import google.generativeai as genai
from google.api_core.exceptions import GoogleAPIError
from sklearn.metrics.pairwise import cosine_similarity
from nltk.translate.bleu_score import sentence_bleu
from rouge import Rouge

# -- CONFIGURACIÓN API Y MODELO GEMINI ---

nltk.download('punkt')
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

API_KEYS = [
    os.getenv("GEMINI_API_KEY_2", "AIzaSyCJg1C1qIrX-8LX8ja1L4iZ0EOgIej_qVc"), 
    os.getenv("GEMINI_API_KEY_3", "AIzaSyBcdI8jWUsn9xt-gj_Wsg0cDncuKo5tjCs"),  #christofervalencia977@gmail.com
]

def configurar_genai():
    """Configura las API Keys y devuelve el primer modelo válido encontrado"""
    estados_api = []

    for api_key in API_KEYS:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content("ping")
            if response.text:
                print(f"[✔] Clave válida usada: {api_key[:10]}...{api_key[-10:]}")
                return model
        except Exception as e:
            # Sigue intentando si hay error
            estados_api.append({
                "clave": api_key[:10] + "..." + api_key[-10:],
                "estado": "Inválida",
                "error": str(e)
            })
            continue

    # Si ninguna API funcionó, lanza un error
    raise RuntimeError("❌ Ninguna API Key funcionó. Estados: " + str(estados_api))

def obtener_modelo_por_indice(api_index):
    """Obtiene un modelo configurado con una API Key específica."""
    try:
        if api_index < 0 or api_index >= len(API_KEYS):
            raise ValueError(f"Índice {api_index} fuera de rango. Debe ser entre 0 y {len(API_KEYS)-1}")
            
        api_key = API_KEYS[api_index]
        logger.info(f"Configurando modelo con clave API índice {api_index}")
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
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
    
def obtener_modelo_personalizado(api_key_personalizada):
    """Configura y devuelve un modelo con la API Key proporcionada por el usuario"""
    try:
        genai.configure(api_key=api_key_personalizada)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        # Prueba de conexión básica
        prueba = model.generate_content("Responde con 'OK'")
        if not prueba.text or "OK" not in prueba.text:
            raise RuntimeError("La API no respondió correctamente")
            
        return model
    except Exception as e:
        raise RuntimeError(f"Error con API Key personalizada: {str(e)}")

# -- CONFIGURACIÓN API Y MODELO IMÁGENES ---

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
                "Redacta un párrafo técnico y coherente (alrededor de 100 palabras) que describa el afloramiento geológico visible en la imagen, "
                "desde una perspectiva geotécnica. Analiza la estructura general del macizo rocoso, el tipo y densidad de fracturamiento, "
                "la orientación de las discontinuidades (si es inferible), y la estabilidad del talud así como su calida (buena, moderad, mala)"
                "y cualquier rasgo que implique riesgos geotécnicos como deslizamientos, caídas de bloques o colapsos. "
                "Incluye también observaciones sobre propiedades mecánicas visibles como compacidad, meteorización superficial o heterogeneidad del material. "
                "Evita listas; redacta todo como un párrafo fluido y técnico."
            )
        else:  # roca
            prompt = (
                "Redacta un párrafo técnico y detallado (alrededor de 100 palabras) que describa la muestra de roca visible en la imagen, "
                "desde un enfoque geotécnico. Describe el tipo de roca (si es identificable), textura, grado de compactación, fracturamiento o fisuras presentes, "
                "resistencia mecánica esperada, meteorización visible y cualquier debilidad estructural o heterogeneidad relevante. "
                "Enfócate en características que puedan afectar el comportamiento de la roca en campo, como la estabilidad o la deformabilidad. "
                "El texto debe ser fluido, sin enumeraciones, con lenguaje técnico claro y redactado como un párrafo continuo."
            )
            
        return describir_imagen(image_path, prompt, model)
        
    except Exception as e:
        logger.error(f"Error en describir_imagen_por_tipo: {str(e)}")
        raise

# -- CONFIGURACIÓN API Y MODELO TEXTO SECCIONES DEL INFORME ---

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

def generar_informe_general(bloques, model):
    """Genera un informe técnico integrando datos de múltiples afloramientos."""
    try:
        if not bloques or len(bloques) == 0:
            raise ValueError("La lista de bloques está vacía")
            
        prompt = (
            "Eres un experto geólogo con 20 años de experiencia en caracterización de afloramientos rocosos. "
            "A partir de los datos técnicos de varios afloramientos, redacta una introducción técnica detallada "
            "que integre toda la información de manera coherente. El texto debe ser académico pero claro, "
            "con párrafos bien estructurados de aproximadamente 100 palabras cada uno. "
            "Evita listar datos crudos y en su lugar realiza síntesis interpretativas. "
            "Usa conectores lógicos y mantén un flujo narrativo. No incluyas títulos ni encabezados.\n\n"
            "Datos de los afloramientos:\n\n"
        )
        
        for i, bloque in enumerate(bloques, 1):
            # Extraer datos del formulario usando las claves correctas
            sistema_ref = bloque.get(f'sistema_ref_{i}', 'No especificado')
            coordenadas = f"X={bloque.get(f'x_{i}', 'N/A')}, Y={bloque.get(f'y_{i}', 'N/A')}, Z={bloque.get(f'z_{i}', 'N/A')}"
            tipo_roca = bloque.get(f'tipo_roca_{i}', 'No especificado')
            roca = bloque.get(f'roca_{i}', 'No especificado')
            calidad = bloque.get(f'calidad_{i}', 'No especificado')
            
            prompt += f"Afloramiento {i}:\n"
            prompt += f"- Sistema de referencia: {sistema_ref}\n"
            prompt += f"- Coordenadas: {coordenadas}\n"
            prompt += f"- Tipo de roca: {tipo_roca} ({roca})\n"
            prompt += f"- Calidad del macizo rocoso: {calidad}\n"
            prompt += f"- Características petrográficas:\n"
            prompt += f"  • Matriz: {bloque.get(f'matriz_{i}', 'No especificado')}\n"
            prompt += f"  • Textura: {bloque.get(f'textura_{i}', 'No especificado')}\n"
            prompt += f"  • Mineralogía: {bloque.get(f'mineralogia_{i}', 'No especificado')}\n"
            prompt += f"  • Tamaño de grano: {bloque.get(f'grano_{i}', 'No especificado')}\n"
            
            # Descripciones generadas por IA
            prompt += f"- Descripción del afloramiento: {bloque.get(f'descripcion_afloramiento_{i}', 'No disponible')}\n"
            prompt += f"- Descripción de la roca: {bloque.get(f'descripcion_roca_{i}', 'No disponible')}\n"

            # Procesar familias de discontinuidades
            familias = []
            for key in bloque.keys():
                if key.startswith(f'tabla-{i}-'):
                    familias.append(bloque[key])
            
            prompt += f"- Número de familias de discontinuidades: {len(familias)}\n"
            
            if familias:
                prompt += "  Características principales de las discontinuidades:\n"
                for fam in familias[:3]:  # Mostrar solo las primeras 3
                    prompt += (
                        f"  • Orientación: {fam.get('orientacion', 'N/A')}, "
                        f"UCS: {fam.get('ucs', 'N/A')} MPa, "
                        f"RQD: {fam.get('rqd', 'N/A')}%, "
                        f"Espaciamiento: {fam.get('espaciamiento', 'N/A')}\n"
                    )
            prompt += "\n"

        prompt += (
            "Con esta información, redacta una introducción técnica detallada que:\n"
            "1. Presente el contexto geológico general\n"
            "2. Describa las características principales de los afloramientos\n"
            "3. Analice los tipos de rocas encontradas y sus propiedades\n"
            "4. Evalúe la calidad general de los macizos rocosos\n"
            "5. Integre las observaciones de campo con interpretaciones geológicas\n"
            "El texto debe fluir naturalmente, evitando listas o enumeraciones. Usa lenguaje técnico preciso pero accesible."
        )

        logger.info("Generando informe general...")
        response = model.generate_content(prompt)
        
        if not response.text:
            raise ValueError("La respuesta del modelo está vacía")
            
        return response.text.strip()
        
    except Exception as e:
        logger.error(f"Error al generar informe general: {str(e)}")
        raise

def generar_discusion(bloques, model, datos_completos_por_afloramiento=None):
    """Genera una sección de discusión técnica basada en los datos, incluyendo análisis RMR/SMR."""
    try:
        if not bloques or len(bloques) == 0:
            raise ValueError("La lista de bloques está vacía")
            
        prompt = (
            "Como geólogo experto, analiza los siguientes datos de afloramientos rocosos y genera una discusión técnica detallada. "
            "El texto debe ser interpretativo, con análisis de patrones y relaciones geológicas, incluyendo evaluación de calidad "
            "del macizo rocoso mediante los índices RMR y SMR. "
            "Incluye inferencias basadas en la evidencia y plantea hipótesis cuando sea pertinente. "
            "Estructura el contenido en 3-4 párrafos coherentes, sin títulos ni enumeraciones.\n\n"
            "Datos para el análisis:\n\n"
        )
        
        for i, bloque in enumerate(bloques, 1):
            afloramiento_id = str(i)  # Asumiendo que el índice coincide con el ID de afloramiento
            
            # Extraer datos del formulario
            tipo_roca = bloque.get(f'tipo_roca_{i}', 'N/A')
            roca = bloque.get(f'roca_{i}', 'N/A')
            calidad = bloque.get(f'calidad_{i}', 'N/A')
            
            prompt += f"Afloramiento {i}:\n"
            prompt += f"- Tipo de roca: {tipo_roca} ({roca})\n"
            prompt += f"- Calidad: {calidad}\n"
            prompt += f"- Características petrográficas: Matriz {bloque.get(f'matriz_{i}', 'N/A')}, "
            prompt += f"Textura {bloque.get(f'textura_{i}', 'N/A')}, "
            prompt += f"Mineralogía {bloque.get(f'mineralogia_{i}', 'N/A')}, "
            prompt += f"Tamaño de grano {bloque.get(f'grano_{i}', 'N/A')}\n"
            
            # Descripciones generadas por IA
            prompt += f"- Observaciones del afloramiento: {bloque.get(f'descripcion_afloramiento_{i}', 'No disponible')}\n"
            prompt += f"- Análisis de la roca: {bloque.get(f'descripcion_roca_{i}', 'No disponible')}\n"
            
            # Procesar familias de discontinuidades
            familias = []
            for key in bloque.keys():
                if key.startswith(f'tabla-{i}-'):
                    familias.append(bloque[key])
            
            prompt += f"- Número de familias: {len(familias)}\n"
            if familias:
                orientaciones = [fam.get('orientacion', '') for fam in familias if fam.get('orientacion')]
                if orientaciones:
                    prompt += f"- Orientaciones predominantes: {', '.join(set(orientaciones))}\n"
            
            # Añadir datos RMR/SMR si están disponibles
            if datos_completos_por_afloramiento and afloramiento_id in datos_completos_por_afloramiento:
                afloramiento_data = datos_completos_por_afloramiento[afloramiento_id]
                
                # Estadísticas RMR
                if afloramiento_data.get('valoresRMR'):
                    rmr_values = afloramiento_data['valoresRMR']
                    prompt += f"- RMR (Rock Mass Rating):\n"
                    prompt += f"  * Valores por familia: {', '.join(map(str, rmr_values))}\n"
                    prompt += f"  * Promedio: {round(sum(rmr_values)/len(rmr_values), 2)}\n"
                    prompt += f"  * Rango: {min(rmr_values)} a {max(rmr_values)}\n"
                    
                    # Clasificación RMR basada en promedio
                    rmr_avg = sum(rmr_values)/len(rmr_values)
                    if rmr_avg >= 81:
                        rmr_class = "Clase I - Muy buena calidad"
                    elif rmr_avg >= 61:
                        rmr_class = "Clase II - Buena calidad"
                    elif rmr_avg >= 41:
                        rmr_class = "Clase III - Calidad media"
                    elif rmr_avg >= 21:
                        rmr_class = "Clase IV - Mala calidad"
                    else:
                        rmr_class = "Clase V - Muy mala calidad"
                    prompt += f"  * Clasificación: {rmr_class}\n"
                
                # Estadísticas SMR
                smr_values = []
                if afloramiento_data.get('datosFilas'):
                    for fila in afloramiento_data['datosFilas']:
                        if fila and 'smr' in fila and fila['smr'] is not None:
                            smr_values.append(fila['smr'])
                
                if smr_values:
                    prompt += f"- SMR (Slope Mass Rating):\n"
                    prompt += f"  * Valores por familia: {', '.join(map(str, smr_values))}\n"
                    prompt += f"  * Promedio: {round(sum(smr_values)/len(smr_values), 2)}\n"
                    prompt += f"  * Rango: {min(smr_values)} a {max(smr_values)}\n"
                    
                    # Clasificación SMR basada en promedio
                    smr_avg = sum(smr_values)/len(smr_values)
                    if smr_avg >= 81:
                        smr_class = "Clase I - Muy estable"
                    elif smr_avg >= 61:
                        smr_class = "Clase II - Estable"
                    elif smr_avg >= 41:
                        smr_class = "Clase III - Parcialmente estable"
                    elif smr_avg >= 21:
                        smr_class = "Clase IV - Inestable"
                    else:
                        smr_class = "Clase V - Muy inestable"
                    prompt += f"  * Clasificación de estabilidad: {smr_class}\n"
            
            prompt += "\n"

        prompt += (
            "Desarrolla una discusión técnica que integre los siguientes aspectos:\n"
            "1. Relación entre las características petrográficas, tipo de roca y su origen geológico\n"
            "2. Evaluación de la calidad del macizo rocoso basada en los índices RMR y su variabilidad\n"
            "3. Análisis de estabilidad de taludes mediante el índice SMR, considerando los factores de ajuste\n"
            "4. Interpretación de los patrones estructurales observados y su influencia en la calidad del macizo\n"
            "5. Correlaciones entre los diferentes afloramientos y su significado geológico\n"
            "6. Implicaciones para la ingeniería geológica y posibles riesgos identificados\n\n"
            "El texto debe ser fluido, técnico pero claro, con un enfoque interpretativo. "
            "Utiliza conectores adecuados para mantener la coherencia y evita listados numerados. "
            "Destaca las relaciones más relevantes entre los parámetros analizados."
        )

        logger.info("Generando discusión técnica con análisis RMR/SMR...")
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
            "Como geólogo senior, sintetiza las principales conclusiones técnicas derivadas del estudio de los siguientes afloramientos rocosos. "
            "Presenta entre 4 y 6 conclusiones numeradas, cada una como un párrafo breve (2-3 oraciones). "
            "Las conclusiones deben ser específicas, basadas en evidencia y relevantes para la caracterización geotécnica.\n\n"
            "Datos resumidos:\n\n"
        )
        
        tipos_roca = []
        calidades = []
        num_familias = []
        
        for i, bloque in enumerate(bloques, 1):
            # Extraer datos del formulario
            tipo_roca = bloque.get(f'tipo_roca_{i}', 'N/A')
            roca = bloque.get(f'roca_{i}', 'N/A')
            calidad = bloque.get(f'calidad_{i}', 'N/A')
            
            # Contar familias de discontinuidades
            familias = [k for k in bloque.keys() if k.startswith(f'tabla-{i}-')]
            
            tipos_roca.append(tipo_roca)
            calidades.append(calidad)
            num_familias.append(len(familias))
            
            prompt += f"Afloramiento {i}: {tipo_roca} ({roca}), "
            prompt += f"Calidad {calidad}, {len(familias)} familias\n"

        # Análisis agregado para las conclusiones
        prompt += "\nResumen estadístico:\n"
        prompt += f"- Tipos de roca predominantes: {', '.join(set(t for t in tipos_roca if t != 'N/A'))}\n"
        prompt += f"- Distribución de calidades: {', '.join(calidades)}\n"
        prompt += f"- Promedio de familias por afloramiento: {sum(num_familias)/len(num_familias):.1f}\n\n"
        
        prompt += (
            "Redacta conclusiones que cubran:\n"
            "1. Composición litológica predominante\n"
            "2. Calidad general del macizo rocoso\n"
            "3. Características estructurales relevantes\n"
            "4. Implicaciones geotécnicas principales\n"
            "5. Recomendaciones para estudios complementarios\n"
            "6. Correlaciones geológicas significativas\n"
            "Cada conclusión debe ser concisa pero sustancial, basada en los datos presentados."
        )

        logger.info("Generando conclusiones...")
        response = model.generate_content(prompt)
        
        if not response.text:
            raise ValueError("La respuesta del modelo está vacía")
            
        return response.text.strip()
        
    except Exception as e:
        logger.error(f"Error al generar conclusiones: {str(e)}")
        raise

# -- CONFIGURACIÓN PARA EVALUACIÓN DEL MODELO ---

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

# -- CONFIGURACIÓN PARA LA INTERPRETACIÓN ENSAYO DEL ESCLERÓMETRO ---

def generar_interpretacion_esclerometro(resultados, model):
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
            "Redacta una interpretación clara y profesional que explique qué indican estos resultados sobre la calidad "
            "y resistencia de la roca, posibles aplicaciones y recomendaciones. "
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
