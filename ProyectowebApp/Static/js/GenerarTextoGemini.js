let contador = 1;

function añadirBloque() {
  const contenedor = document.getElementById("contenedor");

  const div = document.createElement("div");
  div.className = "bloque";
  div.id = `bloque-${contador}`;

  div.innerHTML = `
    <h3>Afloramiento ${contador}</h3>
    <div class="flex">
      <div class="columna">
        <div class="form-group"><label>Sistema de referencia</label>
          <select name="sistema_ref">
            <option value="WGS84">WGS84</option>
            <option value="UTM">UTM</option>
            <option value="PSAD56">PSAD56</option>
          </select>
        </div>
        <div class="form-group"><label>Coordenada X</label><input type="text" name="x"></div>
        <div class="form-group"><label>Coordenada Y</label><input type="text" name="y"></div>
        <div class="form-group"><label>Coordenada Z</label><input type="text" name="z"></div>
        <div class="form-group"><label>Calidad de la roca</label><input type="text" name="calidad"></div>

        <div class="acciones">
          <input id="file-afloramiento-${contador}" type="file" accept="image/*">
          <button onclick="generarTexto(${contador}, 'afloramiento')">Generar descripción</button>
          <button onclick="eliminarImagen(${contador}, 'afloramiento')" class="eliminar">Eliminar afloramiento</button>
        </div>
      </div>

      <div class="columna">
        <div class="form-group"><label>Roca</label><input type="text" name="roca"></div>
        <div class="form-group"><label>Matriz</label><input type="text" name="matriz"></div>
        <div class="form-group"><label>Textura</label><input type="text" name="textura"></div>
        <div class="form-group"><label>Mineralogía</label><input type="text" name="mineralogia"></div>
        <div class="form-group"><label>Tamaño de grano</label><input type="text" name="grano"></div>

        <div class="acciones">
          <input id="file-roca-${contador}" type="file" accept="image/*">
          <button onclick="generarTexto(${contador}, 'roca')">Generar descripción</button>
          <button onclick="eliminarImagen(${contador}, 'roca')" class="eliminar">Eliminar roca</button>
        </div>
      </div>
    </div>

    <div class="resultado-general" id="resultado-general-${contador}" style="display:none; margin-top:10px;">
      <div class="resultado-individual" style="display:inline-block; width:48%; vertical-align:top;">
        <img id="preview-afloramiento-${contador}" src="" alt="" style="max-width: 100%; border: 1px solid #ccc;"/>
        <div class="descripcion" id="descripcion-afloramiento-${contador}"></div>
      </div>
      <div class="resultado-individual" style="display:inline-block; width:48%; vertical-align:top;">
        <img id="preview-roca-${contador}" src="" alt="" style="max-width: 100%; border: 1px solid #ccc;"/>
        <div class="descripcion" id="descripcion-roca-${contador}"></div>
      </div>
    </div>

    <div class="tabla-dinamica-container" style="margin-top:20px;">
      <h4>Familias para Afloramiento ${contador}</h4>
      <button class="btn-agregar-fila" onclick="agregarFila(${contador})">Añadir Familia</button>
      <table id="tabla-${contador}">
        <thead>
          <tr>
            <th>Nº</th>
            <th>Orientación</th>
            <th>Espaciamiento</th>
            <th>Apertura</th>
            <th>Continuidad</th>
            <th>Relleno</th>
            <th>Seepage</th>
            <th>Rugosidad</th>
            <th>Meteorización</th>
            <th>Resistencia</th>
            <th>Eliminar</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>

      <div style="margin-top:10px; text-align:center; display:flex; justify-content: space-between; gap: 10px;">
        <button onclick="generarEstereogramaYGraficos(${contador})" style="font-size:14px; padding:6px 12px; flex: 1;">
          Generar Estereograma
        </button>

        <div style="flex: 1;">
          <label for="variable-${contador}">Variable:</label>
          <select id="variable-${contador}" onchange="generarGraficos(${contador})" style="width: 100%;">
            <option value="espaciamiento_${contador}">Espaciamiento</option>
            <option value="apertura_${contador}">Apertura</option>
            <option value="continuidad_${contador}">Continuidad</option>
            <option value="relleno_${contador}">Relleno</option>
            <option value="seepage_${contador}">Seepage</option>
            <option value="rugosidad_${contador}">Rugosidad</option>
            <option value="meteorizacion_${contador}">Meteorización</option>
            <option value="resistencia_${contador}">Resistencia</option>
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
  `;

  contenedor.appendChild(div);
  setTimeout(() => agregarFila(contador), 100);
  contador++;
}

