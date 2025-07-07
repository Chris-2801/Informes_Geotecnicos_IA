import uuid
import json
import io
import base64
import re
import math
import json

from django.shortcuts import render
from django.http import JsonResponse

from django.shortcuts import render
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import mplstereonet

from .utils import (
    describir_imagen_por_tipo,
    generar_informe_general,
    generar_discusion,
    generar_conclusiones,
    generar_objetivos_desde_titulo,
    configurar_genai,
)

def subir_imagen(request):
    if request.method == "POST" and request.headers.get("X-Requested-With") == "XMLHttpRequest":
        model = configurar_genai()
        if model is None:
            return JsonResponse({"error": "Modelo no configurado correctamente."}, status=500)

        imagen = request.FILES.get("imagen")
        tipo = request.POST.get("tipo")  # "afloramiento" o "roca"

        if not imagen or not tipo:
            return JsonResponse({"error": "Faltan datos"}, status=400)

        nombre_archivo = f"temp/{uuid.uuid4()}.jpg"
        ruta_guardada = default_storage.save(nombre_archivo, ContentFile(imagen.read()))
        ruta_completa = default_storage.path(ruta_guardada)

        try:
            descripcion = describir_imagen_por_tipo(ruta_completa, tipo, model)
        except ValueError as e:
            return JsonResponse({"error": str(e)}, status=400)
        except Exception as e:
            return JsonResponse({"error": f"Error generando descripción: {str(e)}"}, status=500)

        return JsonResponse({
            "imagen_url": default_storage.url(ruta_guardada),
            "descripcion": descripcion,
        })

    return render(request, "ProyectowebApp/subir_imagen.html")

@csrf_exempt
def generar_estereograma(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)

            # Caso 1: estereograma general con lista directa de orientaciones
            if "orientaciones" in data:
                orientaciones = data["orientaciones"]
                if not orientaciones or not isinstance(orientaciones, list):
                    return JsonResponse({"error": "No se enviaron orientaciones válidas."}, status=400)

                imagen = crear_estereograma(orientaciones)
                if imagen is None:
                    return JsonResponse({"error": "No se pudo generar el estereograma."}, status=400)

                return JsonResponse({"imagen": imagen})

            # Caso 2: estereogramas por bloques
            elif "bloques" in data:
                bloques = data["bloques"]
                if not bloques or not isinstance(bloques, list):
                    return JsonResponse({"error": "No se enviaron bloques válidos."}, status=400)

                imagenes_por_bloque = {}

                for bloque in bloques:
                    orientaciones = bloque.get("orientaciones", [])
                    bloque_id = bloque.get("id", "sin_id")

                    if not orientaciones or not isinstance(orientaciones, list):
                        imagenes_por_bloque[bloque_id] = None
                        continue

                    imagen = crear_estereograma(orientaciones)
                    imagenes_por_bloque[bloque_id] = imagen

                return JsonResponse({"imagenes": imagenes_por_bloque})

            else:
                return JsonResponse({"error": "No se encontraron datos válidos en la petición."}, status=400)

        except Exception as e:
            print("Error interno:", str(e))
            return JsonResponse({"error": "Ocurrió un error al generar el estereograma."}, status=400)

    return JsonResponse({"error": "Método no permitido"}, status=405)

def crear_estereograma(orientaciones):
    fig = plt.figure(figsize=(6, 6))
    ax = fig.add_subplot(111, projection='stereonet')

    hay_datos = False
    for orientacion in orientaciones:
        match = re.match(r"^\s*(\d{1,3})/(\d{1,2})\s*$", orientacion)
        if match:
            dip_direction = float(match.group(1))
            dip = float(match.group(2))
            strike = (dip_direction - 90) % 360
            ax.plane(strike, dip, 'r-', linewidth=1)
            hay_datos = True

    if not hay_datos:
        plt.close(fig)
        return None

    ax.grid()
    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches='tight')
    plt.close(fig)
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode("utf-8")
    return f"data:image/png;base64,{img_base64}"

