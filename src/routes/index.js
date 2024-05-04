import { Router } from "express";
import multer from 'multer';
import { join, extname } from 'path';
import { createRequire } from 'module';
// import { PdfReader } from "pdfreader";
import ExcelJS from 'exceljs';
import pdfParser from 'pdf2json';

const require = createRequire(import.meta.url);
const fs = require('fs');
const PDFParser = require('pdf2json');
const pdfToExcel = require('pdf-to-excel');
const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './src/uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + extname(file.originalname))
  }
});
const upload = multer({ dest: './src/uploads/' });

const pdf_table_extractor = require("pdf-table-extractor");


router.get("/", (req, res) => {
  res.render("index", { title: "COMPARADOR DE PRECIOS" });
});

router.get("/about", (req, res) => {
  res.render("about", { title: "About First Node Website" });
});

router.get("/contact", (req, res) => {
  res.render("contact", { title: "Contact Page" });
});

// COMPARAR
// let datosLadoA = [];
// let datosLadoB = [];

function success(result) {
  // console.log(JSON.stringify(result));
}

//Error
function error(err) {
  console.error('Error: ' + err);
}


function processPDF(pdfFilePath) {
}


router.get("/comparar", (req, res) => {
  res.render("comparar", { title: "COMPARAR PRECIOS" });
});


const path = require('path');

router.post("/convertir-excel", upload.single('archivo'), (req, res) => {
  const file = req.file;
  
  let outputPath = null;

  try {
    if(file === undefined || file === null){
      res.json({tipo: "error", text: 'No se ha seleccionado un archivo'});
    }
    const lado = req.body.lado;
    //archivos TECNO CLEAN
    if (lado === 'B') {
      //luego de que lo convierte, lo leo y lo envio a la vista al fetch
      const workbook = new ExcelJS.Workbook();
      workbook.xlsx.readFile(file.path)
        .then(() => {
          const worksheet = workbook.getWorksheet(1);
          const productos = [];
          worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber > 1) {
              const nombre = row.getCell(2).value;
              const precio = row.getCell(8).value.toString().replace(',', '.');
              if (nombre && precio) {
                productos.push({ nombre, precio });
              }
            }
          });
          res.json({productos: productos, tipo: "success"});
        });

    } else { //ARCHIVOS PROVEEDORES

      if(file === undefined || file === null){
        res.json({tipo: "error", text: 'No se ha seleccionado un archivo'});
      }
      //si es un archivo excel, OBTENGO DIRECTO SUS SATOS Y LOS ENVIO
      if (file && file.mimetype === 'application/xlsx' || file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        const workbook = new ExcelJS.Workbook();
        workbook.xlsx.readFile(file.path)
          .then(() => {
            const worksheet = workbook.getWorksheet(1);
            const productos = [];
            let nombre;
            worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
              if (rowNumber > 1) {
                const nombreCell = row.getCell(1).value;
                if (nombreCell.richText && nombreCell.richText.length > 0) {
                  nombre = nombreCell.richText[0].text;
                } else {
                  // Si no hay texto en formato "richText", obtén el valor directamente
                  nombre = nombreCell;
                }
                const precio = row.getCell(2).value.toString().replace(',', '.');
                if (nombre && precio) {
                  productos.push({ nombre, precio });
                }
              }
            });
            // console.log(productos);
            res.json({productos: productos, tipo: "success"});
          });
      } else {
        //SINO convierto el pdf en excel y lo guardo en outputs
        outputPath = path.join(process.cwd(), 'src', 'outputs', file.filename + '.xlsx');

        pdfToExcel.genXlsx(file.path, outputPath).then(
          () => {
            //luego de que lo convierte, lo leo y lo envio a la vista al fetch
            const workbook = new ExcelJS.Workbook();
            workbook.xlsx.readFile(outputPath)
              .then(() => {
                const worksheet = workbook.getWorksheet(1);
                const productos = [];
                worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                  if (rowNumber > 1) {
                    const nombre = row.getCell(1).value;
                    const precio = row.getCell(2).value.toString().replace(',', '.');
                    if (nombre && precio) {
                      productos.push({ nombre, precio });
                    }
                  }
                });
                res.json({productos: productos, tipo: "success"});
              });
          }
        );
      }
    }
  }
  catch (error) {
    console.log(error);
  }

});





export default router;
