const operador = document.getElementById("operador");
const otroGasto = document.getElementById("otroGasto");
const cantidad = document.getElementById("cantidad");
const guardarBtn = document.getElementById("guardarBtn");
const listaGastos = document.getElementById("listaGastos");
const totalDiario = document.getElementById("totalDiario");
const totalSemanal = document.getElementById("totalSemanal");
const tipoBtns = document.querySelectorAll(".tipo-btn");

let gastos = JSON.parse(localStorage.getItem("gastos")) || [];
let tipoSeleccionado = "";
let editandoIndex = null;

tipoBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    tipoBtns.forEach(b => b.classList.remove("activo"));
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

guardarBtn.addEventListener("click", () => {
  const operadorValue = operador.value;
  const tipoValue = tipoSeleccionado === "Otros" ? otroGasto.value : tipoSeleccionado;
  const cantidadValue = Number(cantidad.value);

  if (!operadorValue || !tipoValue || !cantidadValue) {
    alert("Completa todos los campos");
    return;
  }

  const gasto = {
    operador: operadorValue,
    tipo: tipoValue,
    cantidad: cantidadValue,
    fecha: new Date().toISOString()
  };

  if (editandoIndex !== null) {
    gastos[editandoIndex] = gasto;
    editandoIndex = null;
    guardarBtn.textContent = "Guardar gasto";
  } else {
    gastos.push(gasto);
  }

  localStorage.setItem("gastos", JSON.stringify(gastos));
  limpiarFormulario();
  mostrarGastos();
});

function mostrarGastos() {
  listaGastos.innerHTML = "";

  gastos.forEach((gasto, index) => {
    const fecha = new Date(gasto.fecha);

    const div = document.createElement("div");
    div.className = "gasto";

    div.innerHTML = `
      <p><strong>${iconoGasto(gasto.tipo)} ${gasto.operador}</strong></p>
      <p>Gasto: ${gasto.tipo}</p>
      <p>Cantidad: $${gasto.cantidad}</p>
      <p>Fecha: ${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}</p>

      <div class="acciones">
        <button class="editar" onclick="editarGasto(${index})">Editar</button>
        <button class="borrar" onclick="borrarGasto(${index})">Borrar</button>
      </div>
    `;

    listaGastos.prepend(div);
  });

  calcularTotales();
}

function iconoGasto(tipo) {
  if (tipo === "Gas") return "⛽";
  if (tipo === "Diésel") return "🛢️";
  if (tipo === "Comida") return "🍽️";
  return "📌";
}

function editarGasto(index) {
  const gasto = gastos[index];

  operador.value = gasto.operador;
  cantidad.value = gasto.cantidad;
  tipoSeleccionado = gasto.tipo;

  tipoBtns.forEach(btn => {
    btn.classList.remove("activo");

    if (btn.dataset.tipo === gasto.tipo) {
      btn.classList.add("activo");
    }
  });

  if (!["Gas", "Diésel", "Comida"].includes(gasto.tipo)) {
    tipoSeleccionado = "Otros";
    otroGasto.classList.remove("hidden");
    otroGasto.value = gasto.tipo;

    tipoBtns.forEach(btn => {
      if (btn.dataset.tipo === "Otros") btn.classList.add("activo");
    });
  }

  editandoIndex = index;
  guardarBtn.textContent = "Actualizar gasto";
}

function borrarGasto(index) {
  if (confirm("¿Seguro que quieres borrar este gasto?")) {
    gastos.splice(index, 1);
    localStorage.setItem("gastos", JSON.stringify(gastos));
    mostrarGastos();
  }
}

function calcularTotales() {
  const hoy = new Date();
  const inicioSemana = new Date();
  inicioSemana.setDate(hoy.getDate() - hoy.getDay());

  let diario = 0;
  let semanal = 0;

  gastos.forEach(gasto => {
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

  return gastos.filter(gasto => {
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

  lista.forEach(g => {
    const fecha = new Date(g.fecha);
    mensaje += `${iconoGasto(g.tipo)} ${g.operador}\n`;
    mensaje += `Gasto: ${g.tipo}\n`;
    mensaje += `Cantidad: $${g.cantidad}\n`;
    mensaje += `Fecha: ${fecha.toLocaleDateString()}\n\n`;
  });

  mensaje += `*Total: $${total}*`;

  window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, "_blank");
}

function generarExcel() {
  let csv = "Operador,Tipo,Cantidad,Fecha\n";

  gastos.forEach(g => {
    const fecha = new Date(g.fecha).toLocaleString();
    csv += `${g.operador},${g.tipo},${g.cantidad},${fecha}\n`;
  });

  descargarArchivo(csv, "reporte_gastos.csv", "text/csv");
}

function generarWord() {
  let contenido = `
    <html>
    <head><meta charset="UTF-8"></head>
    <body>
      <h1>Reporte de Gastos Operativos</h1>
      <table border="1" cellpadding="8">
        <tr>
          <th>Operador</th>
          <th>Tipo</th>
          <th>Cantidad</th>
          <th>Fecha</th>
        </tr>
  `;

  gastos.forEach(g => {
    const fecha = new Date(g.fecha).toLocaleString();
    contenido += `
      <tr>
        <td>${g.operador}</td>
        <td>${g.tipo}</td>
        <td>$${g.cantidad}</td>
        <td>${fecha}</td>
      </tr>
    `;
  });

  contenido += `
      </table>
    </body>
    </html>
  `;

  descargarArchivo(contenido, "reporte_gastos.doc", "application/msword");
}

function descargarArchivo(contenido, nombre, tipo) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();

  URL.revokeObjectURL(url);
}

function limpiarFormulario() {
  operador.value = "";
  cantidad.value = "";
  otroGasto.value = "";
  otroGasto.classList.add("hidden");
  tipoSeleccionado = "";
  tipoBtns.forEach(btn => btn.classList.remove("activo"));
}

mostrarGastos();
