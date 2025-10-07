#!/usr/bin/env node
/**
 * scripts/validate-swagger-jsdoc.js
 *
 * Busca bloques JSDoc que contengan @openapi o @swagger en `src/controllers`
 * e intenta parsear el YAML dentro del bloque. Reporta errores de parseo
 * y claves repetidas a nivel de mapeo.
 *
 * Uso:
 *   node scripts/validate-swagger-jsdoc.js
 *
 * Opcional: pasar una ruta base:
 *   node scripts/validate-swagger-jsdoc.js src/controllers
 */

const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');
const yaml = require('js-yaml');
const util = require('util');

const baseDir = process.argv[2] || 'src/controllers';

function stripJSDocStars(block) {
  // Elimina /** */ y el prefijo "*" de cada línea
  return block
    .replace(/^\/\*\*[\r\n]?/,'')
    .replace(/\*\/$/,'')
    .split(/\r?\n/)
    .map(line => line.replace(/^\s*\*\s?/, '')) // elimina leading "* "
    .join('\n')
    .trim();
}

function extractYamlFromBlock(blockText) {
  // Queremos quitar la línea con @openapi o @swagger y devolver el resto.
  const lines = blockText.split(/\r?\n/);
  // Busca la primera línea que contenga "@openapi" o "@swagger"
  let startIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/@openapi\b|@swagger\b/i.test(lines[i])) {
      startIdx = i + 1; // yaml empieza después de esa línea (si hay)
      break;
    }
  }
  // Si la siguiente línea empieza con "/" o con un identificador de path, la incluimos.
  const yamlLines = lines.slice(startIdx);
  return yamlLines.join('\n').trim();
}

function detectDuplicateKeys(yamlText) {
  // Detector simple por indentación:
  // Recorre líneas, toma "key:" y registra la clave por nivel de indentación.
  const lines = yamlText.split(/\r?\n/);
  const stack = []; // array of maps, index = depth
  const issues = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Saltar líneas vacías o que empiecen con '-' (items) o comentarios
    if (/^\s*(#|$)/.test(line)) continue;

    // Match de "key:" (evita valores con "- " al inicio)
    const m = line.match(/^(\s*)([^\s:#\-\[\]\{\}][^:]*):\s*(#.*)?$/);
    if (!m) continue;

    const indent = m[1].length;
    const key = m[2].trim();

    // Determinar nivel por indent (cada 2 spaces aproximado)
    // Usamos la pila para mantener mapas por niveles de indent
    while (stack.length && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    let parent = stack.length ? stack[stack.length - 1].map : null;
    if (!parent) {
      // raíz
      parent = stack.rootMap || (stack.rootMap = new Map());
    }

    // Si clave repetida en el mismo parent -> issue
    if (!parent._keys) parent._keys = new Map();
    const keyMap = parent._keys;
    if (keyMap.has(key)) {
      issues.push({
        line: i + 1,
        key,
        prevLine: keyMap.get(key),
      });
    } else {
      keyMap.set(key, i + 1);
    }

    // Añadimos un nuevo nivel en la pila
    const newMap = { indent, keys: new Set() };
    stack.push({ indent, map: { _keys: new Map() }});
  }

  return issues;
}

(async function main() {
  console.log(`Buscando JSDoc @openapi/@swagger en: ${baseDir}\n`);
  const patterns = [
    `${baseDir.replace(/\\/g,'/')}/**/*.ts`,
    `${baseDir.replace(/\\/g,'/')}/**/*.js`
  ];
  const entries = await fg(patterns, { dot: true });
  if (!entries.length) {
    console.log('No se encontraron archivos en la ruta indicada.');
    process.exit(0);
  }

  let totalBlocks = 0;
  let problems = 0;

  for (const file of entries) {
    const content = fs.readFileSync(file, 'utf8');
    // Buscar bloques /** ... */
    const jsdocBlocks = content.match(/\/\*\*[\s\S]*?\*\//g);
    if (!jsdocBlocks) continue;

    for (const block of jsdocBlocks) {
      const raw = stripJSDocStars(block);
      if (!/@openapi\b|@swagger\b/i.test(raw)) continue; // no es un bloque swagger
      totalBlocks++;

      const yamlText = extractYamlFromBlock(raw);
      if (!yamlText) {
        console.log(`[WARN] ${file} -> bloque @openapi vacío o sin YAML (línea aproximada)`);
        continue;
      }

      // Intentar parsear con js-yaml para errores de sintaxis
      try {
        // Usamos loadAll para permitir múltiples documentos dentro del bloque
        yaml.loadAll(yamlText);
      } catch (err) {
        problems++;
        console.error(`\n[SYN ERROR] ${file}`);
        console.error(`  Error: ${err.message}`);
        // intentar sacar número de línea si js-yaml lo proporciona
        if (err.mark && typeof err.mark.line === 'number') {
          console.error(`  Línea aproximada en bloque: ${err.mark.line + 1}`);
        }
        console.error('  --- bloque YAML ---');
        console.error(yamlText.split(/\r?\n/).slice(0, 200).map((l, idx) => `${idx+1}: ${l}`).join('\n'));
        continue;
      }

      // Detección simple de claves duplicadas por nivel (heurística)
      const dupes = detectDuplicateKeys(yamlText);
      if (dupes.length) {
        problems++;
        console.error(`\n[DUP KEY] ${file} -> detectadas ${dupes.length} claves repetidas (heurística)`);
        for (const d of dupes) {
          console.error(`  Clave "${d.key}" repetida. Línea: ${d.line} (primera aparición: ${d.prevLine})`);
        }
        console.error('  --- bloque YAML (primeras 120 líneas) ---');
        console.error(yamlText.split(/\r?\n/).slice(0, 120).map((l, idx) => `${idx+1}: ${l}`).join('\n'));
      }
    }
  }

  console.log('\nResumen:');
  console.log(`  Bloques @openapi/@swagger analizados: ${totalBlocks}`);
  console.log(`  Problemas detectados: ${problems}`);
  process.exit(problems ? 1 : 0);
})();
