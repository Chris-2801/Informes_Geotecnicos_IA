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

function dibujarLineaJustificada(doc, line, x, y, maxWidth, lineHeight) {
    const words = line.split(' ').filter(w => w !== '');
    if (words.length <= 1) {
        doc.text(line, x, y);
        return y + lineHeight;
    }
    
    const totalWordWidth = words.reduce((sum, w) => sum + doc.getTextWidth(w), 0);
    const totalSpacesWidth = maxWidth - totalWordWidth;
    const spaceWidth = totalSpacesWidth / (words.length - 1);
    
    let currentX = x;
    for (let i = 0; i < words.length; i++) {
        doc.text(words[i], currentX, y);
        currentX += doc.getTextWidth(words[i]) + (i < words.length - 1 ? spaceWidth : 0);
    }
    
    return y + lineHeight;
}

// --. FUNCIÓN GENERAL PARA GENERAR PDF ---

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
      return true;
    }
    return false;
  }

  function textoJustificado(doc, text, x, y, maxWidth, lineHeight) {
    if (!text || text.trim() === "") return y;
    
    // Normalizar espacios y saltos de línea
    text = text.replace(/\s+/g, ' ').trim();
    const paragraphs = text.split('\n');
    let currentY = y;
    
    for (const paragraph of paragraphs) {
        if (paragraph.trim() === "") {
            currentY += lineHeight;
            if (currentY > doc.internal.pageSize.height - marginBottom) {
                doc.addPage();
                currentY = marginTop;
            }
            continue;
        }
        
        const words = paragraph.split(' ');
        let currentLine = '';
        
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const testWidth = doc.getTextWidth(testLine);
            
            if ((testWidth > maxWidth && currentLine !== '') || 
                (currentY + lineHeight > doc.internal.pageSize.height - marginBottom)) {
                
                // Dibujar línea actual
                currentY = dibujarLineaJustificada(doc, currentLine, x, currentY, maxWidth, lineHeight);
                
                // Verificar si necesitamos nueva página
                if (currentY > doc.internal.pageSize.height - marginBottom) {
                    doc.addPage();
                    currentY = marginTop;
                }
                
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        
        // Dibujar última línea del párrafo
        if (currentLine !== '') {
            currentY = dibujarLineaJustificada(doc, currentLine, x, currentY, maxWidth, lineHeight);
        }
        
        // Espacio entre párrafos
        currentY += lineHeight * 0.5;
        if (currentY > doc.internal.pageSize.height - marginBottom) {
            doc.addPage();
            currentY = marginTop;
        }
    }
    
    return currentY;
}

  const tituloProyecto = document.getElementById("titulo-proyecto").value.trim() || "Proyecto";
  const autores = document.getElementById("autores").value.trim() || "Autor no especificado";
  const carrera = document.getElementById("carrera").value.trim() || "Carrera no especificada";
  const materia = document.getElementById("materia").value.trim() || "Materia no especificada";

  // PORTADA CON LOGO
  try {
    const logoUCE = await imageToBase64(document.getElementById('logo-uce') || { 
      src: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fes.m.wikipedia.org%2Fwiki%2FArchivo%3AEscudo_de_la_Universidad_Central_del_Ecuador_-_Andr%25C3%25A9s_Agual.png&psig=AOvVaw3VCCC_pWv22951X0DXHpgU&ust=1753079166497000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCNjm3Pnmyo4DFQAAAAAdAAAAABAE' 
    });
    if (logoUCE) {
      doc.addImage(logoUCE, 'PNG', pageWidth/2 - 15, 20, 30, 30);
    }
  } catch (e) {
    console.log("No se pudo cargar el logo:", e);
  }

  doc.setFont("times", "bold").setFontSize(14);
  doc.text("UNIVERSIDAD CENTRAL DEL ECUADOR", pageWidth / 2, 60, { align: "center" });
  doc.text("Facultad de Ingeniería en Geología, Minas, Petróleos y Ambiental", pageWidth / 2, 70, { align: "center" });
  doc.text(`CARRERA DE ${carrera.toUpperCase()}`, pageWidth / 2, 80, { align: "center" });

  doc.setFontSize(24);
  doc.text("INFORME GEOLÓGICO", pageWidth / 2, 110, { align: "center" });

  doc.setFontSize(16);
  doc.text(tituloProyecto, pageWidth / 2, 130, { align: "center" });

  doc.setFontSize(12);
  doc.text(`Materia: ${materia}`, pageWidth / 2, 150, { align: "center" });
  doc.text(`Autor(es): ${autores}`, pageWidth / 2, 160, { align: "center" });
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, pageWidth / 2, 170, { align: "center" });

  doc.addPage();
  y = marginTop;

  // 1. Introducción
  doc.setFont("times", "bold").setFontSize(12);
  doc.text("1. Introducción", marginLeft, y); y += 10;
  doc.setFont("times", "normal").setFontSize(12);
  const intro = document.getElementById("texto-general")?.textContent.trim();
  y = intro ? textoJustificado(doc, intro, marginLeft, y, usableWidth, 7) : (doc.setFont("times", "italic").text("No hay introducción disponible.", marginLeft, y), y + 10);

  // 2. Objetivos
  checkPageSpace(15);
  doc.setFont("times", "bold").setFontSize(12);
  doc.text("2. Objetivos", marginLeft, y); y += 10;
  doc.setFont("times", "normal").setFontSize(12);

  const objetivos = document.getElementById("texto-objetivos")?.textContent.trim();
  y = objetivos ? textoJustificado(doc, objetivos, marginLeft, y, usableWidth, 7) : (doc.setFont("times", "normal").text("No hay objetivos disponibles.", marginLeft, y), y + 10);

  // 3. Tablas Resumen Afloramientos y Rocas
  const bloques = document.querySelectorAll(".bloque");
  const resumenAfloramientos = [];
  const resumenRocas = [];

  bloques.forEach((bloque, i) => {
    const id = bloque.id.split("-")[1];
    const sistema = bloque.querySelector(`[name="sistema_ref_${id}"]`)?.value || "";
    const x = bloque.querySelector(`[name="x_${id}"]`)?.value || "";
    const yCoord = bloque.querySelector(`[name="y_${id}"]`)?.value || "";
    const z = bloque.querySelector(`[name="z_${id}"]`)?.value || "";
    resumenAfloramientos.push([i + 1, sistema, x, yCoord, z]);

    const tipo = bloque.querySelector(`[name="tipo_roca_${id}"]`)?.value || "";
    const roca = bloque.querySelector(`[name="roca_${id}"]`)?.value || "";
    const calidad = bloque.querySelector(`[name="calidad_${id}"]`)?.value || "";
    const matriz = bloque.querySelector(`[name="matriz_${id}"]`)?.value || "";
    const textura = bloque.querySelector(`[name="textura_${id}"]`)?.value || "";
    const mineralogia = bloque.querySelector(`[name="mineralogia_${id}"]`)?.value || "";
    const grano = bloque.querySelector(`[name="grano_${id}"]`)?.value || "";
    resumenRocas.push([i + 1, tipo, roca, calidad, matriz, textura, mineralogia, grano]);
  });

  checkPageSpace(60);
  doc.setFont("times", "bold").setFontSize(12);
  doc.text("3.1 Tabla de Afloramientos", marginLeft, y); y += 6;

  doc.autoTable({
    startY: y,
    head: [["#", "Sistema", "X", "Y", "Z"]],
    body: resumenAfloramientos,
    styles: { fontSize: 9 },
    margin: { left: marginLeft, right: marginRight },
    theme: "grid",
    didDrawPage: data => y = data.cursor.y + 10
  });

  checkPageSpace(60);
  doc.setFont("times", "bold").setFontSize(12);
  doc.text("3.2 Tabla de Características de Rocas", marginLeft, y); y += 6;

  doc.autoTable({
    startY: y,
    head: [["#", "Tipo", "Roca", "Calidad", "Matriz", "Textura", "Mineralogía", "Tamaño Grano"]],
    body: resumenRocas,
    styles: { fontSize: 9 },
    margin: { left: marginLeft, right: marginRight },
    theme: "grid",
    didDrawPage: data => y = data.cursor.y + 10
  });

  // 3.3 Detalle por Afloramiento
  for (let i = 0; i < bloques.length; i++) {
    const bloque = bloques[i];
    const id = bloque.id.split("-")[1];

    checkPageSpace(30);
    doc.setFont("times", "bold").setFontSize(12);
    doc.text(`3.${i + 3} Afloramiento ${i + 1}`, marginLeft, y); y += 8;
    doc.setFont("times", "normal").setFontSize(12);
    const descAf = bloque.querySelector(`#descripcion-afloramiento-${id}`)?.textContent.trim() || "";
    const descRo = bloque.querySelector(`#descripcion-roca-${id}`)?.textContent.trim() || "";
    y = textoJustificado(doc, descAf, marginLeft, y, usableWidth, 6) + 6;
    y = textoJustificado(doc, descRo, marginLeft, y, usableWidth, 6) + 6;

    const imgAf = bloque.querySelector(`#preview-afloramiento-${id}`);
    const imgRo = bloque.querySelector(`#preview-roca-${id}`);
    const imgEst = bloque.querySelector(`#estereograma-img-${id}`);
    const canvasHist = bloque.querySelector(`#histograma-${id}`);
    const base64Af = await imageToBase64(imgAf);
    const base64Ro = await imageToBase64(imgRo);
    const base64Est = await imageToBase64(imgEst);
    const base64Hist = canvasHist ? canvasHist.toDataURL("image/png") : null;

    const imgW = 70, imgH = 50, espacio = 10;
    checkPageSpace(imgH * 2 + 20);
    if (base64Af) doc.addImage(base64Af, "JPEG", marginLeft, y, imgW, imgH);
    if (base64Ro) doc.addImage(base64Ro, "JPEG", marginLeft + imgW + espacio, y, imgW, imgH);
    y += imgH + 5;
    if (base64Est) doc.addImage(base64Est, "PNG", marginLeft, y, imgW, imgH);
    if (base64Hist) doc.addImage(base64Hist, "PNG", marginLeft + imgW + espacio, y, imgW, imgH);
    y += imgH + 10;
  }

  // 4. Discusión (corregido para que aparezca en negrita)
  checkPageSpace(20);
  doc.setFont("times", "bold").setFontSize(12);
  doc.text("4. Discusión", marginLeft, y); y += 10;
  doc.setFont("times", "normal").setFontSize(12);
  const discusion = document.getElementById("texto-discusion")?.textContent.trim();
  y = discusion ? textoJustificado(doc, discusion, marginLeft, y, usableWidth, 7) : (doc.setFont("times", "italic").text("No hay discusión disponible.", marginLeft, y), y + 10);

  // 5. Conclusiones
  checkPageSpace(20);
  doc.setFont("times", "bold").setFontSize(12);
  doc.text("5. Conclusiones", marginLeft, y); y += 10;
  doc.setFont("times", "normal").setFontSize(12);
  const conclusiones = document.getElementById("texto-conclusiones")?.textContent.trim();
  y = conclusiones ? textoJustificado(doc, conclusiones, marginLeft, y, usableWidth, 7) : (doc.setFont("times", "italic").text("No hay conclusiones disponibles.", marginLeft, y), y + 10);

  // ANEXO A: Tabla de RMR detallada en formato vertical
  doc.addPage("a4", "landscape");
  y = marginTop;
  doc.setFont("times", "bold").setFontSize(16);
  doc.text("ANEXO A: TABLA DE CLASIFICACIÓN RMR", pageWidth / 2, y, { align: "center" });
  y += 15;

  const datosRMR = [];
  const estadisticasPorAfloramiento = {};

  bloques.forEach((bloque, i) => {
    const id = bloque.id.split("-")[1];
    const tabla = bloque.querySelector(`#tabla-${id} tbody`);
    const afloramientoNum = i + 1;
    
    if (!estadisticasPorAfloramiento[afloramientoNum]) {
      estadisticasPorAfloramiento[afloramientoNum] = {
        cantidadFamilias: 0,
        rmrMin: Infinity,
        rmrMax: -Infinity,
        rmrPromedio: 0,
        sumaRMR: 0
      };
    }
    
    if (tabla) {
      Array.from(tabla.querySelectorAll("tr")).forEach((tr, idx) => {
        const celdas = tr.querySelectorAll("td");
        const inputOrientacion = tr.querySelector('input[name^="orientacion"]');
        const orientacion = inputOrientacion ? inputOrientacion.value.trim() : "N/A";
        const filaData = {
          afloramiento: afloramientoNum,
          familia: idx + 1,
          orientacion: orientacion,
          UCS: celdas[2]?.querySelector("select")?.value || "-",
          RQD: celdas[3]?.querySelector("select")?.value || "-",
          Espaciamiento: celdas[4]?.querySelector("select")?.value || "-",
          Continuidad: celdas[5]?.querySelector("select")?.value || "-",
          Apertura: celdas[6]?.querySelector("select")?.value || "-",
          Rugosidad: celdas[7]?.querySelector("select")?.value || "-",
          Relleno: celdas[8]?.querySelector("select")?.value || "-",
          Alteracion: celdas[9]?.querySelector("select")?.value || "-",
          AguaFreatica: celdas[10]?.querySelector("select")?.value || "-"
        };
        
        let rmr = 0;
        const parametros = ['UCS', 'RQD', 'Espaciamiento', 'Continuidad', 'Apertura', 'Rugosidad', 'Relleno', 'Alteracion', 'AguaFreatica'];
        
        parametros.forEach(param => {
          const valor = filaData[param];
          if (valor && valoresRMR[param] && valoresRMR[param][valor]) {
            rmr += valoresRMR[param][valor].valor;
          }
        });
        
        filaData.RMR = rmr;
        datosRMR.push(filaData);
        
        estadisticasPorAfloramiento[afloramientoNum].cantidadFamilias++;
        estadisticasPorAfloramiento[afloramientoNum].sumaRMR += rmr;
        estadisticasPorAfloramiento[afloramientoNum].rmrMin = Math.min(estadisticasPorAfloramiento[afloramientoNum].rmrMin, rmr);
        estadisticasPorAfloramiento[afloramientoNum].rmrMax = Math.max(estadisticasPorAfloramiento[afloramientoNum].rmrMax, rmr);
      });
      
      if (estadisticasPorAfloramiento[afloramientoNum].cantidadFamilias > 0) {
        estadisticasPorAfloramiento[afloramientoNum].rmrPromedio = 
          estadisticasPorAfloramiento[afloramientoNum].sumaRMR / 
          estadisticasPorAfloramiento[afloramientoNum].cantidadFamilias;
      }
    }
  });

  if (datosRMR.length > 0) {
    const headers = [
      "Afloramiento",
      "Familia",
      "Orientación",
      "UCS (MPa)",
      "Puntos",
      "RQD (%)",
      "Puntos",
      "Espaciamiento (m)",
      "Puntos",
      "Continuidad (m)",
      "Puntos",
      "Apertura (mm)",
      "Puntos",
      "Rugosidad",
      "Puntos",
      "Relleno",
      "Puntos",
      "Alteración",
      "Puntos",
      "Agua Freática",
      "Puntos",
      "RMR Total"
    ];

    const body = datosRMR.map(fila => {
      return [
        fila.afloramiento,
        fila.familia,
        fila.orientacion,
        fila.UCS,
        valoresRMR.UCS[fila.UCS]?.valor || "-",
        fila.RQD,
        valoresRMR.RQD[fila.RQD]?.valor || "-",
        fila.Espaciamiento,
        valoresRMR.Espaciamiento[fila.Espaciamiento]?.valor || "-",
        fila.Continuidad,
        valoresRMR.Continuidad[fila.Continuidad]?.valor || "-",
        fila.Apertura,
        valoresRMR.Apertura[fila.Apertura]?.valor || "-",
        fila.Rugosidad,
        valoresRMR.Rugosidad[fila.Rugosidad]?.valor || "-",
        fila.Relleno,
        valoresRMR.Relleno[fila.Relleno]?.valor || "-",
        fila.Alteracion,
        valoresRMR.Alteracion[fila.Alteracion]?.valor || "-",
        fila.AguaFreatica,
        valoresRMR.AguaFreatica[fila.AguaFreatica]?.valor || "-",
        fila.RMR
      ];
    });

    doc.autoTable({
      startY: y,
      head: [headers],
      body: body,
      styles: { 
        fontSize: 7,
        cellPadding: 1.5,
        overflow: 'linebreak'
      },
      margin: { left: 10, right: 10 },
      theme: "grid",
      didDrawPage: function(data) {
        y = data.cursor.y + 10;
      }
    });

    // ANEXO B: Estadísticas y clasificación RMR
    doc.addPage();
    y = marginTop;
    doc.setFont("times", "bold").setFontSize(16);
    doc.text("ANEXO B: ESTADÍSTICAS Y CLASIFICACIÓN RMR", pageWidth / 2, y, { align: "center" });
    y += 15;

    doc.setFont("times", "bold").setFontSize(12);
    doc.text("Estadísticas por Afloramiento", marginLeft, y); y += 8;

    const statsBody = Object.keys(estadisticasPorAfloramiento).map(afloramiento => {
      const stats = estadisticasPorAfloramiento[afloramiento];
      return [
        afloramiento,
        stats.cantidadFamilias,
        stats.rmrMin.toFixed(1),
        stats.rmrMax.toFixed(1),
        stats.rmrPromedio.toFixed(1)
      ];
    });

    doc.autoTable({
      startY: y,
      head: [["Afloramiento", "N° Familias", "RMR Mínimo", "RMR Máximo", "RMR Promedio"]],
      body: statsBody,
      styles: { fontSize: 10 },
      margin: { left: marginLeft, right: marginRight },
      theme: "grid",
      didDrawPage: function(data) {
        y = data.cursor.y + 15;
      }
    });

    checkPageSpace(30);
    doc.setFont("times", "bold").setFontSize(12);
    doc.text("Clasificación RMR según Bieniawski (1989)", marginLeft, y); y += 8;

    const clasificacionRMR = [
      { rango: "81-100", clase: "I", calidad: "Muy buena roca" },
      { rango: "61-80", clase: "II", calidad: "Buena roca" },
      { rango: "41-60", clase: "III", calidad: "Roca regular" },
      { rango: "21-40", clase: "IV", calidad: "Roca mala" },
      { rango: "<20", clase: "V", calidad: "Roca muy mala" }
    ];
    
    doc.autoTable({
      startY: y,
      head: [["Rango RMR", "Clase", "Calidad de la Roca"]],
      body: clasificacionRMR.map(item => [item.rango, item.clase, item.calidad]),
      styles: { fontSize: 10 },
      margin: { left: marginLeft, right: marginRight },
      theme: "grid",
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 50 }
      }
    });
  } else {
    doc.setFont("times", "italic").setFontSize(12);
    doc.text("No hay datos de discontinuidades disponibles para mostrar la tabla RMR.", marginLeft, y);
  }

  doc.save(`${tituloProyecto.replace(/\s+/g, "_")}_Informe_Geologico.pdf`);
}