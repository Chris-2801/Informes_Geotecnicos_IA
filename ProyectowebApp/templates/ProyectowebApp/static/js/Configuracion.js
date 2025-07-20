   // Función utilitaria para obtener el token CSRF
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

 function mostrarSeccion(seccionId) {
      // Ocultar todas las secciones
      document.querySelectorAll('.seccion-contenido').forEach(seccion => {
        seccion.classList.remove('activa');
      });
      
      // Mostrar la sección seleccionada
      document.getElementById(seccionId).classList.add('activa');
      
      // Actualizar la barra secundaria
      actualizarBarraSecundaria(seccionId);
      
      // Desplazamiento suave al inicio de la sección
      document.getElementById(seccionId).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

window.onload = () => {
  mostrarSeccion('datos');
    if (!sessionStorage.getItem("reiniciado")) {
    if (!confirm("¿Deseas reiniciar la página?")) return;
      sessionStorage.setItem("reiniciado", "true");}

    ["btn-esclerometro", "btn-validacion", "btn-triaxial", "btn-smr"].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener("click", function (event) {
          const salir = confirm("¿Deseas salir de la página de edición? Los datos no guardados se perderán.");
          if (!salir) event.preventDefault();
        });}
 });};

   function actualizarBarraSecundaria(seccionId) {
      const barraSecundaria = document.getElementById('barra-secundaria');
      
      if (seccionId === 'ensayos') {
        barraSecundaria.innerHTML = `
          <a onclick="volverAInforme()" class="volver">← Volver al Informe</a>
        `;
      } else {
        // Barra secundaria normal
        barraSecundaria.innerHTML = `
          <a onclick="mostrarSeccion('datos')" ${seccionId === 'datos' ? 'class="activo"' : ''}>Datos</a>
          <a onclick="mostrarSeccion('afloramientos')" ${seccionId === 'afloramientos' ? 'class="activo"' : ''}>Afloramientos</a>
          <a onclick="mostrarSeccion('geomecanica')" ${seccionId === 'geomecanica' ? 'class="activo"' : ''}>Geomecánica</a>
          <a onclick="mostrarSeccion('resultados')" ${seccionId === 'resultados' ? 'class="activo"' : ''}>Resultados</a>
        `;
      }
    }


    // Función para volver al informe
    function volverAInforme() {
      mostrarSeccion('datos');
    }

    // Configurar eventos
    document.addEventListener('DOMContentLoaded', function() {
      // Mostrar sección de datos por defecto
      mostrarSeccion('datos');
      
      // Configurar evento para el botón de ensayos en el menú principal
      document.getElementById('btn-ensayos-menu').addEventListener('click', function(e) {
        e.preventDefault();
        mostrarSeccion('ensayos');
      });
      
      // Prevenir comportamiento por defecto en botones de ensayos
      document.querySelectorAll('.btn-ensayo').forEach(boton => {
        boton.addEventListener('click', function(e) {
          if (!this.getAttribute('href') || this.getAttribute('href') === '#') {
            e.preventDefault();
          }
        });
      });
    });

//API KEY 

