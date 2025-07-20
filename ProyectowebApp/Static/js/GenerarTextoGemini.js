let contador = 1;

function añadirBloque() {
  const contenedor = document.getElementById("contenedor");

  const div = document.createElement("div");
  div.className = "bloque";
  div.id = `bloque-${contador}`;

  div.innerHTML = `
    <h3>Afloramiento ${contador}</h3>
    <div class="flex">
      <!-- Primera fila: Sistema de referencia y coordenadas -->
      <div class="columna">
        <div class="form-group"><label>Sistema de referencia</label>
          <select name="sistema_ref_${contador}">
            <option value="WGS84">WGS84</option>
            <option value="UTM">UTM</option>
            <option value="PSAD56">PSAD56</option>
          </select>
        </div>
        <div class="form-group"><label>Coordenada X</label><input type="text" name="x_${contador}"></div>
        <div class="form-group"><label>Coordenada Y</label><input type="text" name="y_${contador}"></div>
        <div class="form-group"><label>Coordenada Z</label><input type="text" name="z_${contador}"></div>
      </div>

      <!-- Segunda fila: Tipo de roca, roca y calidad -->
      <div class="columna">
        <div class="form-group"><label>Tipo de Roca</label>
          <select name="tipo_roca_${contador}">
            <option value="">Seleccionar...</option>
            <option value="Ignea">Ígnea</option>
            <option value="Metamorfica">Metamórfica</option>
            <option value="Sedimentaria">Sedimentaria</option>
          </select>
        </div>
        <div class="form-group"><label>Roca</label><input type="text" name="roca_${contador}"></div>
        <div class="form-group"><label>Calidad del Macizo Rocoso</label>
          <select name="calidad_${contador}">
            <option value="Muy Buena">Muy Buena</option>
            <option value="Buena">Buena</option>
            <option value="Regular">Regular</option>
            <option value="Mala">Mala</option>
            <option value="Muy Mala">Muy Mala</option>
          </select>
        </div>
      </div>

      <!-- Tercera fila: Características petrográficas -->
      <div class="columna">
        <div class="form-group"><label>Matriz</label><input type="text" name="matriz_${contador}"></div>
        <div class="form-group"><label>Textura</label><input type="text" name="textura_${contador}"></div>
        <div class="form-group"><label>Mineralogía</label><input type="text" name="mineralogia_${contador}"></div>
        <div class="form-group"><label>Tamaño de Grano</label>
          <select name="grano_${contador}">
            <option value="Muy grueso">Muy grueso (>2 mm)</option>
            <option value="Grueso">Grueso (0.5-2 mm)</option>
            <option value="Medio">Medio (0.25-0.5 mm)</option>
            <option value="Fino">Fino (0.0625-0.25 mm)</option>
            <option value="Muy fino">Muy fino (<0.0625 mm)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Sección de imágenes y botones -->
    <div class="acciones" style="margin-top: 15px; display: flex; justify-content: space-between;">
      <div style="flex: 1; margin-right: 10px;">
        <input id="file-afloramiento-${contador}" type="file" accept="image/*" style="width: 100%;">
        <button onclick="generarTexto(${contador}, 'afloramiento')" style="width: 100%; margin-top: 5px;">Generar descripción afloramiento</button>
      </div>
      <div style="flex: 1;">
        <input id="file-roca-${contador}" type="file" accept="image/*" style="width: 100%;">
        <button onclick="generarTexto(${contador}, 'roca')" style="width: 100%; margin-top: 5px;">Generar descripción roca</button>
      </div>
    </div>

    <!-- Resultados de imágenes -->
    <div class="resultado-general" id="resultado-general-${contador}" style="display:none; margin-top:15px;">
      <div style="display: flex; gap: 10px;">
        <div style="flex: 1;">
          <h4>Afloramiento</h4>
          <img id="preview-afloramiento-${contador}" src="" alt="" style="max-width: 100%; border: 1px solid #ccc;"/>
          <div class="descripcion" id="descripcion-afloramiento-${contador}" style="margin-top: 5px;"></div>
        </div>
        <div style="flex: 1;">
          <h4>Muestra de Roca</h4>
          <img id="preview-roca-${contador}" src="" alt="" style="max-width: 100%; border: 1px solid #ccc;"/>
          <div class="descripcion" id="descripcion-roca-${contador}" style="margin-top: 5px;"></div>
        </div>
      </div>
    </div>

    <!-- Sección RMR (se mantiene igual) -->
    <div class="tabla-dinamica-container" style="margin-top:20px;">
      <h4>Familias para Afloramiento ${contador}</h4>
      <button class="btn-agregar-fila" onclick="agregarFila(${contador})">Añadir Familia</button>
      <table id="tabla-${contador}">
        <thead>
          <tr>
            <th>Nº</th>
            <th>Orientación</th>
            <th>UCS (MPa)</th>
            <th>RQD</th>
            <th>Espaciamiento</th>
            <th>Continuidad</th>
            <th>Apertura</th>
            <th>Rugosidad</th>
            <th>Relleno</th>
            <th>Alteración</th>
            <th>Agua freática</th>
            <th>Eliminar</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>

      <div style="margin-top:10px; text-align:center; display:flex; justify-content: space-between; gap: 10px;">
        <button onclick="generarEstereogramaYGraficos(${contador})" style="font-size:14px; padding:6px 12px; flex: 1;">
          Generar Gráficas
        </button>

        <div style="flex: 1;">
          <label for="variable-${contador}">Variable:</label>
          <select id="variable-${contador}" onchange="generarGraficos(${contador})" style="width: 100%;">
            <option value="UCS_${contador}">UCS</option>
            <option value="RQD_${contador}">RQD</option>
            <option value="Espaciamiento_${contador}">Espaciamiento</option>
            <option value="Continuidad_${contador}">Continuidad</option>
            <option value="Apertura_${contador}">Apertura</option>
            <option value="Rugosidad_${contador}">Rugosidad</option>
            <option value="Relleno_${contador}">Relleno</option>
            <option value="Alteracion_${contador}">Alteración</option>
            <option value="AguaFreatica_${contador}">Agua freática</option>
          </select>
        </div>
      </div>

      <div style="display:flex; gap:10px; margin-top: 10px;">
        <div id="estereograma-container-${contador}" style="display:none; flex:1; text-align:center;">
          <img id="estereograma-img-${contador}" src="" alt="Estereograma Afloramiento ${contador}" style="max-width: 100%; border: 1px solid #ccc; padding: 10px;">
        </div>

        <div id="grafico-container-${contador}" style="display:none; flex:1; text-align:center;">
          <canvas id="histograma-${contador}" width="400" height="250"></canvas>
        </div>
      </div>
    </div>

    <div style="margin-top: 15px; text-align: right;">
      <button onclick="eliminarImagen(${contador}, 'afloramiento')" class="eliminar">Eliminar afloramiento</button>
      <button onclick="eliminarImagen(${contador}, 'roca')" class="eliminar">Eliminar roca</button>
    </div>
  `;

  contenedor.appendChild(div);
  setTimeout(() => agregarFila(contador), 100);
  contador++;
}

 function agregarFila(id) {
      const tbody = document.querySelector(`#tabla-${id} tbody`);
      const num = tbody.children.length + 1;
      const fila = document.createElement("tr");

      // Opciones específicas para cada variable
      const opcionesPorCampo = {
        UCS: ["<250 MPa", "250-100 MPa", "100-50 MPa", "50-25 MPa","25 -5 MPa", "5-1 MPa", "<1 MPa"],
        RQD: ["90-100%", "75-90%", "50-75%", "25-50%","<25%"],
        Espaciamiento: [">2 m", "0.6-2 m", "0.2-0.6 m", "0.06-0.2 m","<0.06 m"],
        Continuidad: ["<1 m", "1–3 m", "3–10 m", "10–20 m",">20 m"],
        Apertura: ["Nada","<0.1 mm", "0.1–1 mm", "1–5 mm", ">5 mm"],
        Rugosidad: ["Muy Rugosa", "Rugosa", "Ligeramente Rugosa", "Ondulada", "Suave"],
        Relleno: ["Sin relleno", "Relleno Duro (<5 mm)", "Relleno Duro (>5 mm)", "Relleno Blando (<5 mm)", "Relleno Blando (>5 mm)"],
        Alteracion: ["Inalterada", "Ligeramente", "Moderadamente", "Muy Alterada","Descompuesta"],
        AguaFreatica: ["Seco", "Ligeramente Humedo","Humedo", "Goteando", "Agua fluyendo"]
      };

      // Función para crear select con opciones personalizadas
      function crearSelectHTML(nombreCampo) {
        const opciones = opcionesPorCampo[nombreCampo] || [];
        const opcionesHTML = opciones.map(opcion =>
          `<option value="${opcion}">${opcion}</option>`).join("");
        return `<select name="${nombreCampo}_${id}[]" onchange="actualizarDatosAfloramiento(${id}, this)">
                  <option value="">Seleccionar</option>
                  ${opcionesHTML}
                </select>`;
      }

      fila.innerHTML = `
        <td><input type="text" value="${num}" readonly></td>
        <td>
          <input type="text" name="orientacion_${id}[]" placeholder="000/00" 
                 pattern="\\d{3}/\\d{2}" title="Formato 000/00" required>
        </td>
        <td>${crearSelectHTML("UCS")}</td>
        <td>${crearSelectHTML("RQD")}</td>
        <td>${crearSelectHTML("Espaciamiento")}</td>
        <td>${crearSelectHTML("Continuidad")}</td>
        <td>${crearSelectHTML("Apertura")}</td>
        <td>${crearSelectHTML("Rugosidad")}</td>
        <td>${crearSelectHTML("Relleno")}</td>
        <td>${crearSelectHTML("Alteracion")}</td>
        <td>${crearSelectHTML("AguaFreatica")}</td>
        <td><button onclick="eliminarFila(this)">X</button></td>
      `;

      tbody.appendChild(fila);
      
      // Inicializar datos para este afloramiento si no existen
      if (!datosCompletosPorAfloramiento[id]) {
        datosCompletosPorAfloramiento[id] = {
          nombre: `Afloramiento ${id}`,
          valoresRMR: [],
          datosFilas: []
        };
      }
      
      // Actualizar selector de afloramientos
      actualizarSelectorAfloramientos();
      
      // Mostrar sección de análisis si hay datos
      mostrarSeccionAnalisisRMR();
    }

