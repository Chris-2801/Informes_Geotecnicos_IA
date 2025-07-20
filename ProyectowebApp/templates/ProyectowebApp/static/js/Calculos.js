// --- ESTEREOGRAMA Y GRÁFICOS DE BARRAS DE LAS DISCONTINUIDADES ---

function generarEstereogramaIndividual(id) {
  const bloque = document.getElementById(`bloque-${id}`);
  const orientaciones = [];

  bloque.querySelectorAll(`input[name="orientacion_${id}[]"]`).forEach(input => {
    const valor = input.value.trim();
    if (valor !== "" && /^\d{1,3}\/\d{1,2}$/.test(valor)) {
      orientaciones.push(valor);
    }
  });

  if (orientaciones.length === 0) {
    alert(`No hay orientaciones válidas para el afloramiento ${id}.`);
    return;
  }

  fetch("/generar_estereograma/", {  // URL backend para estereogramas
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken")
    },
    body: JSON.stringify({ bloques: [{ id: id.toString(), orientaciones }] })
  })
    .then(res => res.json())
    .then(data => {
      if (data.imagenes && data.imagenes[id]) {
        const img = document.getElementById(`estereograma-img-${id}`);
        img.src = data.imagenes[id];
        img.style.display = "block";
        document.getElementById(`estereograma-container-${id}`).style.display = "block";
        document.getElementById(`grafico-container-${id}`).style.display = "block";

        generarGraficos(id);

        img.scrollIntoView({ behavior: "smooth" });
      } else {
        alert(`No se pudo generar el estereograma para el afloramiento ${id}.`);
      }
    })
    .catch(() => {
      alert("Error al procesar el estereograma.");
    });
}

function generarGraficos(id) {
  const variableSelect = document.getElementById(`variable-${id}`);
  if (!variableSelect) {
    alert("Selector de variable no encontrado");
    return;
  }

  // El valor seleccionado es algo como "RQD_1"
  const valorCompleto = variableSelect.value; // Ejemplo: "RQD_1"
  if (!valorCompleto) {
    alert("Seleccione una variable para graficar");
    return;
  }

  // Separamos la variable base y el id extra del valor (dividimos por "_")
  const partes = valorCompleto.split("_");
  if (partes.length < 2) {
    alert("Formato de variable incorrecto");
    return;
  }

  const variableBase = partes[0]; // Ej: "RQD"
  const variableId = partes[1];   // Ej: "1" (pero usaremos el id que ya recibimos)

  // Mapa de opciones por variable base (igual que antes)
  const opcionesPorCampo = {
    UCS: ["<250 MPa", "250-100 MPa", "100-50 MPa", "50-25 MPa","25 -5 MPa", "5-1 MPa", "<1 MPa"],
    RQD: ["90-100%", "75-90%", "50-75%", "25-50%","<25%"],
    Espaciamiento: [">2 m", "0.6-2 m", "0.2-0.6 m", "0.06-0.2 m","<0.06 m"],
    Continuidad: ["<1 m", "1–3 m", "3–10 m", "10–20 m",">20 m"],
    Apertura: ["Nada","<0.1 mm", "0.1–1 mm", "1–5 mm", ">5 mm"],
    Rugosidad: ["Muy Rugosa", "Rugosa", "Ligeramente Rugosa", "Ondulada", "Suave"],
    Relleno: ["Sin relleno", "Relleno Duro (<5 mm)", "Relleno Duro (>5 mm)", "Relleno Blando (<5 mm)", "Relleno Blando (>5 mm)"],
    Alteracion: ["Inalterada", "Ligeramente", "Moderadamente", "Muy Alterada", "Descompuesta"],
    AguaFreatica: ["Seco", "Ligeramente Humedo", "Humedo", "Goteando", "Agua fluyendo"],
  };

  const opciones = opcionesPorCampo[variableBase];
  if (!opciones) {
    alert("Variable no reconocida: " + variableBase);
    return;
  }

  // Obtener filas de la tabla para el id dado
  const filas = document.querySelectorAll(`#tabla-${id} tbody tr`);

  const etiquetasFamilias = [];
  const valoresY = [];

  filas.forEach((fila, idx) => {
    // Buscamos el select con nombre igual a variable + "_" + id + "[]"
    const selectorNombre = `${variableBase}_${id}[]`;
    const select = fila.querySelector(`select[name="${selectorNombre}"]`);
    let valorSeleccionado = select ? select.value : "";

    // Buscar índice de la opción para graficar
    let indiceOpcion = opciones.indexOf(valorSeleccionado);
    if (indiceOpcion === -1) {
      // Si no se encontró o está vacío, asignamos null o -1 para no graficar
      indiceOpcion = null;
    }

    etiquetasFamilias.push(`Familia ${idx + 1}`);
    valoresY.push(indiceOpcion);
  });

  // Filtrar valores válidos para graficar (omitimos nulos)
  const etiquetasValidas = [];
  const valoresValidos = [];
  valoresY.forEach((val, i) => {
    if (val !== null) {
      etiquetasValidas.push(etiquetasFamilias[i]);
      valoresValidos.push(val);
    }
  });

  const ctx = document.getElementById(`histograma-${id}`).getContext("2d");

  // Si ya existe un gráfico previo, destruirlo para evitar duplicados
  if (ctx.chart) {
    ctx.chart.destroy();
  }

  ctx.chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: etiquetasValidas,
      datasets: [{
        label: variableSelect.options[variableSelect.selectedIndex].text,
        data: valoresValidos,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            // Mostrar etiquetas en eje Y según las opciones para mejor comprensión
            callback: function(value) {
              if (value >= 0 && value < opciones.length) {
                return opciones[value];
              }
              return '';
            }
          }
        }
      }
    }
  });
}

