# TAXONOMIA.md — Catálogo de mercado (industria → nicho → especialización)

> **Fuente**: Supabase `Nexo` (egyxgnlnzanxpqyuvmsg) — tablas `industrias` + `nichos`
> **Leído**: 2026-09-26 · **Industrias**: 22 activas · **Nichos**: 85 activos
> **Regla**: match exacto a taxonomía, nunca texto libre (`KitBriefGenerador-MegaPrompt.md` §2).
> **Regla por proyecto**: cada proyecto tiene **su propio** `<Proyecto>/docs/TAXONOMIA.md` con **solo 3 campos** — Industria · Nicho · Especialización — identificados en su análisis (`analista-proy`) y casados a este catálogo. Este archivo es solo el **catálogo maestro**.
> **Escritura**: solo INSERT de faltantes (jamás UPDATE/DELETE). Los inserts se anotan al final con `insertado: <fecha>`.
> **Regenerar**: `/guia-total taxonomia`

---

## 1. Servicios Profesionales ⚖️
*Bufetes, consultorías y asesorías especializadas*
- **Abogados** → Derecho Corporativo · Civil · Laboral · Fiscal · Penal · Propiedad Intelectual
- **Despachos Contables** → Contabilidad General · Auditoría · Impuestos · Finanzas Personales · Consultoría Financiera
- **Consultoría y Coaching** → Marca Personal · Coaching Ejecutivo · Mentoría · Consultoría Empresarial · Desarrollo Organizacional · Speaker/Conferencista
- **Agencias de Marketing** → Marketing digital · Branding · Redes sociales · Publicidad pagada
- **Seguros** → Seguros de vida · de auto · de gastos médicos · empresariales
- **Recursos Humanos** → Reclutamiento · Nómina · Capacitación · Evaluación de desempeño

## 2. Salud y Bienestar 🏥
*Atención médica, dental y bienestar integral*
- **Clínicas Médicas** → Medicina General · Pediatría · Ginecología · Cardiología · Medicina Estética · Dermatología
- **Dentistas** → Odontología General · Ortodoncia · Implantología · Estética Dental · Blanqueamiento
- **Salud y Bienestar** → Psicología · Nutrición · Fisioterapia · Terapias Alternativas · Medicina Funcional · Mindfulness
- **Terapia Física y Rehabilitación** → Fisioterapia · Rehabilitación Deportiva · Terapia Ocupacional · Rehabilitación Cardíaca · Terapia Respiratoria
- **Nutrición y Dietética** → Nutrición Clínica · Dietética · Nutrición Deportiva · Nutrición Pediátrica · Control de Peso
- **Gimnasios y Fitness** → Entrenamiento personal · CrossFit · Yoga y Pilates · Nutrición deportiva
- **Ópticas** → Exámenes de la vista · Lentes de contacto · Lentes de sol · Armazones

## 3. Tecnología 💻
*Desarrollo de software, hardware y servicios tech*
- **Software** → Desarrollo Web · Apps Móviles · SaaS · IA/Machine Learning · CRM/ERP
- **Tecnología** → Ciberseguridad · Cloud Computing · Infraestructura IT · Marketing Digital · Transformación Digital
- **Desarrollo Web y Móvil** → Desarrollo Web · Apps Móviles · E-commerce · Sistemas ERP · APIs y Backend
- **Ciberseguridad** → Auditoría de Seguridad · Pentesting · Protección de Datos · Firewall y Antivirus · Cumplimiento Normativo

## 4. Industria y Manufactura 🏭
*Construcción, manufactura y maquinado industrial*
- **Construcción** → Obra Civil · Construcción Residencial · Comercial · Arquitectura · Remodelaciones
- **Manufacturera** → Producción en Serie · Control de Calidad · Automatización · Logística Industrial · Maquila
- **Tornos y Maquinado** → CNC · Mecanizado de Precisión · Soldadura · Herramientas Industriales · Inyección de Plásticos

## 5. Energía ☀️
*Energías renovables y almacenamiento*
- **Energía Solar** → Paneles Solares · Sistemas Fotovoltaicos · Calentadores Solares · Mantenimiento Solar · Consultoría Energética
- **Almacenamiento de Energía** → Baterías Industriales · UPS · Respaldo Energético · Sistemas Híbridos · Eficiencia Energética

## 6. Comercio y Ventas 🛒
*Comercio electrónico, inmobiliarias y ventas*
- **E-commerce** → Tiendas Online · Dropshipping · Marketplaces · Logística E-commerce · CRO
- **Inmobiliarias** → Venta de Propiedades · Rentas · Desarrollo Inmobiliario · Avalúos · Hipotecas
- **Venta en Línea / E-commerce** → Tienda Online · Marketplace · Dropshipping · Ventas por Redes Sociales · Funnels de Venta
- **Tiendas de Conveniencia y Abarrotes** → Abarrotes · Mini súper · Farmacias de conveniencia · Productos regionales
- **Boutiques de Moda** → Ropa de dama · Ropa de caballero · Calzado · Accesorios
- **Florerías** → Arreglos florales · Eventos · Decoración · Envíos