function eliminarFila(btn) {
  btn.closest("tr").remove();
}

function eliminarFila(button) {
      const fila = button.closest('tr');
      const tabla = fila.closest('table');
      const id = tabla.id.replace('tabla-', '');
      const filaIndex = Array.from(fila.parentNode.children).indexOf(fila);
      
      // Eliminar los datos correspondientes
      if (datosCompletosPorAfloramiento[id]) {
        datosCompletosPorAfloramiento[id].datosFilas[filaIndex] = undefined;
        datosCompletosPorAfloramiento[id].valoresRMR = datosCompletosPorAfloramiento[id].datosFilas
          .filter(f => f !== undefined)
          .map(f => f.rmr);
          
        // Actualizar tabla detalle
        actualizarTablaDetalleRMR(id);
      }
      
      fila.parentNode.removeChild(fila);
      
      // Actualizar selector de afloramientos
      actualizarSelectorAfloramientos();
      
      // Actualizar análisis RMR si es necesario
      mostrarSeccionAnalisisRMR();
}

function generarTexto(id, tipo) {
  const input = document.getElementById(`file-${tipo}-${id}`);
  const file = input.files[0];

  if (!file) {
    alert(`Selecciona una imagen de ${tipo} para describir.`);
    return;
  }

  const formData = new FormData();
  formData.append("imagen", file);
  formData.append("tipo", tipo);

  fetch("/subir_imagen/", {
    method: "POST",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      "X-CSRFToken": getCookie("csrftoken")
    },
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert("Error: " + data.error);
        return;
      }
      document.getElementById(`preview-${tipo}-${id}`).src = data.imagen_url;
      document.getElementById(`descripcion-${tipo}-${id}`).textContent = data.descripcion;
      document.getElementById(`resultado-general-${id}`).style.display = "flex";
    })
    .catch(() => {
      alert("Ocurrió un error al generar la descripción.");
    });
}