function generarEstereogramaYGraficos(id) {
  generarEstereogramaIndividual(id);
  // La generación de gráficos ya se llama dentro de generarEstereogramaIndividual
}

// --- CLASIFICACIÓN GEOMECÁNICA RMR ---

// Mapeo de opciones a valores RMR
const valoresRMR = {
      "UCS": {
        "<250 MPa": {valor: 15, descripcion: "Muy Alta Resistencia"},
        "250-100 MPa": {valor: 12, descripcion: "Alta Resistencia"},
        "100-50 MPa": {valor: 7, descripcion: "Resistencia Media-Alta"},
        "50-25 MPa": {valor: 4, descripcion: "Resistencia Media"},
        "25 -5 MPa": {valor: 2, descripcion: "Resistencia Baja"},
        "5-1 MPa": {valor: 1, descripcion: "Muy Baja Resistencia"},
        "<1 MPa": {valor: 0, descripcion: "Extremadamente Baja"}
      },
      "RQD": {
        "90-100%": {valor: 20, descripcion: "Excelente"},
        "75-90%": {valor: 17, descripcion: "Bueno"},
        "50-75%": {valor: 13, descripcion: "Regular"},
        "25-50%": {valor: 6, descripcion: "Pobre"},
        "<25%": {valor: 3, descripcion: "Muy Pobre"}
      },
      "Espaciamiento": {
        ">2 m": {valor: 20, descripcion: "Muy Amplio"},
        "0.6-2 m": {valor: 15, descripcion: "Amplio"},
        "0.2-0.6 m": {valor: 10, descripcion: "Moderado"},
        "0.06-0.2 m": {valor: 8, descripcion: "Cerrado"},
        "<0.06 m": {valor: 5, descripcion: "Muy Cerrado"}
      },
      "Continuidad": {
        "<1 m": {valor: 6, descripcion: "Muy Corta"},
        "1–3 m": {valor: 4, descripcion: "Corta"},
        "3–10 m": {valor: 2, descripcion: "Media"},
        "10–20 m": {valor: 1, descripcion: "Larga"},
        ">20 m": {valor: 0, descripcion: "Muy Larga"}
      },
      "Apertura": {
        "Nada": {valor: 6, descripcion: "Cerrada"},
        "<0.1 mm": {valor: 5, descripcion: "Muy Estrecha"},
        "0.1–1 mm": {valor: 3, descripcion: "Estrecha"},
        "1–5 mm": {valor: 1, descripcion: "Moderadamente Abierta"},
        ">5 mm": {valor: 0, descripcion: "Muy Abierta"}
      },
      "Rugosidad": {
        "Muy Rugosa": {valor: 6, descripcion: "Muy Rugosa"},
        "Rugosa": {valor: 5, descripcion: "Rugosa"},
        "Ligeramente Rugosa": {valor: 3, descripcion: "Ligeramente Rugosa"},
        "Ondulada": {valor: 1, descripcion: "Ondulada"},
        "Suave": {valor: 0, descripcion: "Suave"}
      },
      "Relleno": {
        "Sin relleno": {valor: 6, descripcion: "Sin relleno"},
        "Relleno Duro (<5 mm)": {valor: 4, descripcion: "Duro y delgado"},
        "Relleno Duro (>5 mm)": {valor: 2, descripcion: "Duro y grueso"},
        "Relleno Blando (<5 mm)": {valor: 1, descripcion: "Blando y delgado"},
        "Relleno Blando (>5 mm)": {valor: 0, descripcion: "Blando y grueso"}
      },
      "Alteracion": {
        "Inalterada": {valor: 6, descripcion: "Inalterada"},
        "Ligeramente": {valor: 5, descripcion: "Ligeramente alterada"},
        "Moderadamente": {valor: 3, descripcion: "Moderadamente alterada"},
        "Muy Alterada": {valor: 1, descripcion: "Muy alterada"},
        "Descompuesta": {valor: 0, descripcion: "Descompuesta"}
      },
      "AguaFreatica": {
        "Seco": {valor: 15, descripcion: "Seco"},
        "Ligeramente Humedo": {valor: 10, descripcion: "Ligeramente Humedo"},
        "Humedo": {valor: 7, descripcion: "Humedo"},
        "Goteando": {valor: 4, descripcion: "Goteando"},
        "Agua fluyendo": {valor: 0, descripcion: "Agua fluyendo"}
      },
};

