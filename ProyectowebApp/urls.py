from django.urls import path
from django.views.generic.base import RedirectView
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Redirige la raíz (/ ) a /subir_imagen/
    path('', RedirectView.as_view(url='/subir_imagen/'), name='root_redirect'),
    
    # Tus URLs existentes
    path('subir_imagen/', views.subir_imagen, name='subir_imagen'),
    path('generar-objetivos/', views.generar_objetivos, name='generar_objetivos'),
    path('generar_resultado/', views.generar_resultado, name='generar_resultado'),
    path('calcular_esclerometro/', views.calcular_esclerometro, name='calcular_esclerometro'),
    path("generar_estereograma/", views.generar_estereograma, name="generar_estereograma"),
    path('Validacion/', views.validacion_view, name='Validacion'),
    path('Triaxial/', views.triaxial_view, name='Triaxial'),
    path('calculate_moisture/', views.calculate_moisture, name='calculate_moisture'),
    path('calculate_sample_data/', views.calculate_sample_data, name='calculate_sample_data'),
    path('calculate_phi_values/', views.calculate_phi_values, name='calculate_phi_values'),
    path('calculate_probe_data/<int:probe_num>/', views.calculate_probe_data, name='calculate_probe_data'),
    path('get_detailed_table/<int:probe_num>/', views.get_detailed_table, name='get_detailed_table'),
    path('SMR/', views.calcular_smr, name='SMR'),
]

# Configuración para archivos de medios en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)