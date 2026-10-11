export type PeruLocationCatalog = Record<string, Record<string, string[]>>

// Catálogo local para no depender de un servicio externo al registrar un
// almacén. Provincia y distrito siempre se derivan de la selección anterior.
export const peruLocations: PeruLocationCatalog = {
  Amazonas: { Chachapoyas: ['Chachapoyas', 'Asunción', 'Balsas', 'Cheto', 'Chiliquín', 'Chuquibamba', 'Granada', 'Huancas', 'La Jalca', 'Leimebamba', 'Levanto', 'Magdalena', 'Mariscal Castilla', 'Molinopampa', 'Montevideo', 'Olleros', 'Quinjalca', 'San Francisco de Daguas', 'San Isidro de Maino', 'Soloco', 'Sonche'] },
  Áncash: { Huaraz: ['Huaraz', 'Cochabamba', 'Colcabamba', 'Huanchay', 'Independencia', 'Jangas', 'La Libertad', 'Olleros', 'Pira', 'Taricá'], Santa: ['Chimbote', 'Cáceres del Perú', 'Coishco', 'Macate', 'Moro', 'Nepeña', 'Nuevo Chimbote', 'Samanco', 'Santa'] },
  Apurímac: { Abancay: ['Abancay', 'Chacoche', 'Circa', 'Curahuasi', 'Huanipaca', 'Lambrama', 'Pichirhua', 'San Pedro de Cachora', 'Tamburco'] },
  Arequipa: { Arequipa: ['Arequipa', 'Alto Selva Alegre', 'Cayma', 'Cerro Colorado', 'Characato', 'Chiguata', 'Jacobo Hunter', 'José Luis Bustamante y Rivero', 'La Joya', 'Mariano Melgar', 'Miraflores', 'Mollebaya', 'Paucarpata', 'Pocsi', 'Polobaya', 'Quequeña', 'Sabandía', 'Sachaca', 'San Juan de Siguas', 'San Juan de Tarucani', 'Santa Isabel de Siguas', 'Santa Rita de Siguas', 'Socabaya', 'Tiabaya', 'Uchumayo', 'Vitor', 'Yanahuara', 'Yarabamba', 'Yura'] },
  Ayacucho: { Huamanga: ['Ayacucho', 'Acocro', 'Acos Vinchos', 'Carmen Alto', 'Chiara', 'Jesús Nazareno', 'Ocros', 'Pacaycasa', 'Quinua', 'San José de Ticllas', 'San Juan Bautista', 'Santiago de Pischa', 'Socos', 'Tambillo', 'Vinchos'] },
  Cajamarca: { Cajamarca: ['Cajamarca', 'Asunción', 'Chetilla', 'Cospán', 'Encañada', 'Jesús', 'Llacanora', 'Los Baños del Inca', 'Magdalena', 'Matara', 'Namora', 'San Juan'] },
  Callao: { Callao: ['Callao', 'Bellavista', 'Carmen de la Legua Reynoso', 'La Perla', 'La Punta', 'Mi Perú', 'Ventanilla'] },
  Cusco: { Cusco: ['Cusco', 'Ccorca', 'Poroy', 'San Jerónimo', 'San Sebastián', 'Santiago', 'Saylla', 'Wanchaq'] },
  Huancavelica: { Huancavelica: ['Huancavelica', 'Acobambilla', 'Acoria', 'Conayca', 'Cuenca', 'Huachocolpa', 'Huayllahuara', 'Izcuchaca', 'Laria', 'Manta', 'Mariscal Cáceres', 'Moya', 'Nuevo Occoro', 'Palca', 'Pilchaca', 'Vilca', 'Yauli'] },
  Huánuco: { Huánuco: ['Huánuco', 'Amarilis', 'Chinchao', 'Churubamba', 'Margos', 'Pillco Marca', 'Quisqui', 'San Francisco de Cayrán', 'San Pedro de Chaulán', 'Santa María del Valle', 'Yarumayo'] },
  Ica: { Ica: ['Ica', 'La Tinguiña', 'Los Aquijes', 'Ocucaje', 'Pachacútec', 'Parcona', 'Pueblo Nuevo', 'Salas', 'San José de los Molinos', 'San Juan Bautista', 'Santiago', 'Subtanjalla', 'Tate', 'Yauca del Rosario'] },
  Junín: { Huancayo: ['Huancayo', 'Carhuacallanga', 'Chacapampa', 'Chicche', 'Chilca', 'Chongos Alto', 'Chupuro', 'Colca', 'Cullhuas', 'El Tambo', 'Huacrapuquio', 'Hualhuas', 'Huancán', 'Huasicancha', 'Huayucachi', 'Ingenio', 'Pariahuanca', 'Pilcomayo', 'Pucará', 'Quichuay', 'Quilcas', 'San Agustín', 'San José de Quero', 'Santo Domingo de Acobamba', 'Sapallanga', 'Sicaya', 'Viques'] },
  'La Libertad': { Trujillo: ['Trujillo', 'El Porvenir', 'Florencia de Mora', 'Huanchaco', 'La Esperanza', 'Laredo', 'Moche', 'Poroto', 'Salaverry', 'Simbal', 'Víctor Larco Herrera'] },
  Lambayeque: { Chiclayo: ['Chiclayo', 'Cayaltí', 'Chongoyape', 'Etén', 'Etén Puerto', 'José Leonardo Ortiz', 'La Victoria', 'Lagunas', 'Monsefú', 'Nueva Arica', 'Oyotún', 'Picsi', 'Pimentel', 'Reque', 'Santa Rosa', 'Saña', 'Tumán'] },
  Lima: { Lima: ['Lima', 'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos', 'Cieneguilla', 'Comas', 'El Agustino', 'Independencia', 'Jesús María', 'La Molina', 'La Victoria', 'Lince', 'Los Olivos', 'Lurigancho', 'Lurín', 'Magdalena del Mar', 'Miraflores', 'Pachacámac', 'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa', 'Punta Negra', 'Rímac', 'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores', 'San Luis', 'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar', 'Santa Rosa', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo'], Barranca: ['Barranca', 'Paramonga', 'Pativilca', 'Supe', 'Supe Puerto'], Cañete: ['San Vicente de Cañete', 'Asia', 'Calango', 'Cerro Azul', 'Chilca', 'Coayllo', 'Imperial', 'Lunahuaná', 'Mala', 'Nuevo Imperial', 'Pacarán', 'Quilmaná', 'San Antonio', 'San Luis', 'Santa Cruz de Flores', 'Zúñiga'], Huaral: ['Huaral', 'Atavillos Alto', 'Atavillos Bajo', 'Aucallama', 'Chancay', 'Ihuarí', 'Lampían', 'Pacaraos', 'San Miguel de Acos', 'Santa Cruz de Andamarca', 'Sumbilca', 'Veintisiete de Noviembre'], Huaura: ['Huacho', 'Ámbar', 'Caleta de Carquín', 'Checras', 'Hualmay', 'Huaura', 'Leoncio Prado', 'Paccho', 'Santa Leonor', 'Santa María', 'Sayán', 'Végueta'] },
  Loreto: { Maynas: ['Iquitos', 'Alto Nanay', 'Fernando Lores', 'Indiana', 'Las Amazonas', 'Mazan', 'Napo', 'Punchana', 'Putumayo', 'Torres Causana', 'Belén', 'San Juan Bautista', 'Teniente Manuel Clavero'] },
  'Madre de Dios': { Tambopata: ['Tambopata', 'Inambari', 'Las Piedras', 'Laberinto'] },
  Moquegua: { 'Mariscal Nieto': ['Moquegua', 'Carumas', 'Cuchumbaya', 'Samegua', 'San Cristóbal', 'Torata'] },
  Pasco: { Pasco: ['Chaupimarca', 'Huachón', 'Huariaca', 'Huayllay', 'Ninacaca', 'Pallanchacra', 'Paucartambo', 'San Francisco de Asís de Yarusyacán', 'Simón Bolívar', 'Ticlacayán', 'Tinyahuarco', 'Vicco', 'Yanacancha'] },
  Piura: { Piura: ['Piura', 'Castilla', 'Catacaos', 'Cura Mori', 'El Tallán', 'La Arena', 'La Unión', 'Las Lomas', 'Tambo Grande', 'Veintiséis de Octubre'] },
  Puno: { Puno: ['Puno', 'Acora', 'Amantaní', 'Atuncolla', 'Capachica', 'Chucuito', 'Coata', 'Huata', 'Mañazo', 'Paucarcolla', 'Pichacani', 'Platería', 'San Antonio', 'Tiquillaca', 'Vilque'] },
  'San Martín': { Moyobamba: ['Moyobamba', 'Calzada', 'Habana', 'Jepelacio', 'Soritor', 'Yantalo'] },
  Tacna: { Tacna: ['Tacna', 'Alto de la Alianza', 'Calana', 'Ciudad Nueva', 'Coronel Gregorio Albarracín Lanchipa', 'Inclán', 'La Yarada Los Palos', 'Pachía', 'Palca', 'Pocollay', 'Sama'] },
  Tumbes: { Tumbes: ['Tumbes', 'Corrales', 'La Cruz', 'Pampas de Hospital', 'San Jacinto', 'San Juan de la Virgen'] },
  Ucayali: { 'Coronel Portillo': ['Callería', 'Campoverde', 'Ipacía', 'Manantay', 'Masisea', 'Nueva Requena', 'Yarinacocha'] },
}

export const departments = Object.keys(peruLocations).sort((left, right) => left.localeCompare(right, 'es'))