// Objeto para almacenar todos los datos por afloramiento
const datosCompletosPorAfloramiento = {};
function actualizarDatosAfloramiento(id, selectElement) {
  const fila = selectElement.closest('tr');
  const parametro = selectElement.getAttribute('data-parametro') || selectElement.name.split('_')[0];
  const valorSeleccionado = selectElement.value;
  const filaIndex = Array.from(fila.parentNode.children).indexOf(fila);

  // Inicializar estructura si no existe
  if (!datosCompletosPorAfloramiento[id]) {
    datosCompletosPorAfloramiento[id] = {
      valoresRMR: [],
      datosFilas: []
    };
  }

  // Obtener o crear datos de la fila
  let datosFila = datosCompletosPorAfloramiento[id].datosFilas[filaIndex] || {
    familia: filaIndex + 1,
    orientacion: fila.querySelector('input[name^="orientacion"]').value,
    valores: {},
    valoresNumericos: {},
    rmr: 0
  };

  // Actualizar valores
  datosFila.valores[parametro] = valorSeleccionado;
  
  // Calcular valor numérico
  if (valoresRMR[parametro] && valoresRMR[parametro][valorSeleccionado]) {
    datosFila.valoresNumericos[parametro] = valoresRMR[parametro][valorSeleccionado].valor;
  }

  // Recalcular RMR total
  datosFila.rmr = Object.values(datosFila.valoresNumericos).reduce((sum, val) => sum + val, 0);

  // Guardar datos actualizados
  datosCompletosPorAfloramiento[id].datosFilas[filaIndex] = datosFila;
  datosCompletosPorAfloramiento[id].valoresRMR = datosCompletosPorAfloramiento[id].datosFilas
    .filter(f => f !== undefined)
    .map(f => f.rmr);

  // Actualizar interfaz
  actualizarTablaDetalleRMR(id);
  mostrarSeccionAnalisisRMR();
  mostrarSeccionAnalisisSMR();
  actualizarSelectorAfloramientos();

  // Depuración
  console.log(`Actualizado - Afloramiento ${id}, Familia ${filaIndex + 1}:`, {
    parametro,
    valor: valorSeleccionado,
    puntos: datosFila.valoresNumericos[parametro],
    rmrTotal: datosFila.rmr
  });
}

