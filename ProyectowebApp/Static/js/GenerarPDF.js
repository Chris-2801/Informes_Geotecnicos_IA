// --- IMPORTAR JSPDF DESDE UMD ---
const { jsPDF } = window.jspdf;

// --- FUNCIONES AUXILIARES ---
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

function imageToBase64(imgElem) {
  return new Promise((resolve) => {
    if (!imgElem || !imgElem.src) {
      resolve(null);
      return;
    }
    if (imgElem.src.startsWith("data:image")) {
      resolve(imgElem.src);
      return;
    }
    const image = new Image();
    image.crossOrigin = "Anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => resolve(null);
    image.src = imgElem.src;
  });
}

function textoJustificado(doc, text, x, yStart, maxWidth, lineHeight) {
  const words = text.split(/\s+/);
  let lines = [], line = "";
  for (let word of words) {
    const testLine = line + word + " ";
    const testWidth = doc.getTextWidth(testLine);
    if (testWidth > maxWidth && line !== "") {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line.trim());

  let yPos = yStart;
  for (let i = 0; i < lines.length; i++) {
    if (yPos + lineHeight > doc.internal.pageSize.getHeight() - 25.4) {
      doc.addPage();
      yPos = 25.4;
    }
    let lineText = lines[i];
    const isLastLine = (i === lines.length - 1);
    const wordsInLine = lineText.split(/\s+/);
    const totalWordWidth = wordsInLine.reduce((acc, w) => acc + doc.getTextWidth(w), 0);
    const spaceCount = wordsInLine.length - 1;
    const extraSpace = spaceCount > 0 ? (maxWidth - totalWordWidth) / spaceCount : 0;
    if (isLastLine || spaceCount === 0) {
      doc.text(lineText, x, yPos);
    } else {
      let cursorX = x;
      for (let j = 0; j < wordsInLine.length; j++) {
        const w = wordsInLine[j];
        doc.text(w, cursorX, yPos);
        cursorX += doc.getTextWidth(w) + extraSpace;
      }
    }
    yPos += lineHeight;
  }
  return yPos;
}

// --- FUNCIÓN PRINCIPAL PARA GENERAR PDF ---
async function generarPDF() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marginLeft = 25.4;
  const marginRight = 25.4;
  const marginTop = 25.4;
  const marginBottom = 25.4;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - marginLeft - marginRight;
  let y = marginTop;

  function checkPageSpace(heightNeeded) {
    if (y + heightNeeded > pageHeight - marginBottom) {
      doc.addPage();
      y = marginTop;
    }
  }

  const tituloProyecto = document.getElementById("titulo-proyecto").value.trim() || "Proyecto";
  const autores = document.getElementById("autores").value.trim() || "Autor no especificado";
  const carrera = document.getElementById("carrera").value.trim() || "Carrera no especificada";
  const materia = document.getElementById("materia").value.trim() || "Materia no especificada";
  const img = new Image();
    img.src = "/static/img/Logo_UCE.png"; 
  // --- CARÁTULA ---
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("UNIVERSIDAD CENTRAL DEL ECUADOR", pageWidth / 2, 40, { align: "center" });
  doc.text("Facultad de Ingeniería en Geología, Minas, Petróleos y Ambiental", pageWidth / 2, 50, { align: "center" });
  doc.text(`CARRERA DE ${carrera}`, pageWidth / 2, 60, { align: "center" });

  doc.setFontSize(24);
  doc.text("INFORME GEOLÓGICO", pageWidth / 2, 100, { align: "center" });

  doc.setFontSize(16);
  doc.text(tituloProyecto, pageWidth / 2, 120, { align: "center" });

  doc.setFontSize(12);
  doc.text(`Materia: ${materia}`, pageWidth / 2, 140, { align: "center" });
  doc.text(`Autor(es): ${autores}`, pageWidth / 2, 150, { align: "center" });
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, pageWidth / 2, 160, { align: "center" });


  // Nueva página para el contenido principal
  doc.addPage();
  y = marginTop;

  // --- 1. INTRODUCCIÓN (RESULTADOS) ---
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text("1. Introducción", marginLeft, y);
  y += 12;

  const resultadoGeneral = document.getElementById("resultado-texto-general");
  if (resultadoGeneral && resultadoGeneral.textContent.trim() !== "") {
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    const parrafos = resultadoGeneral.textContent.trim().split("\n\n");
    for (const parrafo of parrafos) {
      y = textoJustificado(doc, parrafo.trim(), marginLeft, y, usableWidth, 7);
      y += 7;
    }
  } else {
    doc.setFont("times", "italic");
    doc.text("No hay introducción disponible.", marginLeft, y);
    y += 12;
  }

  // --- 2. OBJETIVOS ---
  checkPageSpace(20);
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text("2. Objetivos", marginLeft, y);
  y += 12;

  doc.setFont("times", "normal");
  doc.setFontSize(12);

    const resultadoObjetivo = document.getElementById("resultado-objetivos");
  if (resultadoObjetivo && resultadoObjetivo.textContent.trim() !== "") {
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    const parrafos = resultadoObjetivo.textContent.trim().split("\n\n");
    for (const parrafo of parrafos) {
      y = textoJustificado(doc, parrafo.trim(), marginLeft, y, usableWidth, 7);
      y += 7;
    }
  } else {
    doc.setFont("times", "italic");
    doc.text("No hay introducción disponible.", marginLeft, y);
    y += 12;
  }

  // --- 3. DATOS Y RESULTADOS ---
  checkPageSpace(20);
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text("3. Datos y Resultados", marginLeft, y);
  y += 12;

  const bloques = document.querySelectorAll(".bloque");
  if (bloques.length === 0) {
    alert("No hay bloques para exportar.");
    return;
  }

  // Resumen para tablas
  const resumenAfloramientos = [], resumenRocas = [];

  bloques.forEach((bloque, index) => {
    const sistema_ref = bloque.querySelector("select[name='sistema_ref']").value;
    const xCoord = bloque.querySelector("input[name='x']").value;
    const yCoord = bloque.querySelector("input[name='y']").value;
    const zCoord = bloque.querySelector("input[name='z']").value;
    const calidad = bloque.querySelector("input[name='calidad']").value;
    resumenAfloramientos.push([index + 1, sistema_ref, xCoord, yCoord, zCoord, calidad]);

    const roca = bloque.querySelector("input[name='roca']").value;
    const matriz = bloque.querySelector("input[name='matriz']").value;
    const textura = bloque.querySelector("input[name='textura']").value;
    const mineralogia = bloque.querySelector("input[name='mineralogia']").value;
    const grano = bloque.querySelector("input[name='grano']").value;
    resumenRocas.push([index + 1, roca, matriz, textura, mineralogia, grano]);
  });

  // Tabla de Afloramientos
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("3.1 Resumen de Afloramientos", marginLeft, y);
  y += 8;
  doc.autoTable({
    startY: y,
    head: [["#", "Sistema", "X", "Y", "Z", "Calidad"]],
    body: resumenAfloramientos,
    margin: { left: marginLeft, right: marginRight },
    styles: { fontSize: 11, font: "times" },
    theme: "grid",
    didDrawPage: (data) => { y = data.cursor.y + 10; }
  });

  // Tabla de Rocas
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("3.2 Resumen de Rocas", marginLeft, y);
  y += 8;
  doc.autoTable({
    startY: y,
    head: [["#", "Roca", "Matriz", "Textura", "Mineralogía", "Grano"]],
    body: resumenRocas,
    margin: { left: marginLeft, right: marginRight },
    styles: { fontSize: 11, font: "times" },
    theme: "grid",
    didDrawPage: (data) => { y = data.cursor.y + 10; }
  });

  // Detalle por bloque
  for (let index = 0; index < bloques.length; index++) {
    const bloque = bloques[index];
    const id = bloque.id.split("-")[1];

    checkPageSpace(70); // espacio estimado para título e imágenes

    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.text(`3.${index + 3} Afloramiento ${index + 1}`, marginLeft, y);
    y += 10;

    const descAf = bloque.querySelector(`#descripcion-afloramiento-${id}`).textContent.trim();
    const descRo = bloque.querySelector(`#descripcion-roca-${id}`).textContent.trim();

    doc.setFont("times", "normal");
    doc.setFontSize(12);
    y = textoJustificado(doc, descAf, marginLeft, y, usableWidth, 6) + 6;
    y = textoJustificado(doc, descRo, marginLeft, y, usableWidth, 6) + 10;

    const imgAf = bloque.querySelector(`#preview-afloramiento-${id}`);
    const imgRo = bloque.querySelector(`#preview-roca-${id}`);
    const imgEst = bloque.querySelector(`#estereograma-img-${id}`);
    const canvasHist = bloque.querySelector(`#histograma-${id}`);

    const imgWidth = 70, imgHeight = 50, espacio = 10;

    checkPageSpace(imgHeight + 20);

    const base64Af = await imageToBase64(imgAf);
    const base64Ro = await imageToBase64(imgRo);
    const base64Est = await imageToBase64(imgEst);
    const base64Hist = canvasHist ? canvasHist.toDataURL("image/png") : null;

    if (base64Af) doc.addImage(base64Af, "JPEG", marginLeft, y, imgWidth, imgHeight);
    if (base64Ro) doc.addImage(base64Ro, "JPEG", marginLeft + imgWidth + espacio, y, imgWidth, imgHeight);

    let y2 = y + imgHeight + 5;
    checkPageSpace(imgHeight + 20);

    if (base64Est) doc.addImage(base64Est, "PNG", marginLeft, y2, imgWidth, imgHeight);
    if (base64Hist) doc.addImage(base64Hist, "PNG", marginLeft + imgWidth + espacio, y2, imgWidth, imgHeight);

    doc.setFont("times", "italic");
    doc.setFontSize(11);
    doc.text(`Figura ${index + 1}. Afloramiento y Roca`, marginLeft, y + imgHeight + 5);
    doc.text(`Figura ${index + 1}. Estereograma e Histograma`, marginLeft, y2 + imgHeight + 5);

    y = y2 + imgHeight + 20;

    const tabla = bloque.querySelector(`#tabla-${id} tbody`);
    const filas = Array.from(tabla.querySelectorAll("tr")).map(tr =>
      Array.from(tr.querySelectorAll("input")).map(td => td.value)
    );

    if (filas.length > 0) {
      checkPageSpace(20);
      doc.setFont("times", "bold");
      doc.setFontSize(13);
      doc.text(`3.${index + 4} Familias para Afloramiento ${index + 1}`, marginLeft, y);
      y += 8;
      doc.autoTable({
        startY: y,
        head: [["#", "Orientación", "Espaciamiento", "Apertura", "Continuidad", "Relleno", "Seepage", "Rugosidad", "Meteorización", "Resistencia"]],
        body: filas,
        margin: { left: marginLeft, right: marginRight },
        styles: { fontSize: 11, font: "times" },
        theme: "grid",
        didDrawPage: (data) => { y = data.cursor.y + 10; }
      });
    }
  }

  // --- 4. DISCUSIÓN ---

    checkPageSpace(20);
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text("4. Discusión", marginLeft, y);
  y += 12;

  doc.setFont("times", "normal");
  doc.setFontSize(12);

  const resultadoDiscusion = document.getElementById("resultado-discusion");
  if (resultadoDiscusion && resultadoDiscusion.textContent.trim() !== "") {
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    const parrafos = resultadoDiscusion.textContent.trim().split("\n\n");
    for (const parrafo of parrafos) {
      y = textoJustificado(doc, parrafo.trim(), marginLeft, y, usableWidth, 7);
      y += 7;
    }
  } else {
    doc.setFont("times", "italic");
    doc.text("No hay introducción disponible.", marginLeft, y);
    y += 12;
  }

  // --- 5. CONCLUSIONES ---

    checkPageSpace(20);
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text("5. Conclusiones", marginLeft, y);
  y += 12;

  doc.setFont("times", "normal");
  doc.setFontSize(12);

  const resultadoConclusiones = document.getElementById("resultado-conclusiones");
  if (resultadoConclusiones && resultadoConclusiones.textContent.trim() !== "") {
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    const parrafos = resultadoConclusiones.textContent.trim().split("\n\n");
    for (const parrafo of parrafos) {
      y = textoJustificado(doc, parrafo.trim(), marginLeft, y, usableWidth, 7);
      y += 7;
    }
  } else {
    doc.setFont("times", "italic");
    doc.text("No hay introducción disponible.", marginLeft, y);
    y += 12;
  }

  // --- Pie de página ---
  doc.setFontSize(8);
  doc.setFont("times", "normal");
  doc.text(`Generado el ${new Date().toLocaleDateString()}`, marginLeft, pageHeight - 10);

  // Guardar PDF
  doc.save("informe_geologico.pdf");
}