## 7. Alimentos y Hospitalidad 🍽️
*Gastronomía, hotelería y turismo*
- **Restaurantes y Comida Rápida** → Comida Rápida · Alta Cocina · Bares · Cafeterías · Comida Saludable · Catering
- **Pastelerías** → Repostería · Panadería Artesanal · Pasteles Personalizados · Postres Premium · Chocolatería
- **Hoteles y Turismo** → Hotelería · Agencias de Viajes · Turismo de Aventura · Alojamiento Boutique · Turismo Corporativo
- **Restaurante y Cafetería** → Restaurante Formal · Cafetería · Comida Rápida · Cocina Mexicana · Cocina Internacional
- **Hotelería y Turismo** → Hotel · Hostal · Casa de Huéspedes · Agencia de Viajes · Turismo de Aventura
- **Taquerías y Antojitos** → Tacos · Tortas · Garnachas · Comida callejera
- **Cafeterías de Especialidad** → Café de origen · Barismo · Té · Repostería para café
- **Juguerías y Smoothies** → Jugos naturales · Smoothies · Desayunos saludables

## 8. Educación 📚
*Instituciones educativas y capacitación*
- **Educación** → Capacitación Corporativa · Idiomas · Educación Online · Coaching Educativo · Educación Básica · Universidades

## 9. Logística y Transporte 🚚
*Transporte, distribución y cadena de suministro*
- **Logística y Transporte** → Distribución · Mensajería · Flotillas · Cadena de Suministro · Transporte de Carga · Última Milla

## 10. Agropecuario 🌾
*Agricultura, ganadería y campo*
- **Agricultura** → Cultivos · Ganadería · Agroindustria · Agricultura Orgánica · Tecnología Agrícola

## 11. Mascotas 🐾
*Cuidado, alimentos y accesorios para mascotas*
- **Mascotas** → Veterinaria · Alimentos · Accesorios · Pet Grooming · Guardería Canina
- **Tiendas de Mascotas** → Alimentos premium · Accesorios · Juguetes · Medicamentos
- **Entrenamiento Canino** → Obediencia básica · Modificación de conducta · Adiestramiento profesional

## 12. Otros 📦
*Industrias no clasificadas en las categorías anteriores*
- **Otro** → (sin especializaciones)

## 14. Bienes Raíces 🏠
*Venta, renta, desarrollo y administración de propiedades inmobiliarias*
- **Venta y Renta Residencial** → Casas · Departamentos · Terrenos · Fraccionamientos · Hipotecas
- **Venta y Renta Comercial** → Locales Comerciales · Oficinas · Naves Industriales · Plazas Comerciales · Coworking
- **Desarrollo Inmobiliario** → Proyectos Residenciales · Proyectos Comerciales · Urbanización · Remodelación · Construcción
- **Fideicomiso y Inversión** → Fideicomisos · Inversión Predial · Valuación · Plusvalía · Fondos de Inversión
- **Administración de Propiedades** → Condominios · Mantenimiento · Cobro de Renta · Gestión de Arrendamiento · Auditoría

## 15. Jardinería y Paisajismo 🌿
*Diseño, mantenimiento y cuidado de jardines, áreas verdes y paisajismo*
- **Diseño de Paisajismo** → Diseño de Jardines · Paisajismo Residencial · Comercial · Jardines Verticales · Sustentable
- **Mantenimiento de Jardines** → Corte de Césped · Poda de Árboles · Fertilización · Control de Plagas · Riego
- **Arboricultura** → Poda de Arborización · Diagnóstico de Árboles · Tala Segura · Tratamiento Fitopatológico · Certificación Arborista
- **Jardines Verticales y Techos Verdes** → Jardines Verticales · Techos Verdes · Paisajismo Interior · Sistemas de Riego · Macetas Decorativas
- **Vivero y Plantas** → Venta de Plantas · Semillas y Bulbos · Macetas y Accesorios · Asesoría de Plantas · Plantas de Sombra

## 16. Análisis Clínicos y Laboratorio 🔬
*Laboratorios clínicos, análisis de sangre, estudios diagnósticos y medicina preventiva*
- **Laboratorio Clínico** → Biometría Hemática · Química Sanguínea · Examen General de Orina · Perfil Lipídico · Hemoglobina Glucosilada · Marcadores Tumorales
- **Laboratorio Especializado** → Análisis Hormonales · Pruebas Genéticas · Citología · Biopsia · Pruebas de Alimentación · Farmacogenética
- **Diagnóstico por Imagen** → Rayos X · Ultrasonido · Resonancia Magnética · Tomografía · Mamografía · Densitometría Ósea
- **Medicina Preventiva y Chequeos** → Chequeos Generales · Peritajes Médicos · Evaluaciones Preoperatorias · Seguimiento Postoperatorio · Medicina del Trabajo
- **Diagnóstico Molecular y PCR** → PCR COVID-19 · PCR Influenza · Detección de Virus · Diagnóstico Molecular · Genómica