function actualizarTablaDetalleRMR(afloramientoId) {
  const cuerpo = document.getElementById('cuerpo-detalle-rmr');
  // Limpiar filas existentes para este afloramiento
  document.querySelectorAll(`#cuerpo-detalle-rmr tr[data-afloramiento="${afloramientoId}"]`).forEach(row => row.remove());
  
  const afloramiento = datosCompletosPorAfloramiento[afloramientoId];
  
  afloramiento.datosFilas.forEach((fila, index) => {
    if (fila) {
      const filaHTML = document.createElement('tr');
      filaHTML.setAttribute('data-afloramiento', afloramientoId);
      
      // Lista de todos los parámetros en el orden correcto para la tabla
      const parametros = [
        'UCS', 'RQD', 'Espaciamiento', 'Continuidad', 
        'Apertura', 'Rugosidad', 'Relleno', 'Alteracion', 'AguaFreatica'
      ];
      
      let celdasHTML = `
        <td>Afloramiento ${afloramientoId}</td>
        <td>${fila.familia}</td>
      `;
      
      // Generar celdas para cada parámetro (valor y puntos)
      parametros.forEach(param => {
        celdasHTML += `
          <td>${fila.valores[param] || '-'}</td>
          <td>${fila.valoresNumericos[param] || '-'}</td>
        `;
      });
      
      // Añadir celda del total RMR
      celdasHTML += `<td class="valor-rmr">${fila.rmr}</td>`;
      
      filaHTML.innerHTML = celdasHTML;
      cuerpo.appendChild(filaHTML);
    }
  });
}

function actualizarSelectorAfloramientos() {
      const selector = document.getElementById('selector-afloramiento');
      // Guardar selección actual
      const seleccionActual = selector.value;
      
      // Limpiar opciones excepto la primera
      while (selector.options.length > 1) {
        selector.remove(1);
      }
      
      // Añadir opciones para cada afloramiento con datos
      Object.keys(datosCompletosPorAfloramiento).forEach(id => {
        if (datosCompletosPorAfloramiento[id].valoresRMR.length > 0) {
          const option = document.createElement('option');
          option.value = id;
          option.textContent = `Afloramiento ${id}`;
          selector.appendChild(option);
        }
      });
      
      // Restaurar selección anterior si sigue disponible
      if (seleccionActual && selector.querySelector(`option[value="${seleccionActual}"]`)) {
        selector.value = seleccionActual;
      }
 }

function mostrarSeccionAnalisisRMR() {
      const seccionAnalisis = document.getElementById('analisis-rmr');
      const afloramientosConDatos = Object.values(datosCompletosPorAfloramiento)
        .filter(a => a.valoresRMR.length > 0).length;
      
      if (afloramientosConDatos > 0) {
        seccionAnalisis.style.display = 'block';
      } else {
        seccionAnalisis.style.display = 'none';
      }
 }

function calcularEstadisticasRMR() {
      // Obtener el afloramiento seleccionado
      const selector = document.getElementById('selector-afloramiento');
      const afloramientoId = selector.value;
      
      // Calcular estadísticas según la selección
      if (afloramientoId === 'todos') {
        calcularEstadisticasGlobales();
      } else {
        calcularEstadisticasPorAfloramiento(afloramientoId);
      }
}