@csrf_exempt
def generar_resultado(request):
    if request.method == "POST":
        model = configurar_genai()
        if model is None:
            return JsonResponse({"error": "Modelo no configurado correctamente."}, status=500)

        try:
            data = json.loads(request.body)
            bloques = data.get("bloques", [])
            resultado = generar_informe_general(bloques, model)
            discusion = generar_discusion(bloques, model)
            conclusiones = generar_conclusiones(bloques, model)

            return JsonResponse({
                "resultado": resultado,
                "discusion": discusion,
                "conclusiones": conclusiones,
            })
        except Exception as e:
            return JsonResponse({"error": f"Error generando secciones del informe: {str(e)}"}, status=500)

    return JsonResponse({"error": "Método no permitido"}, status=405)  

def generar_objetivos(request):
    if request.method == "POST":
        model = configurar_genai()
        try:
            data = json.loads(request.body)
            titulo = data.get("titulo")
            if not titulo:
                return JsonResponse({"error": "No se recibió el título del proyecto."}, status=400)
            objetivos = generar_objetivos_desde_titulo(model, titulo)
            return JsonResponse({"objetivos": objetivos})
        except Exception as e:
            return JsonResponse({"error": f"Error al generar objetivos: {str(e)}"}, status=500)
    return JsonResponse({"error": "Método no permitido"}, status=405)

from django.shortcuts import render
import math
import statistics
from django.shortcuts import render
from django.http import JsonResponse
import json
import math

import os
import math
import statistics
from django.shortcuts import render
from .utils import generar_interpretacion_esclerometro  # <-- IMPORTA TU FUNCIÓN
import google.generativeai as genai

# Configura Gemini una vez
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

def calcular_esclerometro(request):
    if request.method == "POST":

        model = configurar_genai()

        metodo = request.POST.get("metodo")
        densidad_str = request.POST.get("densidad")

        try:
            densidad = float(densidad_str)
        except ValueError:
            return render(request, "ProyectowebApp/calcular_esclerometro.html", {
                "error": "La densidad debe ser un número válido."
            })

        cantidad = 20 if metodo == "isrm" else 10 if metodo == "astm" else 0
        if cantidad == 0:
            return render(request, "ProyectowebApp/calcular_esclerometro.html", {
                "error": "Seleccione un método válido."
            })

        valores = []
        for i in range(cantidad):
            v = request.POST.get(f"valor_{i}")
            try:
                valores.append(float(v))
            except:
                return render(request, "ProyectowebApp/calcular_esclerometro.html", {
                    "error": f"Todos los valores deben ser numéricos. Error en valor {i + 1}."
                })

        if len(valores) != cantidad:
            return render(request, "ProyectowebApp/calcular_esclerometro.html", {
                "error": f"Debe ingresar exactamente {cantidad} valores."
            })

        densidad_kgm3 = densidad * 1000
        peso_especifico = densidad_kgm3 * 9.81 / 1000

        mayores_10 = sorted(valores, reverse=True)[:10]
        hr_prom = sum(mayores_10) / 10
        hr_med = statistics.median(mayores_10)

        ucs_prom = 10 ** (0.00088 * peso_especifico * hr_prom + 1.01)
        ucs_med = 10 ** (0.00088 * peso_especifico * hr_med + 1.01)
        e = math.exp(-8.967 + 3.091 * math.log(hr_prom))

        resultado = {
            "metodo": "ISRM (1978)" if metodo == "isrm" else "ASTM D5873",
            "hr_promedio": round(hr_prom, 0),
            "hr_mediana": round(hr_med, 0),
            "peso_esp": round(peso_especifico, 3),
            "ucs_prom": round(ucs_prom, 3),
            "ucs_mediana": round(ucs_med, 3),
            "e": round(e, 4),
            "valores_usados": [round(v, 0) for v in mayores_10],
        }

        interpretacion = generar_interpretacion_esclerometro(resultado, model)

        return render(request, "ProyectowebApp/calcular_esclerometro.html", {
            "resultado": resultado,
            "interpretacion": interpretacion
        })

    return render(request, "ProyectowebApp/calcular_esclerometro.html")

import json
import math
from django.http import JsonResponse
from django.shortcuts import render

from django.shortcuts import render
from django.http import JsonResponse
import json
import math

