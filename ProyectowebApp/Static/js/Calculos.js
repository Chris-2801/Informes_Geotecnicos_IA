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
  const variable = variableSelect ? variableSelect.value : null;
  if (!variable) return;

  const valores = [];
  document.querySelectorAll(`#tabla-${id} tbody tr`).forEach(tr => {
    const input = tr.querySelector(`input[name="${variable}[]"]`);
    if (input) {
      const val = parseFloat(input.value);
      if (!isNaN(val)) valores.push(val);
    }
  });

  const ctx = document.getElementById(`histograma-${id}`).getContext("2d");

  if (ctx.chart) {
    ctx.chart.destroy();
  }

  ctx.chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: valores.map((_, i) => `F${i + 1}`),
      datasets: [{
        label: variableSelect.options[variableSelect.selectedIndex].text,
        data: valores,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function generarEstereogramaYGraficos(id) {
  generarEstereogramaIndividual(id);
  // La generación de gráficos ya se llama dentro de generarEstereogramaIndividual
}

