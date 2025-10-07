const fs = require('fs-extra');
const path = require('path');

// Directorios de origen y destino
const backendTypesDir = path.join(__dirname, '../backend/src/types');
const frontendTypesDir = path.join(__dirname, '../web/src/types/backend');

// Asegurarse de que el directorio de destino exista
fs.ensureDirSync(frontendTypesDir);

// Archivos de tipos que queremos copiar
const filesToCopy = [
  'section.types.ts',
  'user.types.ts',
  'course.types.ts',
  'lesson.types.ts',
  // Agrega aquí otros archivos de tipos según sea necesario
];

// Copiar cada archivo
filesToCopy.forEach(file => {
  const source = path.join(backendTypesDir, file);
  const dest = path.join(frontendTypesDir, file);
  
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, dest);
    console.log(`Copiado: ${file}`);
  } else {
    console.warn(`Advertencia: No se encontró el archivo ${file} en el backend`);
  }
});

console.log('Tipos copiados exitosamente!');