def triaxial_view(request):
    return render(request, 'ProyectowebApp/Triaxial.html')

def calculate_moisture(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            containers = data.get('containers', [])
            container_masses = data.get('container_masses', [])
            wet_soils = data.get('wet_soils', [])
            dry_soils = data.get('dry_soils', [])
            volumes = data.get('volumes', [])
            
            results = []
            for i in range(len(containers)):
                try:
                    container_mass = float(container_masses[i])
                    wet_soil = float(wet_soils[i])
                    dry_soil = float(dry_soils[i])
                    volume = float(volumes[i])
                    
                    moisture = 0
                    if (dry_soil - container_mass) > 0:
                        moisture = ((wet_soil - dry_soil) / (dry_soil - container_mass)) * 100
                    
                    wet_density = (wet_soil - container_mass) / volume if volume > 0 else 0
                    dry_density = (dry_soil - container_mass) / volume if volume > 0 else 0
                    
                    results.append({
                        'container': containers[i],
                        'moisture': round(moisture, 2),
                        'wet_density': round(wet_density, 2),
                        'dry_density': round(dry_density, 2)
                    })
                except (ValueError, ZeroDivisionError):
                    continue
            
            return JsonResponse({'status': 'success', 'results': results})
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=400)

def calculate_sample_data(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            diameters = data.get('diameters', [0, 0, 0])
            heights = data.get('heights', [0, 0, 0])
            masses = data.get('masses', [0, 0, 0])
            humidities = data.get('humidities', [0, 0, 0])
            ao_values = data.get('ao_values', [0, 0, 0])
            dry_soils = data.get('dry_soils', [0, 0, 0])  # Nuevo: Suelo seco + contenedor
            wet_soils = data.get('wet_soils', [0, 0, 0])  # Nuevo: Suelo húmedo + contenedor
            container_masses = data.get('container_masses', [0, 0, 0])  # Nuevo: Masa contenedor
            
            results = []
            for i in range(3):
                try:
                    diameter = float(diameters[i])
                    height = float(heights[i])
                    mass = float(masses[i])
                    humidity = float(humidities[i]) / 100
                    ao = float(ao_values[i])
                    dry_soil = float(dry_soils[i])  # Nuevo
                    wet_soil = float(wet_soils[i])  # Nuevo
                    container_mass = float(container_masses[i])  # Nuevo
                    
                    # Cálculo del volumen (cm³)
                    volume = ao * height / 10
                    
                    # Cálculo de pesos unitarios (kN/m³)
                    dry_weight = (mass / 1000 * 9.81) / (volume / 1000000) / 1000 if volume > 0 else 0
                    wet_weight = dry_weight / (1 + humidity) if humidity < 1 else 0
                    
                    # Cálculo de densidades (g/cm³)
                    dry_density = (dry_soil - container_mass) / volume if volume > 0 else 0
                    wet_density = (wet_soil - container_mass) / volume if volume > 0 else 0
                    
                    results.append({
                        'volume': round(volume, 2),
                        'dry_weight': round(dry_weight, 2),
                        'wet_weight': round(wet_weight, 2),
                        'dry_density': round(dry_density, 4),  # Nuevo
                        'wet_density': round(wet_density, 4),  # Nuevo
                        'diameter': diameter,
                        'ao': ao
                    })
                except (ValueError, ZeroDivisionError):
                    results.append({
                        'volume': 0,
                        'dry_weight': 0,
                        'wet_weight': 0,
                        'dry_density': 0,  # Nuevo
                        'wet_density': 0,  # Nuevo
                        'diameter': 0,
                        'ao': 0
                    })
            
            return JsonResponse({'status': 'success', 'results': results})
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=400)

