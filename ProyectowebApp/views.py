import io, re, os, uuid, json, math, base64, statistics, matplotlib

from django.shortcuts import render
from django.http import JsonResponse
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.views.decorators.csrf import csrf_exempt
import mplstereonet

import matplotlib.pyplot as plt
matplotlib.use('Agg')

from .utils import (describir_imagen_por_tipo, generar_informe_general, generar_discusion, generar_conclusiones, generar_objetivos_desde_titulo,
    configurar_genai, generar_interpretacion_esclerometro, evaluate_response)

@csrf_exempt

# -- GENERACIÓN DE TEXTO CON GEMINI ---

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

def generar_objetivos(request, return_html=False):
    if request.method == "POST":
        model = configurar_genai()
        try:
            if return_html:
                titulo = request.POST.get("titulo")  # Si es HTML, los datos vienen en POST
            else:
                data = json.loads(request.body)      # Si es JSON, se parsea el body
                titulo = data.get("titulo")

            if not titulo:
                if return_html:
                    return render(request, "ProyectowebApp/subir_imagen.html", {
                        "error": "No se recibió el título del proyecto."
                    })
                else:
                    return JsonResponse({"error": "No se recibió el título del proyecto."}, status=400)

            objetivos = generar_objetivos_desde_titulo(model, titulo)

            if return_html:
                return render(request, "ProyectowebApp/subir_imagen.html", {
                    "objetivos": objetivos
                })
            else:
                return JsonResponse({"objetivos": objetivos})

        except Exception as e:
            if return_html:
                return render(request, "ProyectowebApp/subir_imagen.html", {
                    "error": f"Error al generar objetivos: {str(e)}"
                })
            else:
                return JsonResponse({"error": f"Error al generar objetivos: {str(e)}"}, status=500)

    if return_html:
        return render(request, "ProyectowebApp/subir_imagen.html")
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)

def generar_resultado(request, return_html=False):
    if request.method == "POST":
        model = configurar_genai()
        if model is None:
            error_msg = "Modelo no configurado correctamente."
            if return_html:
                return render(request, "ProyectowebApp/subir_imagen.html", {"error": error_msg})
            return JsonResponse({"error": error_msg}, status=500)

        try:
            # Obtener los datos de los bloques de manera consistente
            if return_html:
                # Para formulario HTML, los datos vienen en request.POST
                bloques = []
                # Asumiendo que los datos vienen en campos como bloque_1, bloque_2, etc.
                i = 1
                while f'tipo_roca_{i}' in request.POST:
                    bloque = {key: request.POST[key] for key in request.POST.keys() 
                             if key.startswith(f'tipo_roca_{i}') or 
                             key.startswith(f'roca_{i}') or 
                             key.startswith(f'calidad_{i}') or 
                             key.startswith(f'matriz_{i}') or 
                             key.startswith(f'textura_{i}') or 
                             key.startswith(f'mineralogia_{i}') or 
                             key.startswith(f'grano_{i}') or 
                             key.startswith(f'descripcion_afloramiento_{i}') or 
                             key.startswith(f'descripcion_roca_{i}') or 
                             key.startswith(f'tabla-{i}-')}
                    if bloque:  # Solo añadir si hay datos
                        bloques.append(bloque)
                    i += 1
            else:
                # Para AJAX/JSON
                data = json.loads(request.body)
                bloques = data.get("bloques", [])
                
            # Validar que hay bloques con datos
            if not bloques:
                raise ValueError("No se recibieron datos de bloques válidos")

            # Generar las secciones del informe
            resultado = generar_informe_general(bloques, model)
            discusion = generar_discusion(bloques, model)
            conclusiones = generar_conclusiones(bloques, model)

            if return_html:
                return render(request, "ProyectowebApp/subir_imagen.html", {
                    "resultado": resultado,
                    "discusion": discusion,
                    "conclusiones": conclusiones,
                })
            return JsonResponse({
                "resultado": resultado,
                "discusion": discusion,
                "conclusiones": conclusiones,
            })

        except json.JSONDecodeError as e:
            error_msg = f"Error decodificando JSON: {str(e)}"
        except Exception as e:
            error_msg = f"Error generando secciones del informe: {str(e)}"
            
        if return_html:
            return render(request, "ProyectowebApp/subir_imagen.html", {"error": error_msg})
        return JsonResponse({"error": error_msg}, status=500)

    # Método no permitido (GET u otros)
    if return_html:
        return render(request, "ProyectowebApp/subir_imagen.html")
    return JsonResponse({"error": "Método no permitido"}, status=405)

