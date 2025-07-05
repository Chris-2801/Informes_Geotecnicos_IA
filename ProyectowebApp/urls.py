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
]

# Esto permitirá que Django sirva archivos de medios durante el desarrollo (cuando DEBUG=True)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

