const { deflateRawSync } = require('node:zlib');

const office = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const spreadsheet = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const drawing = 'http://schemas.openxmlformats.org/drawingml/2006';
const green = '24483C';
const gold = 'B58B48';
const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const xml = body => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + body;
const escape = value => String(value ?? '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]/g, '')
 .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const number = value => Number(value) || 0;

// Los libros de Office son archivos ZIP con relaciones entre sus partes XML.
function zip(parts) {
 const files = [], directory = [];
 let offset = 0;
 for (const [path, content] of Object.entries(parts)) {
  const name = Buffer.from(path), data = Buffer.from(xml(content)), compressed = deflateRawSync(data);
  let crc = -1;
  for (const byte of data) {
   crc ^= byte;
   for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
  }
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034B50);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(8, 8);
  local.writeUInt16LE(33, 12);
  local.writeUInt32LE((~crc) >>> 0, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  const entry = Buffer.alloc(46);
  entry.writeUInt32LE(0x02014B50);
  entry.writeUInt16LE(20, 4);
  local.copy(entry, 6, 4, 30);
  entry.writeUInt32LE(offset, 42);
  files.push(local, name, compressed);
  directory.push(entry, name);
  offset += local.length + name.length + compressed.length;
 }
 const end = Buffer.alloc(22);
 end.writeUInt32LE(0x06054B50);
 end.writeUInt16LE(directory.length / 2, 8);
 end.writeUInt16LE(directory.length / 2, 10);
 end.writeUInt32LE(directory.reduce((total, item) => total + item.length, 0), 12);
 end.writeUInt32LE(offset, 16);
 return Buffer.concat([...files, ...directory, end]);
}

const relationships = entries => `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${entries.map(([type, target], i) =>
 `<Relationship Id="rId${i + 1}" Type="${office}/${type}" Target="${target}"/>`).join('')}</Relationships>`;
const font = (size, color, bold = false) => `<font>${bold ? '<b/>' : ''}<sz val="${size}"/><color rgb="FF${color}"/><name val="Calibri"/></font>`;
const fill = color => `<fill><patternFill patternType="solid"><fgColor rgb="FF${color}"/><bgColor indexed="64"/></patternFill></fill>`;
const formats = [
 [0, 0, 0], [1, 2, 0], [2, 2, 0], [3, 3, 0], [4, 4, 3],
 [4, 4, 164], [2, 2, 0], [0, 4, 0], [0, 4, 3], [0, 4, 164],
 [0, 0, 3], [0, 0, 164], [5, 0, 0]
];
const styles = `<styleSheet xmlns="${spreadsheet}">
 <numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;COP&quot; #,##0.##"/></numFmts>
 <fonts count="6">${font(11, '263A33')}${font(23, 'FFFFFF', true)}${font(11, 'FFFFFF', true)}${font(11, green, true)}${font(19, green, true)}${font(10, '51665D')}</fonts>
 <fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>${fill(green)}${fill('EDE1C7')}${fill('EDF4EF')}</fills>
 <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
 <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
 <cellXfs count="${formats.length}">${formats.map(([f, b, n]) =>
 `<xf numFmtId="${n}" fontId="${f}" fillId="${b}" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>`).join('')}</cellXfs>
 <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
 </styleSheet>`;

function makeSheet(report, sections) {
 const rows = [], merges = [];
 const add = (height, values, stylesForRow) => {
  const row = rows.length + 1;
  const cells = values.map((value, i) => {
   const attributes = `r="${'ABC'[i]}${row}" s="${stylesForRow[i] || 0}"`;
   return typeof value === 'number' ? `<c ${attributes}><v>${value}</v></c>` :
    `<c ${attributes} t="inlineStr"><is><t xml:space="preserve">${escape(value)}</t></is></c>`;
  });
  rows.push(`<row r="${row}" ht="${height}" customHeight="1">${cells.join('')}</row>`);
 };
 const banner = (height, label, style) => {
  const row = rows.length + 1;
  merges.push(`<mergeCell ref="A${row}:C${row}"/>`);
  add(height, [label, '', ''], [style, style, style]);
 };
 banner(37, 'Dapa Glamping  |  Informe semanal', 1);
 banner(24, `Desde ${report.inicio}  ·  Hasta ${report.finExclusivo} (fecha excluida)`, 2);
 add(9, [], []);
 add(24, ['Reservas confirmadas o completadas', 'Clientes identificados', 'Importe acordado'], [3, 3, 3]);
 add(33, [number(report.resumen.reservas), number(report.resumen.clientes), number(report.resumen.ingresos)], [4, 4, 5]);
 banner(30, 'El importe corresponde al valor acordado de las reservas. Los pagos se verifican por separado.', 12);
 banner(30, 'El tono más oscuro destaca el mayor total de cada gráfico. El gris identifica las reservas sin spa.', 12);
 for (const section of sections) {
  add(10, [], []);
  banner(23, section.title, 6);
  add(23, section.headers, [3, 3, 3]);
  section.firstRow = rows.length + 1;
  if (!section.rows.length) banner(22, 'Sin reservas para esta categoría.', 12);
  section.rows.forEach((values, i) => add(21, values, i % 2 ? [0, 10, 11] : [7, 8, 9]));
 }
 return `<worksheet xmlns="${spreadsheet}" xmlns:r="${office}">
 <sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>
 <sheetFormatPr defaultRowHeight="18"/><cols><col min="1" max="1" width="38" customWidth="1"/><col min="2" max="3" width="24" customWidth="1"/><col min="4" max="4" width="4" customWidth="1"/><col min="5" max="13" width="13" customWidth="1"/></cols>
 <sheetData>${rows.join('')}</sheetData><mergeCells count="${merges.length}">${merges.join('')}</mergeCells><drawing r:id="rId1"/>
 </worksheet>`;
}

function makeChart({ title, firstRow, rows, color, highlight }) {
 const last = firstRow + rows.length - 1;
 const maximum = rows.reduce((max, [label, count]) => label === 'Sin spa' ? max : Math.max(max, count), 0);
 const bars = rows.map(([label, count], i) => {
  const shade = label === 'Sin spa' ? '8D9896' : count > 0 && count === maximum ? highlight : color;
  return `<c:dPt><c:idx val="${i}"/><c:spPr><a:solidFill><a:srgbClr val="${shade}"/></a:solidFill></c:spPr></c:dPt>`;
 }).join('');
 const points = col => rows.map((row, i) => `<c:pt idx="${i}"><c:v>${escape(row[col])}</c:v></c:pt>`).join('');
 const range = col => `'Informe semanal'!$${col}$${firstRow}:$${col}$${last}`;
 return `<c:chartSpace xmlns:c="${drawing}/chart" xmlns:a="${drawing}/main">
 <c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="es-CO" sz="1500" b="1"/><a:t>${escape(title)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>
 <c:plotArea><c:layout/><c:barChart><c:barDir val="bar"/><c:grouping val="clustered"/><c:ser><c:idx val="0"/><c:order val="0"/>${bars}
 <c:cat><c:strRef><c:f>${range('A')}</c:f><c:strCache><c:ptCount val="${rows.length}"/>${points(0)}</c:strCache></c:strRef></c:cat>
 <c:val><c:numRef><c:f>${range('B')}</c:f><c:numCache><c:formatCode>0</c:formatCode><c:ptCount val="${rows.length}"/>${points(1)}</c:numCache></c:numRef></c:val>
 </c:ser><c:dLbls><c:dLblPos val="outEnd"/><c:showVal val="1"/></c:dLbls><c:gapWidth val="50"/><c:axId val="10"/><c:axId val="20"/></c:barChart>
 <c:catAx><c:axId val="10"/><c:scaling><c:orientation val="maxMin"/></c:scaling><c:axPos val="l"/><c:crossAx val="20"/><c:crosses val="autoZero"/></c:catAx>
 <c:valAx><c:axId val="20"/><c:scaling><c:orientation val="minMax"/><c:min val="0"/></c:scaling><c:axPos val="b"/><c:majorGridlines/><c:numFmt formatCode="0" sourceLinked="0"/><c:crossAx val="10"/><c:crosses val="max"/><c:crossBetween val="between"/></c:valAx>
 </c:plotArea><c:plotVisOnly val="1"/></c:chart></c:chartSpace>`;
}

function makeDrawing(charts) {
 const marker = (tag, column, row) => `<xdr:${tag}><xdr:col>${column}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:${tag}>`;
 return `<xdr:wsDr xmlns:xdr="${drawing}/spreadsheetDrawing" xmlns:a="${drawing}/main" xmlns:r="${office}">
 ${charts.map(({ title }, i) => `<xdr:twoCellAnchor>${marker('from', 4, i * 15)}${marker('to', 12, i * 15 + 14)}
 <xdr:graphicFrame><xdr:nvGraphicFramePr><xdr:cNvPr id="${i + 1}" name="${escape(title)}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>
 <xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>
 <a:graphic><a:graphicData uri="${drawing}/chart"><c:chart xmlns:c="${drawing}/chart" r:id="rId${i + 1}"/></a:graphicData></a:graphic></xdr:graphicFrame>
 <xdr:clientData/></xdr:twoCellAnchor>`).join('')}</xdr:wsDr>`;
}

function reportWorkbook(report) {
 const countsByDay = new Map(report.dias.map(({ dia, reservas }) => [number(dia), number(reservas)]));
 const countsBySpa = new Map();
 for (const { spa, reservas } of report.serviciosSpa) {
  const service = !spa || spa === 'Ninguno' ? 'Sin spa' : spa;
  countsBySpa.set(service, (countsBySpa.get(service) || 0) + number(reservas));
 }
 const sections = [
  { title: 'Reservas por alojamiento', headers: ['Alojamiento', 'Reservas', 'Importe acordado'], color: '6C9D7F', highlight: green,
   rows: report.habitaciones.map(r => [r.suite, number(r.reservas), number(r.ingresos)]) },
  { title: 'Llegadas por día de la semana', headers: ['Día', 'Reservas'], color: gold, highlight: '785622',
   rows: days.map((day, i) => [day, countsByDay.get(i + 1) || 0]) },
  { title: 'Reservas por servicio de spa', headers: ['Servicio', 'Reservas'], color: '63A6A3', highlight: '286B70',
   rows: [...countsBySpa].sort((a, b) => b[1] - a[1]) }
 ];
 const charts = sections.filter(section => section.rows.length);
 const chartParts = charts.map((_, i) => `xl/charts/chart${i + 1}.xml`);
 const types = [
  ['xl/workbook.xml', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml'],
  ['xl/worksheets/sheet1.xml', 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml'],
  ['xl/styles.xml', 'application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml'],
  ['xl/drawings/drawing1.xml', 'application/vnd.openxmlformats-officedocument.drawing+xml'],
  ...chartParts.map(path => [path, 'application/vnd.openxmlformats-officedocument.drawingml.chart+xml'])
 ];
 return zip({
  '[Content_Types].xml': `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${types.map(([path, type]) => `<Override PartName="/${path}" ContentType="${type}"/>`).join('')}</Types>`,
  '_rels/.rels': relationships([['officeDocument', 'xl/workbook.xml']]),
  'xl/workbook.xml': `<workbook xmlns="${spreadsheet}" xmlns:r="${office}"><bookViews><workbookView/></bookViews><sheets><sheet name="Informe semanal" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  'xl/_rels/workbook.xml.rels': relationships([['worksheet', 'worksheets/sheet1.xml'], ['styles', 'styles.xml']]),
  'xl/styles.xml': styles,
  'xl/worksheets/sheet1.xml': makeSheet(report, sections),
  'xl/worksheets/_rels/sheet1.xml.rels': relationships([['drawing', '../drawings/drawing1.xml']]),
  'xl/drawings/drawing1.xml': makeDrawing(charts),
  'xl/drawings/_rels/drawing1.xml.rels': relationships(chartParts.map(path => ['chart', '../' + path.slice(3)])),
  ...Object.fromEntries(chartParts.map((path, i) => [path, makeChart(charts[i])]))
 });
}

module.exports = reportWorkbook;