def calculate_phi_values(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            phi_s = data.get('phi_s', [0, 0, 0])
            phi_m = data.get('phi_m', [0, 0, 0])
            phi_i = data.get('phi_i', [0, 0, 0])
            
            results = []
            for i in range(3):
                try:
                    phi_s_val = float(phi_s[i])
                    phi_m_val = float(phi_m[i])
                    phi_i_val = float(phi_i[i])
                    
                    as_val = math.pi * (phi_s_val/10)**2 / 4
                    am_val = math.pi * (phi_m_val/10)**2 / 4
                    ai_val = math.pi * (phi_i_val/10)**2 / 4
                    ao_val = (as_val + 4 * am_val + ai_val) / 6
                    
                    results.append({
                        'as': round(as_val, 2),
                        'am': round(am_val, 2),
                        'ai': round(ai_val, 2),
                        'ao': round(ao_val, 2)
                    })
                except ValueError:
                    results.append({
                        'as': 0,
                        'am': 0,
                        'ai': 0,
                        'ao': 0
                    })
            
            return JsonResponse({'status': 'success', 'results': results})
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=400)

def calculate_probe_data(request, probe_num):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            probe_length = float(data.get('probe_length', 0))
            dial_constant = float(data.get('dial_constant', 0.8822))
            ao = float(data.get('ao', 0))
            diameter = float(data.get('diameter', 0))
            deformations = data.get('deformations', [])
            dial_readings = data.get('dial_readings', [])
            
            results = {
                'deformations': [],
                'stresses': [],
                'axial_strains': [],
                'radial_strains': [],
                'volumetric_strains': [],
                'shear_strains': []
            }
            
            for i in range(len(deformations)):
                try:
                    deformation = float(deformations[i])
                    dial_reading = float(dial_readings[i])
                    
                    mm = deformation / 100
                    strain = mm / probe_length if probe_length > 0 else 0
                    area = ao / (1 - strain) if strain < 1 else 0
                    n = dial_reading * dial_constant
                    stress = n / area * 10 if area > 0 else 0
                    radial_strain = -mm / diameter if diameter > 0 else 0
                    volumetric_strain = strain - 2 * radial_strain
                    shear_strain = (strain - volumetric_strain) / 2
                    
                    results['deformations'].append(deformation)
                    results['stresses'].append(round(stress, 2))
                    results['axial_strains'].append(round(strain, 6))
                    results['radial_strains'].append(round(radial_strain, 6))
                    results['volumetric_strains'].append(round(volumetric_strain, 6))
                    results['shear_strains'].append(round(shear_strain, 6))
                except (ValueError, ZeroDivisionError):
                    continue
            
            return JsonResponse({'status': 'success', 'results': results})
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=400)

def get_detailed_table(request, probe_num):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            deformations = data.get('deformations', [])
            stresses = data.get('stresses', [])
            axial_strains = data.get('axial_strains', [])
            radial_strains = data.get('radial_strains', [])
            volumetric_strains = data.get('volumetric_strains', [])
            shear_strains = data.get('shear_strains', [])
            
            results = []
            for i in range(len(deformations)):
                results.append({
                    'deformation': deformations[i],
                    'stress': stresses[i],
                    'axial_strain': axial_strains[i],
                    'radial_strain': radial_strains[i],
                    'volumetric_strain': volumetric_strains[i],
                    'shear_strain': shear_strains[i]
                })
            
            return JsonResponse({'status': 'success', 'results': results, 'probe_num': probe_num})
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=400)

# -- EVALUACIÓN GEMINI ---

from django.shortcuts import render
from .utils import evaluate_response

def validacion_view(request):
    if request.method == "POST":
        predicted_text = request.POST.get("predicted_text", "")
        expected_text = request.POST.get("expected_text", "")
        
        if not predicted_text or not expected_text:
            return render(request, "ProyectowebApp/Validacion.html", {
                "error": "Ambos campos son requeridos"
            })
        
        metrics = evaluate_response(predicted_text, expected_text)
        
        return render(request, "ProyectowebApp/Validacion.html", {
            "metrics": metrics,
            "predicted_text": predicted_text,
            "expected_text": expected_text,
            "show_results": True
        })
    
    return render(request, "ProyectowebApp/Validacion.html", {"show_results": False})

from .utils import obtener_modelo_por_indice

@csrf_exempt
def generar_resultado(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            prompt = data.get("prompt")
            api_index = int(data.get("api_index", 0))

            model = obtener_modelo_por_indice(api_index)
            response = model.generate_content(prompt)

            return JsonResponse({"resultado": response.text})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)