## 17. Veterinaria y Cuidado Animal 🐾
*Servicios veterinarios, cuidado de mascotas, grooming, hotel y peluquería animal*
- **Veterinaria General** → Medicina General · Vacunación · Desparasitación · Cirugía Menor · Urgencias · Esterilización
- **Veterinaria Especialista** → Dermatología · Cardiología · Oncología · Oftalmología · Ortopedia · Neurología Veterinaria
- **Grooming y Peluquería** → Baño y Corte · Estética Canina · Tratamiento Capilar · Corte de Uñas · Limpieza de Oídos · Perfumación
- **Hotel y Guardería de Mascotas** → Hotel Canino · Guardería Diurna · Pensionado · Cuidado Nocturno · Vacaciones para Mascotas
- **Adiestramiento y Comportamiento** → Obediencia Básica · Adiestramiento Avanzada · Terapia de Comportamiento · Socialización · Detección de Drogas
- **Pet Shop y Accesorios** → Alimentos Premium · Accesorios · Juguetes · Ropa para Mascotas · Transportadoras · Higiene

## 18. Guardería y Cuidado Infantil 👶
*Guarderías, estancias infantiles, educación temprana y cuidado de niños*
- **Guardería** → Guardería Maternal · Estancia Infantil · Cuidado Diurno · Horario Flexible · Alimentación Incluida
- **Educación Preescolar** → Kínder · Preescolar · Educación Montessori · Waldorf · Bilingüe
- **Actividades Extracurriculares Infantiles** → Natación · Música y Ritmo · Danza · Artes Marciales · Pintura · Robótica Infantil
- **Psicología y Desarrollo Infantil** → Terapia Psicológica · Desarrollo Cognitivo · Neuropsicología Infantil · Terapia de Lenguaje · Integración Sensorial
- **Eventos y Fiestas Infantiles** → Fiestas de Cumpleaños · Eventos Temáticos · Animación Infantil · Magia y Shows · Inflables y Juegos

## 32. Electrodomésticos y Bienes de Consumo Premium 🔌
*Robots de cocina, línea blanca, automatización culinaria para el hogar*
- **Robots de Cocina Multifunción** → Asesoría de cocina inteligente · Automatización culinaria · Recetas guiadas · Comparativa de modelos · Batch cooking · Estilo de vida saludable
- **Estilo de Vida Saludable** → Alimentación saludable · Meal prep semanal · Nutrición con robot de cocina · Dietas personalizadas · Cocina sin procesados

## 33. Hogar y Servicios del Hogar 🏠
*Servicios para el hogar: lavandería, limpieza, reparaciones y jardinería*
- **Lavandería y Tintorería** → Autoservicio · a domicilio · Tintorería premium · Industrial · Planchado y vapor
- **Limpieza del Hogar y Oficinas** → Limpieza residencial · de oficinas · Desinfección y sanitización · Post-obra
- **Reparaciones del Hogar** → Plomería · Instalaciones eléctricas · Pintura · Carpintería · Aire acondicionado
- **Jardinería** → Mantenimiento de jardines · Diseño de paisaje · Poda y fertilización · Riego automatizado

## 34. Belleza y Estética 💇
*Salones, barberías, estética y spa*
- **Salones de Belleza** → Cortes y peinados · Colorimetría · Tintes y mechas · Alisados
- **Barberías** → Cortes de cabello · Arreglo de barba · Afeitado clásico · Diseño de cejas
- **Estética y Uñas** → Manicure y pedicure · Uñas acrílicas · Extensión de pestañas · Micropigmentación de cejas
- **Spa y Masajes** → Masajes relajantes · Masajes reductivos · Tratamientos faciales · Hidroterapia

## 35. Autos y Movilidad 🚗
*Talleres, lavado de autos y refaccionarias*
- **Talleres Mecánicos** → Mantenimiento preventivo · Diagnóstico computarizado · Frenos · Transmisión · Hojalatería y pintura
- **Lavado y Detallado de Autos** → Lavado a domicilio · Detallado interior · Pulido y encerado · Polarizado
- **Refaccionarias** → Refacciones nacionales · Importadas · Llantas · Aceites y lubricantes

## 36. Eventos y Entretenimiento 🎉
*Salones de eventos, banquetes, fotografía y video*
- **Salones de Eventos** → Bodas · XV años · Eventos corporativos · Fiestas infantiles
- **Banquetes y Catering** → Buffets · Catering corporativo · Meseros y logística · Coctelería
- **Fotografía y Video** → Fotografía de eventos · Video profesional · Drones · Sesiones de marca

---

## Inserciones registradas

*(formato: `insertado: YYYY-MM-DD — tabla — dato` — vacío = nada insertado aún)*

Ninguna por ahora.