function agregarFila(id) {
  const tbody = document.querySelector(`#tabla-${id} tbody`);
  const num = tbody.children.length + 1;
  const fila = document.createElement("tr");
  fila.innerHTML = `
    <td><input type="text" value="${num}" readonly></td>
    <td><input type="text" name="orientacion_${id}[]"></td>
    <td><input type="text" name="espaciamiento_${id}[]"></td>
    <td><input type="text" name="apertura_${id}[]"></td>
    <td><input type="text" name="continuidad_${id}[]"></td>
    <td><input type="text" name="relleno_${id}[]"></td>
    <td><input type="text" name="seepage_${id}[]"></td>
    <td><input type="text" name="rugosidad_${id}[]"></td>
    <td><input type="text" name="meteorizacion_${id}[]"></td>
    <td><input type="text" name="resistencia_${id}[]"></td>
    <td><button onclick="eliminarFila(this)">X</button></td>
  `;
  tbody.appendChild(fila);
}

function eliminarFila(btn) {
  btn.closest("tr").remove();
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

function generarResultadoGeneral() {
  const contenedor = document.getElementById("contenedor");
  const bloques = contenedor.querySelectorAll(".bloque");

  if (bloques.length === 0) {
    alert("No hay datos para generar resultados.");
    return;
  }

  const datosGenerales = [];

  bloques.forEach(bloque => {
    const id = bloque.id.split("-")[1];

    const sistema_ref = bloque.querySelector("select[name='sistema_ref']").value;
    const x = bloque.querySelector("input[name='x']").value;
    const y = bloque.querySelector("input[name='y']").value;
    const z = bloque.querySelector("input[name='z']").value;
    const calidad = bloque.querySelector("input[name='calidad']").value;
    const descripcion_afloramiento = bloque.querySelector(`#descripcion-afloramiento-${id}`).textContent;

    const roca = bloque.querySelector("input[name='roca']").value;
    const matriz = bloque.querySelector("input[name='matriz']").value;
    const textura = bloque.querySelector("input[name='textura']").value;
    const mineralogia = bloque.querySelector("input[name='mineralogia']").value;
    const grano = bloque.querySelector("input[name='grano']").value;
    const descripcion_roca = bloque.querySelector(`#descripcion-roca-${id}`).textContent;

    const familias = [];
    const tbody = bloque.querySelector(`#tabla-${id} tbody`);
    if (tbody) {
      tbody.querySelectorAll("tr").forEach(tr => {
        const celdas = tr.querySelectorAll("input[type='text']");
        familias.push({
          numero: celdas[0]?.value || "",
          orientacion: celdas[1]?.value || "",
          espaciamiento: celdas[2]?.value || "",
          apertura: celdas[3]?.value || "",
          continuidad: celdas[4]?.value || "",
          relleno: celdas[5]?.value || "",
          seepage: celdas[6]?.value || "",
          rugosidad: celdas[7]?.value || "",
          meteorizacion: celdas[8]?.value || "",
          resistencia: celdas[9]?.value || ""
        });
      });
    }

    datosGenerales.push({
      id,
      sistema_ref,
      coordenadas: { x, y, z },
      calidad,
      descripcion_afloramiento,
      roca,
      matriz,
      textura,
      mineralogia,
      grano,
      descripcion_roca,
      familias
    });
  });

  fetch("/generar_resultado/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken")
    },
    body: JSON.stringify({
      bloques: datosGenerales,
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert("Error: " + data.error);
        return;
      }

      // Actualizar solo textos de resultados, discusión, conclusiones, sin afectar objetivos
      const contenedorResultado = document.getElementById("resultado-texto-general");
      const textoGeneral = document.getElementById("texto-general");
      textoGeneral.textContent = data.resultado || "No se recibió texto.";
      contenedorResultado.style.display = "block";

      const contenedorDiscusion = document.getElementById("resultado-discusion");
      const textoDiscusion = document.getElementById("texto-discusion");
      textoDiscusion.textContent = data.discusion || "No se recibió texto para la discusión.";
      contenedorDiscusion.style.display = "block";

      const contenedorConclusiones = document.getElementById("resultado-conclusiones");
      const textoConclusiones = document.getElementById("texto-conclusiones");
      textoConclusiones.textContent = data.conclusiones || "No se recibió texto para las conclusiones.";
      contenedorConclusiones.style.display = "block";

      contenedorResultado.scrollIntoView({ behavior: "smooth" });
    })
    .catch(() => {
      alert("Error al generar resultados generales.");
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