function calcularEstadisticasGlobales() {
      // Recopilar todos los valores RMR de todos los afloramientos
      let todosValoresRMR = [];
      Object.values(datosCompletosPorAfloramiento).forEach(afloramiento => {
        todosValoresRMR = todosValoresRMR.concat(afloramiento.valoresRMR);
      });
      
      if (todosValoresRMR.length === 0) {
        alert('No hay datos RMR para calcular estadísticas');
        return;
      }
      
      // Calcular y mostrar estadísticas
      mostrarEstadisticasRMR(todosValoresRMR);
      
      // Generar gráfico con todos los datos
      generarGraficoRMR('todos');
}

function calcularEstadisticasPorAfloramiento(afloramientoId) {
      const afloramiento = datosCompletosPorAfloramiento[afloramientoId];
      
      if (!afloramiento || afloramiento.valoresRMR.length === 0) {
        alert('No hay datos RMR para este afloramiento');
        return;
      }
      
      // Calcular y mostrar estadísticas
      mostrarEstadisticasRMR(afloramiento.valoresRMR);
      
      // Generar gráfico para este afloramiento
      generarGraficoRMR(afloramientoId);
}

function actualizarEstadisticasPorAfloramiento() {
      // Esta función se llama cuando cambia el selector
      calcularEstadisticasRMR();
}

function mostrarEstadisticasRMR(valoresRMR) {
      // Ordenar valores para cálculos
      valoresRMR.sort((a, b) => a - b);
      
      // Calcular estadísticas
      const promedio = calcularPromedio(valoresRMR);
      const mediana = calcularMediana(valoresRMR);
      const moda = calcularModa(valoresRMR);
      const maximo = Math.max(...valoresRMR);
      const minimo = Math.min(...valoresRMR);
      const desviacion = calcularDesviacionEstandar(valoresRMR);
      
      // Mostrar resultados
      document.getElementById('promedio-rmr').textContent = promedio.toFixed(2);
      document.getElementById('mediana-rmr').textContent = mediana.toFixed(2);
      document.getElementById('moda-rmr').textContent = moda.join(', ');
      document.getElementById('maximo-rmr').textContent = maximo;
      document.getElementById('minimo-rmr').textContent = minimo;
      document.getElementById('desviacion-rmr').textContent = desviacion.toFixed(2);
      
      // Resaltar clasificación RMR
      resaltarClasificacionRMR(promedio);
}

function resaltarClasificacionRMR(valorRMR) {
      // Resetear todas las clases
      document.querySelectorAll('.tabla-clasificacion-rmr tr').forEach(tr => {
        tr.classList.remove('clasificacion-activa');
      });
      
      // Determinar clasificación
      let claseActiva = '';
      if (valorRMR >= 81) claseActiva = 'clase1';
      else if (valorRMR >= 61) claseActiva = 'clase2';
      else if (valorRMR >= 41) claseActiva = 'clase3';
      else if (valorRMR >= 21) claseActiva = 'clase4';
      else claseActiva = 'clase5';
      
      // Resaltar fila correspondiente
      document.getElementById(claseActiva).classList.add('clasificacion-activa');
    }

