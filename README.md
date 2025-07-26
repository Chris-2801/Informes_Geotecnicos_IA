# 🧠 GeoReportIA - Generador de Informes Geológicos con Gemini y Django

GeoReportIA es una aplicación web desarrollada con Django que permite generar informes geológicos automáticamente usando el modelo Gemini de Google. La aplicación permite al usuario subir datos geológicos, 
seleccionar imágenes de afloramientos, ingresar observaciones, y generar descripciones, discusiones, conclusiones y más, todo mediante el uso de inteligencia artificial.

## 🚀 Características

- Generación automática de informes geológicos con IA.
- Uso de múltiples claves API de Gemini.
- Procesamiento de imágenes (afloramientos, rocas).
- Generación de resultados estructurales (estereogramas e histogramas).
- Cálculo de las clasificaciones Geomecánicas RMR, SMR
- Cálculo de ensayos: esclerómetro, triaxial, Factores de corrección SMR
- Exportación del informe a PDF.
- Interfaz dinámica con formularios y visualizaciones interactivas.

## 📷 Capturas de pantalla

<img width="1919" height="967" alt="image" src="https://github.com/user-attachments/assets/b7f526f9-a790-4718-b2be-043401471922" />
<img width="1919" height="967" alt="image" src="https://github.com/user-attachments/assets/8f3ca60f-c634-46ca-9dd1-9d4890c344d7" />


## ⚙️ Requisitos

Python 3.13.0
Librearias: Requirements.txt
  py -m pip install libreria

## 📦 Instalación local

1. **Clona este repositorio**

```bash
git clone https://github.com/tu_usuario/GeoReportIA.git
cd GeoReportIA
Descarga Visual Studio Code (VSC) y carga la carpeta Proyecto
Ejecuta desde la teminal: entorno .env (.\env\Scripts\Activate.ps1)
                          Servidor local (py.manage.py runserver o python.manage.py runserver)