function eliminarImagen(id, tipo) {
  document.getElementById(`preview-${tipo}-${id}`).src = "";
  document.getElementById(`descripcion-${tipo}-${id}`).textContent = "";
  document.getElementById(`file-${tipo}-${id}`).value = "";

  const img1 = document.getElementById(`preview-afloramiento-${id}`).src;
  const img2 = document.getElementById(`preview-roca-${id}`).src;

  if ((!img1 || img1.endsWith('/')) && (!img2 || img2.endsWith('/'))) {
    document.getElementById(`resultado-general-${id}`).style.display = "none";
  }
}

function generarObjetivos() {
  const titulo = document.getElementById("titulo-proyecto").value;

  if (!titulo.trim()) {
    alert("Por favor ingrese un título de proyecto.");
    return;
  }

  fetch('/generar-objetivos/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    },
    body: JSON.stringify({ titulo: titulo })
  })
  .then(response => response.json())
  .then(data => {
    if (data.objetivos) {
      document.getElementById("texto-objetivos").textContent = data.objetivos;
      document.getElementById("resultado-objetivos").style.display = "block";
    } else {
      alert("Error al generar objetivos.");
      console.error(data);
    }
  })
  .catch(error => {
    alert("Error de red al generar objetivos.");
    console.error(error);
  });
}