function generarGraficoRMR(afloramientoId) {
      const ctx = document.getElementById('grafico-rmr').getContext('2d');
      
      // Preparar datos para el gráfico
      let labels, datos;
      
      if (afloramientoId === 'todos') {
        // Gráfico para todos los afloramientos
        labels = Object.keys(datosCompletosPorAfloramiento)
          .filter(id => datosCompletosPorAfloramiento[id].valoresRMR.length > 0)
          .map(id => `Afloramiento ${id}`);
          
        datos = labels.map(label => {
          const id = label.replace('Afloramiento ', '');
          const valores = datosCompletosPorAfloramiento[id].valoresRMR;
          return valores.length > 0 ? calcularPromedio(valores) : 0;
        });
      } else {
        // Gráfico para un afloramiento específico (por familia)
        const afloramiento = datosCompletosPorAfloramiento[afloramientoId];
        labels = afloramiento.datosFilas
          .filter(f => f !== undefined)
          .map(f => `Familia ${f.familia}`);
          
        datos = afloramiento.valoresRMR;
      }
      
      // Destruir gráfico anterior si existe
      if (window.graficoRMR) {
        window.graficoRMR.destroy();
      }
      
      // Crear nuevo gráfico
      window.graficoRMR = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: afloramientoId === 'todos' ? 'Valor RMR Promedio por Afloramiento' : 'Valor RMR por Familia',
            data: datos,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Valor RMR'
              },
              max: 100
            },
            x: {
              title: {
                display: true,
                text: afloramientoId === 'todos' ? 'Afloramientos' : 'Familias'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: afloramientoId === 'todos' 
                ? 'Distribución de Valores RMR por Afloramiento' 
                : `Distribución de Valores RMR en Afloramiento ${afloramientoId}`
            },
            tooltip: {
              callbacks: {
                afterLabel: function(context) {
                  if (afloramientoId === 'todos') {
                    const id = context.label.replace('Afloramiento ', '');
                    const valores = datosCompletosPorAfloramiento[id].valoresRMR;
                    return `Mín: ${Math.min(...valores)}\nMáx: ${Math.max(...valores)}`;
                  } else {
                    return `RMR Total: ${context.raw}`;
                  }
                }
              }
            }
          }
        }
      });
    }

function calcularPromedio(valores) {
      return valores.reduce((a, b) => a + b, 0) / valores.length;
    }

function calcularMediana(valores) {
      const mitad = Math.floor(valores.length / 2);
      return valores.length % 2 !== 0 
        ? valores[mitad] 
        : (valores[mitad - 1] + valores[mitad]) / 2;
    }

function calcularModa(valores) {
      const frecuencia = {};
      let maxFrecuencia = 0;
      const modas = [];
      
      valores.forEach(valor => {
        frecuencia[valor] = (frecuencia[valor] || 0) + 1;
        if (frecuencia[valor] > maxFrecuencia) {
          maxFrecuencia = frecuencia[valor];
        }
      });
      
      for (const valor in frecuencia) {
        if (frecuencia[valor] === maxFrecuencia) {
          modas.push(parseInt(valor));
        }
      }
      
      return modas;
    }

function calcularDesviacionEstandar(valores) {
      const promedio = calcularPromedio(valores);
      const diferenciasCuadradas = valores.map(valor => Math.pow(valor - promedio, 2));
      const varianza = calcularPromedio(diferenciasCuadradas);
      return Math.sqrt(varianza);
}

// --- CLASIFICACIÓN SMR ---

function mostrarSeccionAnalisisSMR() {
  const seccion = document.getElementById('analisis-smr');
  const hayDatos = Object.keys(datosCompletosPorAfloramiento).length > 0;
  
  if (hayDatos) {
    seccion.style.display = 'block';
    actualizarSelectorSMR();
    actualizarTablaFactoresSMR();
  } else {
    seccion.style.display = 'none';
  }
}

// Actualizar selector de afloramientos para SMR
function actualizarSelectorSMR() {
  const selector = document.getElementById('selector-afloramiento-smr');
  const seleccionActual = selector.value;
  
  // Limpiar y repoblar opciones
  selector.innerHTML = '<option value="todos">Todos los Afloramientos</option>';
  
  Object.keys(datosCompletosPorAfloramiento).forEach(id => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = `Afloramiento ${id}`;
    selector.appendChild(option);
  });
  
  // Restaurar selección si existe
  if (seleccionActual && selector.querySelector(`option[value="${seleccionActual}"]`)) {
    selector.value = seleccionActual;
  }
}

