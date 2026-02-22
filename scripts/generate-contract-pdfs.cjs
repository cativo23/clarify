const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const contractsDir = path.join(__dirname, '..', 'tests', 'contracts');
const outputDir = path.join(__dirname, '..', 'tests', 'contracts', 'pdf');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Contract files to process
const contractFiles = [
  { input: 'contrato-alto-riesgo.txt', output: 'contrato-alto-riesgo.pdf', title: 'CONTRATO DE PRESTACIÓN DE SERVICIOS - ALTO RIESGO' },
  { input: 'contrato-medio-riesgo.txt', output: 'contrato-medio-riesgo.pdf', title: 'CONTRATO DE LICENCIA DE SOFTWARE - RIESGO MEDIO' },
  { input: 'contrato-bajo-riesgo.txt', output: 'contrato-bajo-riesgo.pdf', title: 'CONTRATO DE SERVICIOS DIGITALES - BAJO RIESGO' },
  { input: 'contrato-sin-riesgo.txt', output: 'contrato-sin-riesgo.pdf', title: 'CONTRATO DE SERVICIOS PROFESIONALES - SIN RIESGO' }
];

function parseContractContent(content) {
  const lines = content.split('\n');
  const sections = [];
  let currentSection = { title: '', items: [] };
  let inTable = false;
  let tableRows = [];

  for (const line of lines) {
    // Detect table start (line with |)
    if (line.includes('|') && line.trim().startsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      // Skip separator row (|---|---|)
      if (!line.match(/^\|\s*[-:]+\s*\|/)) {
        const cells = line.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim());
        if (cells.length > 0) {
          tableRows.push(cells);
        }
      }
      continue;
    } else if (inTable) {
      // End of table
      inTable = false;
      currentSection.items.push({ type: 'table', rows: tableRows });
      tableRows = [];
    }

    if (line.startsWith('## ')) {
      if (currentSection.title || currentSection.items.length > 0) {
        sections.push({ ...currentSection });
      }
      currentSection = { title: line.replace('## ', '').trim(), items: [] };
    } else if (line.startsWith('### ')) {
      currentSection.items.push({ type: 'subsection', text: line.replace('### ', '').trim() });
    } else if (line.startsWith('- ')) {
      currentSection.items.push({ type: 'bullet', text: line.replace('- ', '').trim() });
    } else if (line.trim() && !line.startsWith('#')) {
      currentSection.items.push({ type: 'text', text: line.trim() });
    }
  }

  // Close any open table
  if (inTable && tableRows.length > 0) {
    currentSection.items.push({ type: 'table', rows: tableRows });
  }

  if (currentSection.title || currentSection.items.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

function generatePDF(contract) {
  return new Promise((resolve, reject) => {
    const inputPath = path.join(contractsDir, contract.input);
    const outputPath = path.join(outputDir, contract.output);

    console.log(`Generating: ${contract.output}`);

    const content = fs.readFileSync(inputPath, 'utf-8');
    const sections = parseContractContent(content);

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Register fonts (using built-in fonts)
    const boldFont = doc.font('Helvetica-Bold');

    // Title page
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text(contract.title, { align: 'center', top: 100 })
      .moveDown(2)
      .fontSize(12)
      .font('Helvetica')
      .text('Documento de prueba para sistema de análisis de contratos Clarify', { align: 'center' })
      .moveDown(3)
      .fontSize(10)
      .text('Este documento es un ejemplo de contrato generado para propósitos de testing.', { align: 'center' })
      .text('Contiene cláusulas diseñadas para evaluar el sistema de categorización de riesgos.', { align: 'center' })
      .moveDown(2)
      .text(`Nivel de riesgo: ${contract.input.includes('alto') ? 'ALTO' : contract.input.includes('medio') ? 'MEDIO' : contract.input.includes('bajo') ? 'BAJO' : 'NINGUNO'}`, { align: 'center' })
      .moveDown(4);

    // Add page break
    doc.addPage();

    // Content
    let firstSection = true;
    for (const section of sections) {
      if (!firstSection) {
        doc.moveDown(0.5);
      }
      firstSection = false;

      if (section.title) {
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text(section.title, { underline: true })
          .moveDown(0.5);
      }

      for (const item of section.items) {
        if (item.type === 'subsection') {
          doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .text(item.text, { bold: true })
            .moveDown(0.3);
        } else if (item.type === 'bullet') {
          doc
            .fontSize(10)
            .font('Helvetica')
            .list([item.text], { bulletIndent: 20, indent: 30 })
            .moveDown(0.2);
        } else if (item.type === 'table') {
          // Render table with borders
          const startY = doc.y;
          const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
          const numCols = item.rows[0] ? item.rows[0].length : 1;
          const colWidth = pageWidth / numCols;
          const rowHeight = 22;
          const totalRows = item.rows.length;

          // Save current graphics state
          doc.save();

          // Draw table
          for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
            const row = item.rows[rowIndex];
            const isHeader = rowIndex === 0;
            const cellY = startY + (rowIndex * rowHeight);

            // Draw row background for header
            if (isHeader) {
              doc.fillColor('#f3f4f6');
              doc.rect(doc.page.margins.left, cellY, pageWidth, rowHeight).fill();
            }

            // Draw cells
            for (let colIndex = 0; colIndex < numCols; colIndex++) {
              const cellX = doc.page.margins.left + (colIndex * colWidth);

              // Draw cell border
              doc.strokeColor('#374151');
              doc.rect(cellX, cellY, colWidth, rowHeight).stroke();

              // Draw cell text
              const cellText = row[colIndex] || '';
              doc
                .fontSize(isHeader ? 10 : 9)
                .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
                .fillColor('#000000')
                .text(cellText, cellX + 5, cellY + 3, {
                  width: colWidth - 10,
                  height: rowHeight - 6,
                  align: 'left',
                  baseline: 'top'
                });
            }
          }

          // Restore graphics state to reset colors
          doc.restore();

          // Position cursor after table
          doc.y = startY + (totalRows * rowHeight) + 15;
        } else {
          doc
            .fontSize(10)
            .font('Helvetica')
            .text(item.text, { align: 'justify' })
            .moveDown(0.3);
        }
      }

      doc.moveDown(0.3);
    }

    // Footer with page number on current page
    doc
      .fontSize(8)
      .font('Helvetica')
      .text('Página ' + doc.page.number, {
        align: 'center',
        top: doc.page.height - 30
      });

    doc.end();

    stream.on('finish', () => {
      console.log(`✓ Generated: ${outputPath}`);
      resolve();
    });

    stream.on('error', reject);
  });
}

async function main() {
  console.log('Generating contract PDFs...\n');

  for (const contract of contractFiles) {
    await generatePDF(contract);
  }

  console.log('\n✓ All PDFs generated successfully!');
  console.log(`Output directory: ${outputDir}`);
}

main().catch(console.error);