# -- ESTEREOGRAMA ---

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

# -- ENSAYO ESCLERÓMETRO ---

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

# -- ENSAYO TRIAXIAL ---

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

# -- SMR ---

def calcular_smr(request):
    resultado = None
    if request.method == 'POST':
        try:
            beta_j = float(request.POST.get('beta_j', 0))
            beta_t = float(request.POST.get('beta_t', 0))
            lambda_val = float(request.POST.get('lambda_val', 0))
            tipo_rotura = request.POST.get('tipo_rotura')
            excavacion = request.POST.get('metodo_excavacion')

            # RQD
            rqd = 100 * math.exp(-lambda_val * (0.1 * lambda_val + 1))

            # F1
            if tipo_rotura == 'planar':
                delta = abs(beta_j - beta_t)
            elif tipo_rotura == 'vuelco':
                delta = abs(beta_j - beta_t - 180)
            else:
                delta = 0

            if delta < 5:
                f1 = 1
                f1_txt = "Muy Desfavorable"
            elif 5 <= delta < 10:
                f1 = 0.85
                f1_txt = "Desfavorable"
            elif 10 <= delta < 20:
                f1 = 0.7
                f1_txt = "Normal"
            elif 20 <= delta < 30:
                f1 = 0.4
                f1_txt = "Favorable"
            else:
                f1 = 0.15
                f1_txt = "Muy Favorable"
            f1_calc = (1 - math.sin(math.radians(delta))) ** 2

            # F2
            if tipo_rotura == 'vuelco':
                f2 = 1
                f2_txt = "Siempre 1"
            else:
                if beta_j < 20:
                    f2 = 0.15
                    f2_txt = "Muy Favorable"
                elif 20 <= beta_j < 30:
                    f2 = 0.4
                    f2_txt = "Favorable"
                elif 30 <= beta_j < 35:
                    f2 = 0.7
                    f2_txt = "Normal"
                elif 35 <= beta_j < 45:
                    f2 = 0.85
                    f2_txt = "Desfavorable"
                else:
                    f2 = 1
                    f2_txt = "Muy Desfavorable"
            f2_calc = math.tan(math.radians(beta_j)) ** 2

            # F3
            if tipo_rotura == 'planar':
                dif = beta_j - beta_t
                if dif < -10:
                    f3 = -60
                    f3_txt = "Muy Desfavorable"
                elif -10 <= dif < 0:
                    f3 = -50
                    f3_txt = "Desfavorable"
                elif dif == 0:
                    f3 = -25
                    f3_txt = "Normal"
                elif 0 < dif <= 10:
                    f3 = -6
                    f3_txt = "Favorable"
                else:
                    f3 = 0
                    f3_txt = "Muy Favorable"
            else:
                suma = beta_j + beta_t
                if suma < 110:
                    f3 = 0
                    f3_txt = "Muy Favorable"
                elif 110 <= suma <= 120:
                    f3 = -6
                    f3_txt = "Favorable"
                else:
                    f3 = -25
                    f3_txt = "Desfavorable"

            # F4
            f4_opciones = {
                'talud_natural': 15,
                'precorte': 10,
                'voladura_suave': 8,
                'voladura_mecanica': 0,
                'voladura_deficiente': -8
            }
            f4 = f4_opciones.get(excavacion, 0)

            rmr_basico = 0  # Puedes cambiar si quieres

            # SMR
            smr = rmr_basico + (f1 * f2 * f3) + f4

            resultado = {
                'delta': round(delta, 2),
                'rqd': round(rqd, 2),
                'f1': round(f1, 2),
                'f1_txt': f1_txt,
                'f1_calc': round(f1_calc, 2),
                'f2': round(f2, 2),
                'f2_txt': f2_txt,
                'f2_calc': round(f2_calc, 2),
                'f3': f3,
                'f3_txt': f3_txt,
                'f4': f4,
                'rmr_basico': rmr_basico,
                'smr': round(smr, 2)
            }

        except Exception as e:
            resultado = {'error': str(e)}

    return render(request, 'ProyectowebApp/SMR.html', {'resultado': resultado})