// Actualizar tabla de factores SMR
function actualizarTablaFactoresSMR() {
  const cuerpo = document.getElementById('cuerpo-factores-smr');
  cuerpo.innerHTML = '';
  
  const afloramientoId = document.getElementById('selector-afloramiento-smr').value;
  
  if (afloramientoId === 'todos') {
    // Mostrar todas las familias de todos los afloramientos
    Object.keys(datosCompletosPorAfloramiento).forEach(id => {
      datosCompletosPorAfloramiento[id].datosFilas.forEach(fila => {
        if (fila) agregarFilaSMR(id, fila);
      });
    });
  } else {
    // Mostrar solo el afloramiento seleccionado
    if (datosCompletosPorAfloramiento[afloramientoId]) {
      datosCompletosPorAfloramiento[afloramientoId].datosFilas.forEach(fila => {
        if (fila) agregarFilaSMR(afloramientoId, fila);
      });
    }
  }
}

// Agregar fila para una familia en la tabla SMR
function agregarFilaSMR(afloramientoId, datosFila) {
  const cuerpo = document.getElementById('cuerpo-factores-smr');
  const fila = document.createElement('tr');
  
  fila.innerHTML = `
    <td>Afloramiento ${afloramientoId}</td>
    <td>Familia ${datosFila.familia}</td>
    <td>
      <input type="number" min="0" max="0.85" step="0.01" value="${datosFila.factoresSMR?.F1 || ''}" 
             onchange="actualizarFactorSMR('${afloramientoId}', ${datosFila.familia}, 'F1', this.value)">
    </td>
    <td>
      <input type="number" min="0.15" max="1" step="0.01" value="${datosFila.factoresSMR?.F2 || ''}" 
             onchange="actualizarFactorSMR('${afloramientoId}', ${datosFila.familia}, 'F2', this.value)">
    </td>
    <td>
      <input type="number" min="0" max="0.75" step="0.01" value="${datosFila.factoresSMR?.F3 || ''}" 
             onchange="actualizarFactorSMR('${afloramientoId}', ${datosFila.familia}, 'F3', this.value)">
    </td>
    <td>
      <input type="number" min="-60" max="0" step="1" value="${datosFila.factoresSMR?.F4 || ''}" 
             onchange="actualizarFactorSMR('${afloramientoId}', ${datosFila.familia}, 'F4', this.value)">
    </td>
    <td>${datosFila.rmr}</td>
    <td>${datosFila.smr !== undefined ? datosFila.smr.toFixed(2) : '-'}</td>
  `;
  
  cuerpo.appendChild(fila);
}

// Actualizar un factor SMR y recalcular
function actualizarFactorSMR(afloramientoId, familiaId, factor, valor) {
  const numValor = parseFloat(valor);
  const filaIndex = familiaId - 1;
  
  if (!datosCompletosPorAfloramiento[afloramientoId]?.datosFilas[filaIndex]) return;
  
  const datosFila = datosCompletosPorAfloramiento[afloramientoId].datosFilas[filaIndex];
  
  // Inicializar factores si no existen
  if (!datosFila.factoresSMR) {
    datosFila.factoresSMR = { F1: null, F2: null, F3: null, F4: null };
  }
  
  // Actualizar factor
  datosFila.factoresSMR[factor] = isNaN(numValor) ? null : numValor;
  
  // Recalcular SMR si todos los factores están completos
  recalcularSMR(afloramientoId, familiaId);
  
  // Actualizar visualización
  actualizarTablaFactoresSMR();
}

// Recalcular SMR para una familia específica
function recalcularSMR(afloramientoId, familiaId) {
  const filaIndex = familiaId - 1;
  const datosFila = datosCompletosPorAfloramiento[afloramientoId].datosFilas[filaIndex];
  
  const { F1, F2, F3, F4 } = datosFila.factoresSMR || {};
  
  if (F1 !== null && F2 !== null && F3 !== null && F4 !== null) {
    datosFila.smr = datosFila.rmr + (F1 * F2 * F3) + F4;
  } else {
    datosFila.smr = undefined;
  }
}

