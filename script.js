const operador = document.getElementById("operador");
const tipoGasto = document.getElementById("tipoGasto");
const otroGasto = document.getElementById("otroGasto");
const cantidad = document.getElementById("cantidad");
const guardarBtn = document.getElementById("guardarBtn");
const listaGastos = document.getElementById("listaGastos");
const totalDiario = document.getElementById("totalDiario");
const totalSemanal = document.getElementById("totalSemanal");

let gastos = JSON.parse(localStorage.getItem("gastos")) || [];
let editandoIndex = null;

tipoGasto.addEventListener("change", () => {
  if (tipoGasto.value === "Otros") {
    otroGasto.classList.remove("hidden");
  } else {
    otroGasto.classList.add("hidden");
    otroGasto.value = "";
  }
});

guardarBtn.addEventListener("click", () => {
  const operadorValue = operador.value;
  const tipoValue = tipoGasto.value === "Otros" ? otroGasto.value : tipoGasto.value;
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
      <p><strong>${gasto.operador}</strong></p>
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

function editarGasto(index) {
  const gasto = gastos[index];

  operador.value = gasto.operador;

  if (["Gas", "Diésel", "Comida"].includes(gasto.tipo)) {
    tipoGasto.value = gasto.tipo;
    otroGasto.classList.add("hidden");
  } else {
    tipoGasto.value = "Otros";
    otroGasto.classList.remove("hidden");
    otroGasto.value = gasto.tipo;
  }

  cantidad.value = gasto.cantidad;
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

function limpiarFormulario() {
  operador.value = "";
  tipoGasto.value = "";
  otroGasto.value = "";
  otroGasto.classList.add("hidden");
  cantidad.value = "";
}

mostrarGastos();
