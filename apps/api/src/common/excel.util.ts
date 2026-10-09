import * as XLSX from 'xlsx';

export type SheetRow = Record<string, any>;

/** Normaliza texto: minusculas, sin tildes, sin espacios dobles. */
export function normalizeText(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Lee la primera hoja (o la indicada) como filas con encabezados normalizados. */
export function readSheetRows(buffer: Buffer, sheetName?: string): { rows: SheetRow[]; headers: string[]; sheet: string } {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const name = sheetName && wb.SheetNames.includes(sheetName) ? sheetName : wb.SheetNames[0];
  const ws = wb.Sheets[name];
  if (!ws) return { rows: [], headers: [], sheet: name };
  const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });
  // Buscar la fila de encabezados: primera fila con >= 2 celdas de texto
  let headerIdx = raw.findIndex(r => r && r.filter(c => typeof c === 'string' && c.trim()).length >= 2);
  if (headerIdx < 0) return { rows: [], headers: [], sheet: name };
  const headers = raw[headerIdx].map(h => normalizeText(h));
  const rows: SheetRow[] = [];
  for (let i = headerIdx + 1; i < raw.length; i++) {
    const r = raw[i];
    if (!r || r.every(c => c === null || c === undefined || String(c).trim() === '')) continue;
    const obj: SheetRow = { __row: i + 1 };
    headers.forEach((h, idx) => { if (h) obj[h] = r[idx]; });
    rows.push(obj);
  }
  return { rows, headers, sheet: name };
}

/** Devuelve el valor de la primera columna que coincida con alguno de los alias. */
export function pick(row: SheetRow, aliases: string[]): any {
  for (const a of aliases) {
    const key = normalizeText(a);
    if (key in row && row[key] !== null && row[key] !== undefined && String(row[key]).trim() !== '') return row[key];
  }
  return undefined;
}

export function toInt(value: any): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

export function toDateISO(value: any): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return isNaN(value.getTime()) ? undefined : value.toISOString().slice(0, 10);
  if (typeof value === 'number') {
    const d = XLSX.SSF.parse_date_code(value);
    if (!d) return undefined;
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const s = String(value).trim();
  const m1 = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m1) return `${m1[1]}-${m1[2].padStart(2, '0')}-${m1[3].padStart(2, '0')}`;
  const m2 = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
  if (m2) return `${m2[3]}-${m2[2].padStart(2, '0')}-${m2[1].padStart(2, '0')}`;
  return undefined;
}

/** Construye un workbook a partir de hojas [nombre, filas(aoa), anchos]. */
export function buildWorkbook(sheets: { name: string; rows: any[][]; widths?: number[] }[]): Buffer {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(s.rows);
    if (s.widths) ws['!cols'] = s.widths.map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  }
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}

/** Separa un nombre completo en nombre y apellido. */
export function splitFullName(full: string): { firstName: string; lastName: string } {
  const parts = String(full).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  if (parts.length === 2) return { firstName: parts[0], lastName: parts[1] };
  if (parts.length === 3) return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
  return { firstName: parts.slice(0, 2).join(' '), lastName: parts.slice(2).join(' ') };
}

export const POSITION_ALIASES: Record<string, string> = {
  portero: 'GOALKEEPER', arquero: 'GOALKEEPER', guardameta: 'GOALKEEPER', goalkeeper: 'GOALKEEPER', gk: 'GOALKEEPER', por: 'GOALKEEPER',
  defensa: 'DEFENDER', defensor: 'DEFENDER', defender: 'DEFENDER', def: 'DEFENDER', lateral: 'DEFENDER', central: 'DEFENDER', zaguero: 'DEFENDER', libero: 'DEFENDER', 'defensa central': 'DEFENDER', 'lateral derecho': 'DEFENDER', 'lateral izquierdo': 'DEFENDER',
  mediocampista: 'MIDFIELDER', medio: 'MIDFIELDER', volante: 'MIDFIELDER', midfielder: 'MIDFIELDER', med: 'MIDFIELDER', mc: 'MIDFIELDER', mediocentro: 'MIDFIELDER', 'volante de marca': 'MIDFIELDER', 'volante mixto': 'MIDFIELDER', 'volante creativo': 'MIDFIELDER', enganche: 'MIDFIELDER', centrocampista: 'MIDFIELDER',
  delantero: 'FORWARD', atacante: 'FORWARD', forward: 'FORWARD', del: 'FORWARD', dc: 'FORWARD', extremo: 'FORWARD', punta: 'FORWARD', puntero: 'FORWARD', ariete: 'FORWARD', 'centro delantero': 'FORWARD', centrodelantero: 'FORWARD',
};

export const DOCUMENT_ALIASES: Record<string, string> = {
  cc: 'CEDULA_CIUDADANIA', cedula: 'CEDULA_CIUDADANIA', 'cedula de ciudadania': 'CEDULA_CIUDADANIA', cedula_ciudadania: 'CEDULA_CIUDADANIA',
  ce: 'CEDULA_EXTRANJERIA', 'cedula de extranjeria': 'CEDULA_EXTRANJERIA', cedula_extranjeria: 'CEDULA_EXTRANJERIA',
  ti: 'TARJETA_IDENTIDAD', 'tarjeta de identidad': 'TARJETA_IDENTIDAD', tarjeta_identidad: 'TARJETA_IDENTIDAD',
  pasaporte: 'PASAPORTE', pa: 'PASAPORTE', passport: 'PASAPORTE',
  nit: 'NIT',
};

export const GENDER_ALIASES: Record<string, string> = {
  m: 'MALE', masculino: 'MALE', hombre: 'MALE', male: 'MALE',
  f: 'FEMALE', femenino: 'FEMALE', mujer: 'FEMALE', female: 'FEMALE',
  'no binario': 'NON_BINARY', nb: 'NON_BINARY',
};