function generarResultadoGeneral() {
  const contenedor = document.getElementById("contenedor");
  const bloques = contenedor.querySelectorAll(".bloque");

  if (bloques.length === 0) {
    alert("No hay datos para generar resultados.");
    return;
  }

  // Mostrar barra de progreso desde 0%
  const barra = document.getElementById("barra-progreso");
  const textoBarra = document.getElementById("barra-progreso-texto");
  const contenedorBarra = document.getElementById("barra-progreso-contenedor");

  barra.style.width = "0%";
  textoBarra.textContent = "Generando informe... 0%";
  contenedorBarra.style.display = "block";

  let progreso = 0;
  const intervalo = setInterval(() => {
    if (progreso < 90) {
      progreso += Math.random() * 5; // Simula progreso hasta 90%
      barra.style.width = `${progreso}%`;
      textoBarra.textContent = `Generando informe... ${Math.floor(progreso)}%`;
    } else {
      clearInterval(intervalo);
    }
  }, 300);

  const datosGenerales = [];

  bloques.forEach(bloque => {
    const id = bloque.id.split("-")[1]; // Obtiene el número del bloque (ej: "bloque-1" → "1")

    // Extracción de datos con los nombres de campos actualizados
    const bloqueData = {
      [`sistema_ref_${id}`]: bloque.querySelector(`select[name='sistema_ref_${id}']`).value,
      [`x_${id}`]: bloque.querySelector(`input[name='x_${id}']`).value,
      [`y_${id}`]: bloque.querySelector(`input[name='y_${id}']`).value,
      [`z_${id}`]: bloque.querySelector(`input[name='z_${id}']`).value,
      [`tipo_roca_${id}`]: bloque.querySelector(`select[name='tipo_roca_${id}']`).value,
      [`roca_${id}`]: bloque.querySelector(`input[name='roca_${id}']`).value,
      [`calidad_${id}`]: bloque.querySelector(`select[name='calidad_${id}']`).value,
      [`matriz_${id}`]: bloque.querySelector(`input[name='matriz_${id}']`).value,
      [`textura_${id}`]: bloque.querySelector(`input[name='textura_${id}']`).value,
      [`mineralogia_${id}`]: bloque.querySelector(`input[name='mineralogia_${id}']`).value,
      [`grano_${id}`]: bloque.querySelector(`select[name='grano_${id}']`).value,
      [`descripcion_afloramiento_${id}`]: bloque.querySelector(`#descripcion-afloramiento-${id}`)?.textContent || "",
      [`descripcion_roca_${id}`]: bloque.querySelector(`#descripcion-roca-${id}`)?.textContent || ""
    };

    // Procesamiento de familias de discontinuidades
    const familias = [];
    const tbody = bloque.querySelector(`#tabla-${id} tbody`);
    if (tbody) {
      tbody.querySelectorAll("tr").forEach(tr => {
        const celdas = tr.querySelectorAll("input[type='text']");
        familias.push({
          numero: celdas[0]?.value || "",
          orientacion: celdas[1]?.value || "",
          ucs: celdas[2]?.value || "",
          rqd: celdas[3]?.value || "",
          espaciamiento: celdas[4]?.value || "",
          continuidad: celdas[5]?.value || "",
          apertura: celdas[6]?.value || "",
          rugosidad: celdas[7]?.value || "",
          relleno: celdas[8]?.value || "",
          alteracion: celdas[9]?.value || "",
          aguaFreatica: celdas[10]?.value || ""
        });
      });
    }

    // Añadir las familias al bloque con el formato correcto
    familias.forEach((familia, index) => {
      bloqueData[`tabla-${id}-${index}`] = familia;
    });

    datosGenerales.push(bloqueData);
  });

  fetch("/generar_resultado/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken")
    },
    body: JSON.stringify({ bloques: datosGenerales })
  })
    .then(res => res.json())
    .then(data => {
      clearInterval(intervalo);
      barra.style.width = "100%";
      textoBarra.textContent = "Informe generado 100% ✅";

      if (data.error) {
        alert("Error: " + data.error);
        return;
      }

      // Mostrar los resultados en las secciones correspondientes
      document.getElementById("texto-general").textContent = data.resultado || "No se recibió texto.";
      document.getElementById("resultado-texto-general").style.display = "block";

      document.getElementById("texto-discusion").textContent = data.discusion || "No se recibió texto para la discusión.";
      document.getElementById("resultado-discusion").style.display = "block";

      document.getElementById("texto-conclusiones").textContent = data.conclusiones || "No se recibió texto para las conclusiones.";
      document.getElementById("resultado-conclusiones").style.display = "block";

      // Desplazamiento suave a la sección de resultados
      document.getElementById("resultado-texto-general").scrollIntoView({ behavior: "smooth" });
    })
    .catch((error) => {
      clearInterval(intervalo);
      textoBarra.textContent = "Error al generar informe ❌";
      barra.style.background = "#f44336";
      console.error("Error al generar resultados:", error);
      alert("Error al generar resultados generales. Ver consola para más detalles.");
    });
}

