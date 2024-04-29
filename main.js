
let datosLadoA = [];
let datosLadoB = [];

function leerArchivo(lado, callback) {
    const input = lado === 'LadoA' ? document.getElementById('archivoLadoA') : document.getElementById('archivoLadoB');

    if(input.files.length != 0){
        for (let index = 0; index < input.files.length; index++) {
            const archivo = input.files[index];
            if (archivo) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const datos = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    // console.log(datos);
                    if (lado === 'LadoA') {
                        datosLadoA.push(...datos);//  ESTO USARLO MAS ADELANTE => datos.map(item => item[Object.keys(item)[0]]);
                        // console.log(datosLadoA);
                    } else {
                        datosLadoB = datos;// LO MISMO QUE EN LADO A => datos.map(item => item[Object.keys(item)[0]]);
                        // console.log(datosLadoB);
                    }
                    if (callback) callback();
                };
                reader.onerror = function (ex) {
                    console.error('Error al leer el archivo:', ex);
                };
                reader.readAsBinaryString(archivo);
            } else {
                console.warn('No se ha seleccionado ningún archivo.');
            }
        }
    } else{
        alert('Debe seleccionar un archivo');
        document.getElementById('cargando').style.display = 'none';
        document.getElementById('div-btn-comparar').style.display = 'block';
    }
}

function compararDatos() {
    datosLadoA = [];//prov
    datosLadoB = [];//neg
    mostrarCargando();

    leerArchivo('LadoA', () => {
        leerArchivo('LadoB', () => {
            //en cada lstado convierto los valores del array padre con subarrays 
            //que contienen los valores de cada fila, nombre y precio, me quedo solo con NOMBRE
            const valoresA = datosLadoA.map(item => item[0]);
            const valoresB = datosLadoB.map(item => item[0]);

            //convierto los valores de cada item del array padre que es un array tambien en un objeto
            const listadoObjetosA = datosLadoA.map(item => ({
                nombre: item[0],// nombre
                precio: item[1]// precio costo
            }));

            const listadoObjetosB = datosLadoB.map(item => ({
                nombre: item[1], // nombre
                precio: item[7]//precio costo
            }));

            const resultado = compararArrays(listadoObjetosA, listadoObjetosB);
            //alert(`Datos coincidentes: ${JSON.stringify(coincidencias, null, 2)}\n\nConteo Lado A: ${JSON.stringify(conteoLadoA, null, 2)}\n\nConteo Lado B: ${JSON.stringify(conteoLadoB, null, 2)}`);
            //AHORA CARGO LAS TABLAS
            const tbodyBajoPrecio = document.querySelector("#tablaBajoPrecio tbody");
            const tbodyMismoPrecio = document.querySelector("#tablaMismoPrecio tbody");
            const tbodySubioPrecio = document.querySelector("#tablaSubioPrecio tbody");

            // Llamar a la función para cargar los datos en la tabla
            cargarDatosEnTabla(tbodyBajoPrecio, resultado.arrayBajaPrecios);
            cargarDatosEnTabla(tbodyMismoPrecio, resultado.arrayMismoPrecio);
            cargarDatosEnTabla(tbodySubioPrecio, resultado.arraySubaPrecios);

            abrirAcordeonSubieronPrecio();

            //oculto el cargando y muestro el boton comparar
            document.getElementById('cargando').style.display = 'none';
            document.getElementById('div-btn-comparar').style.display = 'block';
        });
    });
}

function cargarDatosEnTabla(tbody, array) {
    tbody.innerHTML = "";
    array.forEach(item => {
        let porcentajeVariacion = 0;
        if(item.precioNuevo > item.precioAnterior){
            porcentajeVariacion = ((item.precioNuevo - item.precioAnterior) / item.precioAnterior) * 100; //aumento
        }else{
            porcentajeVariacion = ((item.precioAnterior - item.precioNuevo) / item.precioAnterior) * 100; //disminuyo
        }
        const row = `
                    <tr>
                        <td>${item.nombre}</td>
                        <td>${item.precioAnterior}</td>
                        <td>${item.precioNuevo}</td>
                        <td> % ${porcentajeVariacion.toFixed(2)}</td>
                    </tr>
                `;
        tbody.innerHTML += row;
    });
}

function manejarCambioArchivoA() {
    leerArchivo('LadoA');
}

function manejarCambioArchivoB() {
    leerArchivo('LadoB');
}

function mostrarCargando() {
    document.getElementById('cargando').style.display = 'block';
    document.getElementById('div-btn-comparar').style.display = 'none';
}

function compararArrays(array1, array2) {
    const arraySubaPrecios = [];
    const arrayBajaPrecios = [];
    const arrayMismoPrecio = [];
    // ARRAY ITEMS MISMO PRECIO
    array1.forEach(item1 => {
        const item2 = array2.find(item => item.nombre === item1.nombre);
        if (item2 && item1.precio == item2.precio) {
            arrayMismoPrecio.push({
                nombre: item1.nombre,
                precioNuevo: item1.precio,
                precioAnterior: item2.precio
            });
        }
    });
    // ARRAY ITEMS QUE SUBIERON 
    array1.forEach(item1 => {
        const item2 = array2.find(item => item.nombre === item1.nombre);
        if (item2 && item1.precio > item2.precio) {
            arraySubaPrecios.push({
                nombre: item1.nombre,
                precioNuevo: item1.precio,
                precioAnterior: item2.precio
            });
        }
    });
    // ARRAY ITEMS BAJARON PRECIO
    array1.forEach(item1 => {
        const item2 = array2.find(item => item.nombre === item1.nombre);
        if (item2 && item1.precio < item2.precio) {
            arrayBajaPrecios.push({
                nombre: item1.nombre,
                precioNuevo: item1.precio,
                precioAnterior: item2.precio
            });
        }
    });
    return {
        arraySubaPrecios,  //ARRAY DE ITEMS QUE SUBIERON PRECIO};
        arrayBajaPrecios,  //ARRAY DE ITEMS QUE BAJARON PRECIO};
        arrayMismoPrecio   //ARRAY DE ITEMS QUE TIENEN MISMO PRECIO};
    };
}


function abrirAcordeonSubieronPrecio() {
    var botonAcordeon = document.querySelector('#item3-acordeon .accordion-button');
    botonAcordeon.click()
}