// Función principal para calcular estadísticas SMR
function calcularEstadisticasSMR() {
  const selector = document.getElementById('selector-afloramiento-smr');
  const afloramientoId = selector.value;
  const valoresSMR = [];
  
  // Recopilar valores SMR según el ámbito seleccionado
  if (afloramientoId === 'todos') {
    Object.values(datosCompletosPorAfloramiento).forEach(afloramiento => {
      afloramiento.datosFilas.forEach(fila => {
        if (fila?.smr !== undefined) valoresSMR.push(fila.smr);
      });
    });
  } else {
    if (datosCompletosPorAfloramiento[afloramientoId]) {
      datosCompletosPorAfloramiento[afloramientoId].datosFilas.forEach(fila => {
        if (fila?.smr !== undefined) valoresSMR.push(fila.smr);
      });
    }
  }
  
  // Calcular y mostrar estadísticas
  if (valoresSMR.length > 0) {
    mostrarResultadosSMR(valoresSMR);
    generarGraficoSMR(afloramientoId, valoresSMR);
  } else {
    alert('No hay datos SMR calculados para el ámbito seleccionado');
  }
}

// Mostrar resultados estadísticos
function mostrarResultadosSMR(valores) {
  const promedio = calcularPromedio(valores);
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const desviacion = calcularDesviacionEstandar(valores);
  
  document.getElementById('promedio-smr').textContent = promedio.toFixed(2);
  document.getElementById('minimo-smr').textContent = minimo.toFixed(2);
  document.getElementById('maximo-smr').textContent = maximo.toFixed(2);
  document.getElementById('desviacion-smr').textContent = desviacion.toFixed(2);
  
  actualizarClasificacion(promedio);
}

// Actualizar clasificación de estabilidad
function actualizarClasificacion(valorSMR) {
  const clasificacion = document.getElementById('clasificacion-smr');
  let texto = '';
  let clase = '';
  
  if (valorSMR >= 81) {
    texto = 'Clase I - Muy Estable (81-100)';
    clase = 'muy-estable';
  } else if (valorSMR >= 61) {
    texto = 'Clase II - Estable (61-80)';
    clase = 'estable';
  } else if (valorSMR >= 41) {
    texto = 'Clase III - Parcialmente Estable (41-60)';
    clase = 'parcialmente-estable';
  } else if (valorSMR >= 21) {
    texto = 'Clase IV - Inestable (21-40)';
    clase = 'inestable';
  } else {
    texto = 'Clase V - Muy Inestable (0-20)';
    clase = 'muy-inestable';
  }
  
  clasificacion.innerHTML = `<span class="${clase}">${texto}</span>`;
}

// Generar gráfico SMR
function generarGraficoSMR(afloramientoId, valores) {
  const ctx = document.getElementById('grafico-smr').getContext('2d');
  
  // Destruir gráfico anterior si existe
  if (window.graficoSMR) {
    window.graficoSMR.destroy();
  }
  
  // Preparar etiquetas según el ámbito
  let labels;
  if (afloramientoId === 'todos') {
    labels = Object.keys(datosCompletosPorAfloramiento)
      .filter(id => datosCompletosPorAfloramiento[id].datosFilas.some(f => f?.smr !== undefined))
      .map(id => `Afloramiento ${id}`);
  } else {
    labels = datosCompletosPorAfloramiento[afloramientoId]?.datosFilas
      .filter(f => f?.smr !== undefined)
      .map((f, i) => `Familia ${i + 1}`) || [];
  }
  
  // Crear nuevo gráfico
  window.graficoSMR = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Valores SMR',
        data: valores,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Valor SMR'
          }
        },
        x: {
          title: {
            display: true,
            text: afloramientoId === 'todos' ? 'Afloramientos' : 'Familias'
          }
        }
      }
    }
  });
}

// Funciones auxiliares de cálculo
function calcularPromedio(valores) {
  return valores.reduce((sum, val) => sum + val, 0) / valores.length;
}