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

tipoBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    tipoBtns.forEach((b) => b.classList.remove("activo"));
    btn.classList.add("activo");

    tipoSeleccionado = btn.dataset.tipo;

    if (tipoSeleccionado === "Otros") {
      otroGasto.classList.remove("hidden");
    } else {
      otroGasto.classList.add("hidden");
      otroGasto.value = "";
    }
  });
});

guardarBtn.addEventListener("click", guardarGasto);

function guardarGasto() {
  const operadorValue = operador.value;
  const tipoValue = tipoSeleccionado === "Otros" ? otroGasto.value.trim() : tipoSeleccionado;
  const cantidadValue = Number(cantidad.value);

  if (!operadorValue || !tipoValue || cantidadValue <= 0) {
    alert("Completa operador, gasto y cantidad");
    return;
  }

  const gasto = {
    operador: operadorValue,
    tipo: tipoValue,
    cantidad: cantidadValue,
    fecha: editandoIndex !== null ? gastos[editandoIndex].fecha : new Date().toISOString()
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

  gastos.slice().reverse().forEach((gasto, reverseIndex) => {
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
        <button class="editar" onclick="editarGasto(${index})">Editar</button>
        <button class="borrar" onclick="borrarGasto(${index})">Borrar</button>
      </div>
    `;

    listaGastos.appendChild(div);
  });

  calcularTotales();
}

function icono(tipo) {
  if (tipo === "Gas") return "⛽";
  if (tipo === "Diésel") return "🛢️";
  if (tipo === "Comida") return "🍽️";
  return "📌";
}

function editarGasto(index) {
  const gasto = gastos[index];

  operador.value = gasto.operador;
  cantidad.value = gasto.cantidad;

  tipoBtns.forEach((btn) => btn.classList.remove("activo"));

  if (["Gas", "Diésel", "Comida"].includes(gasto.tipo)) {
    tipoSeleccionado = gasto.tipo;
    document.querySelector(`[data-tipo="${gasto.tipo}"]`).classList.add("activo");
    otroGasto.classList.add("hidden");
  } else {
    tipoSeleccionado = "Otros";
    document.querySelector(`[data-tipo="Otros"]`).classList.add("activo");
    otroGasto.classList.remove("hidden");
    otroGasto.value = gasto.tipo;
  }

  editandoIndex = index;
  guardarBtn.textContent = "Actualizar gasto";
}

function borrarGasto(index) {
  if (confirm("¿Borrar este gasto?")) {
    gastos.splice(index, 1);
    localStorage.setItem("gastosOperativos", JSON.stringify(gastos));
    mostrarGastos();
  }
}

function calcularTotales() {
  const hoy = new Date();
  const inicioSemana = new Date();
  inicioSemana.setDate(hoy.getDate() - hoy.getDay());
  inicioSemana.setHours(0, 0, 0, 0);

  let diario = 0;
  let semanal = 0;

  gastos.forEach((gasto) => {
    const fecha = new Date(gasto.fecha);

    if (fecha.toDateString() === hoy.toDateString()) {
      diario += gasto.cantidad;
    }

    if (fecha >= inicioSemana) {
      semanal += gasto.cantidad;
    }
  });

  totalDiario.textContent = `$${diario}`;
  totalSemanal.textContent = `$${semanal}`;
}

function filtrarGastos(tipo) {
  const hoy = new Date();
  const inicioSemana = new Date();
  inicioSemana.setDate(hoy.getDate() - hoy.getDay());
  inicioSemana.setHours(0, 0, 0, 0);

  return gastos.filter((gasto) => {
    const fecha = new Date(gasto.fecha);

    if (tipo === "dia") {
      return fecha.toDateString() === hoy.toDateString();
    }

    return fecha >= inicioSemana;
  });
}

function mandarWhatsApp(tipo) {
  const lista = filtrarGastos(tipo);

  if (lista.length === 0) {
    alert("No hay gastos para enviar");
    return;
  }

  let total = lista.reduce((sum, g) => sum + g.cantidad, 0);

  let mensaje = `*Reporte de gastos ${tipo === "dia" ? "del día" : "de la semana"}*\n\n`;

  lista.forEach((g) => {
    const fecha = new Date(g.fecha);
    mensaje += `${icono(g.tipo)} ${g.operador}\n`;
    mensaje += `Gasto: ${g.tipo}\n`;
    mensaje += `Cantidad: $${g.cantidad}\n`;
    mensaje += `Fecha: ${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}\n\n`;
  });

  mensaje += `*TOTAL: $${total}*`;

  window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, "_blank");
}

function generarExcel() {
  let csv = "Operador,Tipo,Cantidad,Fecha\n";

  gastos.forEach((g) => {
    csv += `"${g.operador}","${g.tipo}","${g.cantidad}","${new Date(g.fecha).toLocaleString()}"\n`;
  });

  descargar(csv, "gastos_operativos.csv", "text/csv");
}

function generarWord() {
  let html = `
    <html>
    <head><meta charset="UTF-8"></head>
    <body>
      <h1>Reporte de Gastos Operativos</h1>
      <table border="1" cellpadding="8" cellspacing="0">
        <tr>
          <th>Operador</th>
          <th>Tipo</th>
          <th>Cantidad</th>
          <th>Fecha</th>
        </tr>
  `;

  gastos.forEach((g) => {
    html += `
      <tr>
        <td>${g.operador}</td>
        <td>${g.tipo}</td>
        <td>$${g.cantidad}</td>
        <td>${new Date(g.fecha).toLocaleString()}</td>
      </tr>
    `;
  });

  html += `
      </table>
    </body>
    </html>
  `;

  descargar(html, "gastos_operativos.doc", "application/msword");
}

function descargar(contenido, nombre, tipo) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

function limpiarFormulario() {
  operador.value = "";
  cantidad.value = "";
  otroGasto.value = "";
  otroGasto.classList.add("hidden");
  tipoSeleccionado = "";
  tipoBtns.forEach((btn) => btn.classList.remove("activo"));
}

mostrarGastos();
