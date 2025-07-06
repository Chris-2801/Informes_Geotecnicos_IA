from django.conf import settings
from django.shortcuts import redirect
from django.conf.urls.static import static
from django.urls import path
from ProyectowebApp import views

urlpatterns = [
    path('subir_imagen/', views.subir_imagen, name='subir_imagen'),
    path('calcular_esclerometro/', views.calcular_esclerometro, name='calcular_esclerometro'),
    path("generar_estereograma/", views.generar_estereograma, name="generar_estereograma"),
    path('generar_resultado/', views.generar_resultado, name='generar_resultado'),
    path('generar-objetivos/', views.generar_objetivos, name='generar_objetivos'),
    path('Validacion/', views.validacion_view, name='Validacion'),
    
    # URL para la vista principal del ensayo triaxial
    path('Triaxial/', views.triaxial_view, name='Triaxial'),
    
    # URLs para cálculos (API)
    path('calculate_moisture/', views.calculate_moisture, name='calculate_moisture'),
    path('calculate_sample_data/', views.calculate_sample_data, name='calculate_sample_data'),
    path('calculate_phi_values/', views.calculate_phi_values, name='calculate_phi_values'),
    
    # URLs para probetas (con parámetro probe_num)
    path('calculate_probe_data/<int:probe_num>/', views.calculate_probe_data, name='calculate_probe_data'),
    path('get_detailed_table/<int:probe_num>/', views.get_detailed_table, name='get_detailed_table'),
]

# Esto permitirá que Django sirva archivos de medios durante el desarrollo (cuando DEBUG=True)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