function editarTexto(seccion, boton) {
  let contenedorId = "";

  if (seccion === "general") {
    contenedorId = "resultado-texto-general";
  } else if (seccion === "discusion") {
    contenedorId = "resultado-discusion";
  } else if (seccion === "conclusiones") {
    contenedorId = "resultado-conclusiones";
  } else if (seccion === "objetivos") {
    contenedorId = "resultado-objetivos";
  } else {
    console.warn("Sección no reconocida:", seccion);
    return;
  }

  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  const textarea = contenedor.querySelector("textarea");
  const textoDiv = contenedor.querySelector(`#texto-${seccion}`);

  if (!textarea) {
    if (!textoDiv) return;

    const nuevoTextarea = document.createElement("textarea");
    nuevoTextarea.value = textoDiv.textContent;
    nuevoTextarea.style.width = "100%";
    nuevoTextarea.style.height = "150px";

    contenedor.replaceChild(nuevoTextarea, textoDiv);
    boton.textContent = "Guardar";
  } else {
    const nuevoTexto = textarea.value.trim() || "(vacío)";
    const nuevoDiv = document.createElement("div");
    nuevoDiv.id = `texto-${seccion}`;
    nuevoDiv.textContent = nuevoTexto;

    contenedor.replaceChild(nuevoDiv, textarea);
    boton.textContent = "Editar";

    // Aquí puedes enviar el texto editado al backend si lo deseas
  }
}

