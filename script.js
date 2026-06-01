document.addEventListener("DOMContentLoaded", function () {
  const operador = document.getElementById("operador");
  const otroGasto = document.getElementById("otroGasto");
  const cantidad = document.getElementById("cantidad");
  const guardarBtn = document.getElementById("guardarBtn");
  const listaGastos = document.getElementById("listaGastos");
  const totalDiario = document.getElementById("totalDiario");
  const totalSemanal = document.getElementById("totalSemanal");
  const tipoBtns = document.querySelectorAll(".tipo-btn");

  let gastos = JSON.parse(localStorage.getItem("gastosOperativos")) || [];
  let tipoSeleccionado = "";
  let editandoIndex = null;

  tipoBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      tipoBtns.forEach(function (b) {
        b.classList.remove("activo");
      });

      btn.classList.add("activo");
      tipoSeleccionado = btn.getAttribute("data-tipo");

      if (tipoSeleccionado === "Otros") {
        otroGasto.classList.remove("hidden");
        otroGasto.focus();
      } else {
        otroGasto.classList.add("hidden");
        otroGasto.value = "";
      }
    });
  });

  guardarBtn.addEventListener("click", guardarGasto);

  function guardarGasto() {
    const operadorValue = operador.value;
    const tipoValue =
      tipoSeleccionado === "Otros"
        ? otroGasto.value.trim()
        : tipoSeleccionado;

    const cantidadValue = Number(cantidad.value);

    if (!operadorValue) {
      alert("Selecciona un operador");
      return;
    }

    if (!tipoValue) {
      alert("Selecciona un tipo de gasto");
      return;
    }

    if (!cantidadValue || cantidadValue <= 0) {
      alert("Escribe una cantidad válida");
      return;
    }

    const gasto = {
      operador: operadorValue,
      tipo: tipoValue,
      cantidad: cantidadValue,
      fecha:
        editandoIndex !== null
          ? gastos[editandoIndex].fecha
          : new Date().toISOString(),
    };

    if (editandoIndex !== null) {
      gastos[editandoIndex] = gasto;
      editandoIndex = null;
      guardarBtn.textContent = "Guardar gasto";
    } else {
      gastos.push(gasto);
    }

    localStorage.setItem("gastosOperativos", JSON.stringify(gastos));
    limpiarFormulario();
    mostrarGastos();
  }

  function mostrarGastos() {
    listaGastos.innerHTML = "";

    if (gastos.length === 0) {
      listaGastos.innerHTML = `<div class="vacio">No hay gastos registrados todavía.</div>`;
      calcularTotales();
      return;
    }

    const copia = gastos.slice().reverse();

    copia.forEach(function (gasto, reverseIndex) {
      const index = gastos.length - 1 - reverseIndex;
      const fecha = new Date(gasto.fecha);

      const div = document.createElement("div");
      div.className = "gasto";

      div.innerHTML = `
        <p><strong>${icono(gasto.tipo)} ${gasto.operador}</strong></p>
        <p>Gasto: ${gasto.tipo}</p>
        <p>Cantidad: $${gasto.cantidad}</p>
        <p>Fecha: ${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}</p>

        <div class="acciones">
          <button type="button" class="editar" onclick="editarGasto(${index})">Editar</button>
          <button type="button" class="borrar" onclick="borrarGasto(${index})">Borrar</button>
        </div>
      `;

      listaGastos.appendChild(div);
    });

    calcularTotales();
  }

  window.editarGasto = function (index) {
    const gasto = gastos[index];

    operador.value = gasto.operador;
    cantidad.value = gasto.cantidad;

    tipoBtns.forEach(function (btn) {
      btn.classList.remove("activo");
    });

    if (gasto.tipo === "Gas" || gasto.tipo === "Diésel" || gasto.tipo === "Comida") {
      tipoSeleccionado = gasto.tipo;

      document
        .querySelector(`[data-tipo="${gasto.tipo}"]`)
        .classList.add("activo");

      otroGasto.classList.add("hidden");
      otroGasto.value = "";
    } else {
      tipoSeleccionado = "Otros";

      document
        .querySelector(`[data-tipo="Otros"]`)
        .classList.add("activo");

      otroGasto.classList.remove("hidden");
      otroGasto.value = gasto.tipo;
    }

    editandoIndex = index;
    guardarBtn.textContent = "Actualizar gasto";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  window.borrarGasto = function (index) {
    if (confirm("¿Seguro que quieres borrar este gasto?")) {
      gastos.splice(index, 1);
      localStorage.setItem("gastosOperativos", JSON.stringify(gastos));
      mostrarGastos();
    }
  };

  function calcularTotales() {
    const hoy = new Date();

    const inicioSemana = new Date();
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    let diario = 0;
    let semanal = 0;

    gastos.forEach(function (gasto) {
      const fecha = new Date(gasto.fecha);

      if (fecha.toDateString() === hoy.toDateString()) {
        diario += gasto.cantidad;
      }

      if (fecha >= inicioSemana) {
        semanal += gasto.cantidad;
      }
    });

    totalDiario.textContent = formatoMoneda(diario);
    totalSemanal.textContent = formatoMoneda(semanal);
  }

  function filtrarGastos(tipo) {
    const hoy = new Date();

    const inicioSemana = new Date();
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    return gastos.filter(function (gasto) {
      const fecha = new Date(gasto.fecha);

      if (tipo === "dia") {
        return fecha.toDateString() === hoy.toDateString();
      }

      return fecha >= inicioSemana;
    });
  }

  window.mandarWhatsApp = function (tipo) {
    const lista = filtrarGastos(tipo);

    if (lista.length === 0) {
      alert("No hay gastos para enviar");
      return;
    }

    let total = 0;

    let mensaje =
      tipo === "dia"
        ? "*Reporte de gastos del día*\n\n"
        : "*Reporte de gastos de la semana*\n\n";

    lista.forEach(function (g) {
      const fecha = new Date(g.fecha);
      total += g.cantidad;

      mensaje += `${icono(g.tipo)} Operador: ${g.operador}\n`;
      mensaje += `Gasto: ${g.tipo}\n`;
      mensaje += `Cantidad: ${formatoMoneda(g.cantidad)}\n`;
      mensaje += `Fecha: ${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}\n\n`;
    });

    mensaje += `*TOTAL: ${formatoMoneda(total)}*`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(mensaje)}`,
      "_blank"
    );
  };

  window.generarExcel = function () {
    if (gastos.length === 0) {
      alert("No hay gastos para exportar");
      return;
    }

    let csv = "Operador,Tipo de gasto,Cantidad,Fecha\n";

    gastos.forEach(function (g) {
      csv += `"${g.operador}","${g.tipo}","${g.cantidad}","${new Date(
        g.fecha
      ).toLocaleString()}"\n`;
    });

    descargarArchivo(csv, "gastos_operativos.csv", "text/csv;charset=utf-8;");
  };

  window.generarWord = function () {
    if (gastos.length === 0) {
      alert("No hay gastos para exportar");
      return;
    }

    let total = gastos.reduce(function (suma, g) {
      return suma + g.cantidad;
    }, 0);

    let html = `
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Gastos Operativos</title>
      </head>
      <body>
        <h1>Reporte de Gastos Operativos</h1>
        <p><strong>Total general:</strong> ${formatoMoneda(total)}</p>

        <table border="1" cellpadding="8" cellspacing="0">
          <tr>
            <th>Operador</th>
            <th>Tipo de gasto</th>
            <th>Cantidad</th>
            <th>Fecha</th>
          </tr>
    `;

    gastos.forEach(function (g) {
      html += `
        <tr>
          <td>${g.operador}</td>
          <td>${g.tipo}</td>
          <td>${formatoMoneda(g.cantidad)}</td>
          <td>${new Date(g.fecha).toLocaleString()}</td>
        </tr>
      `;
    });

    html += `
        </table>
      </body>
      </html>
    `;

    descargarArchivo(html, "gastos_operativos.doc", "application/msword");
  };

  function descargarArchivo(contenido, nombreArchivo, tipo) {
    const blob = new Blob([contenido], { type: tipo });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function icono(tipo) {
    if (tipo === "Gas") return "⛽";
    if (tipo === "Diésel") return "🛢️";
    if (tipo === "Comida") return "🍽️";
    return "📌";
  }

  function formatoMoneda(numero) {
    return "$" + Number(numero).toLocaleString("es-MX");
  }

  function limpiarFormulario() {
    operador.value = "";
    cantidad.value = "";
    otroGasto.value = "";
    otroGasto.classList.add("hidden");
    tipoSeleccionado = "";

    tipoBtns.forEach(function (btn) {
      btn.classList.remove("activo");
    });
  }

  mostrarGastos();
});
