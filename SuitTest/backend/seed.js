const fs = require('fs');
const path = require('path');
const DATA_FILE = path.join(__dirname, 'data', 'contactos.json');

const contactos = [
  { id: 'CONT-001', nombre: 'Ana García', email: 'ana@empresa.com', telefono: '+52 555 100 2001', notas: 'Cliente premium', id_empresa: 'empresa-001', activo: true, creado: new Date().toISOString(), actualizado: new Date().toISOString() },
  { id: 'CONT-002', nombre: 'Carlos López', email: 'carlos@empresa.com', telefono: '+52 555 100 2002', notas: 'Contacto recurrente', id_empresa: 'empresa-001', activo: true, creado: new Date().toISOString(), actualizado: new Date().toISOString() },
  { id: 'CONT-003', nombre: 'María Torres', email: 'maria@otra-empresa.com', telefono: '+52 555 200 3001', notas: 'Lead nuevo', id_empresa: 'empresa-002', activo: true, creado: new Date().toISOString(), actualizado: new Date().toISOString() },
  { id: 'CONT-004', nombre: 'Pedro Ramírez', email: 'pedro@otra-empresa.com', telefono: '+52 555 200 3002', notas: '', id_empresa: 'empresa-002', activo: true, creado: new Date().toISOString(), actualizado: new Date().toISOString() },
  { id: 'CONT-005', nombre: 'Lucía Fernández', email: 'lucia@demo.com', telefono: '+52 555 300 4001', notas: 'Contacto inactivo (demo)', id_empresa: 'empresa-001', activo: false, creado: new Date().toISOString(), actualizado: new Date().toISOString() }
];

fs.writeFileSync(DATA_FILE, JSON.stringify(contactos, null, 2), 'utf8');
console.log(`Seed completado: ${contactos.length} contactos (4 activos, 1 inactivo)`);
console.log('Tenants: empresa-001 (3), empresa-002 (2)');
