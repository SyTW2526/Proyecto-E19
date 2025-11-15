import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Home({ setUser }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:4000/api/auth/logout');
    } catch (e) {
      // ignore errors
    }
    if (setUser) setUser(null);
    navigate('/login');
  };

  // Datos del menú
  const menuSections = [
    { 
      title: 'Asignaturas', 
      items: [
        { 
          label: 'Curso 1', 
          subitems: [
            'Primer cuatrimestre',
            '139261011 - Informática Básica',
            '139261012 - Álgebra',
            '139261013 - Cálculo',
            '139261014 - Fundamentos Físicos para la Ingeniería',
            '139261015 - Organizaciones Empresariales',
            'Segundo cuatrimestre',
            '139261021 - Algoritmos y Estructuras de Datos',
            '139261022 - Principios de Computadores',
            '139261023 - Optimización',
            '139261024 - Sistemas Electrónicos Digitales',
            '139261025 - Expresión Gráfica en Ingeniería'
          ]
        },
        { 
          label: 'Curso 2', 
          subitems: [
            'Primer cuatrimestre',
            '139262011 - Estadística',
            '139262012 - Computabilidad y Algoritmia',
            '139262013 - Estructura de Computadores',
            '139262014 - Sistemas Operativos',
            '139262015 - Inglés Técnico',
            'Segundo cuatrimestre',
            '139262021 - Algoritmos y Estructuras de Datos Avanzadas',
            '139262022 - Redes y Sistemas Distribuidos',
            '139262023 - Administración de Sistemas',
            '139262024 - Fundamentos de Ingeniería del Software',
            '139262025 - Código Deontológico y Aspectos Legales'
          ]
        },
        { 
          label: 'Curso 3', 
          subitems: [
            'Primer cuatrimestre',
            '139263011 - Bases de Datos',
            '139263012 - Inteligencia Artificial',
            '139263013 - Sistemas de Interacción Persona-Computador',
            '139263014 - Lenguajes y Paradigmas de Programación',
            '139263015 - Gestión de Proyectos Informáticos',
            'Segundo cuatrimestre',
            '139263121 - Procesadores de Lenguajes',
            '139263122 - Diseño y Análisis de Algoritmos',
            '139263123 - Programación de Aplicaciones Interactivas',
            '139263124 - Inteligencia Artificial Avanzada',
            '139263125 - Tratamiento Inteligente de Datos',
            '139263221 - Diseño de Procesadores',
            '139263222 - Arquitectura de Computadores',
            '139263225 - Sistemas Operativos Avanzados',
            '139263226 - Redes de Computadores en Ingeniería de Computadores',
            '139263227 - Laboratorio de Redes en Ingeniería de Computadores',
            '139263321 - Modelado de Sistemas Software',
            '139263322 - Análisis de Sistemas Software',
            '139263323 - Modelado de Datos',
            '139263325 - Gestión de la Calidad',
            '139263326 - Gestión de Riesgos en Ingeniería del Software',
            '139264421 - Redes de Computadores en Sistemas de Información',
            '139264422 - Laboratorio de Redes en Sistemas de Información',
            '139264423 - Sistemas de Información para las Organizaciones',
            '139264424 - Gestión de Riesgos en Sistemas de Información',
            '139264425 - Control de Calidad',
            '139265321 - Redes de Computadores en Tecnologías de la Información',
            '139265322 - Laboratorio de Redes en Tecnologías de la Información',
            '139265323 - Seguridad en Sistemas Informáticos',
            '139265324 - Desarrollo de Sistemas Informáticos',
            '139265325 - Usabilidad y Accesibilidad'
          ]
        },
        { 
          label: 'Curso 4', 
          subitems: [
            'Primer cuatrimestre',
            '139260901 - Administración y Diseño de Bases de Datos',
            '139260902 - Visión por Computador',
            '139260903 - Ingeniería Logística',
            '139260904 - Robótica Computacional',
            '139264111 - Interfaces Inteligentes',
            '139264112 - Sistemas Inteligentes',
            '139264113 - Complejidad Computacional',
            '139264211 - Sistemas Empotrados',
            '139264212 - Arquitecturas Avanzadas y de Propósito Específico',
            '139264213 - Seguridad de Sistemas Informáticos',
            '139264311 - Laboratorio de Desarrollo y Herramientas',
            '139264312 - Normativa y Regulación',
            '139264313 - Diseño Arquitectónico y Patrones',
            '139264411 - Sistemas de Información Contable',
            '139264412 - Gestión de la Innovación',
            '139264413 - Desarrollo y Mantenimiento de Sistemas de Información',
            '139264511 - Tecnologías de la Información para las Organizaciones',
            '139264512 - Sistemas y Tecnologías Web',
            '139264513 - Gestión del Conocimiento en las Organizaciones',
            'Segundo cuatrimestre',
            '139264021 - Inteligencia Emocional',
            '139264022 - Prácticas Externas',
            '139264023 - Trabajo de Fin de Grado'
          ]
        }
      ]
    },
    { title: 'Profesores', items: [
      { 
        label: '', 
        subitems: [
          'ABREU RODRÍGUEZ, DAVID',
          'ACOSTA SANCHEZ, LEOPOLDO',
          'ALAYON MIRANDA, SILVIA',
          'ALMEIDA RODRIGUEZ, FRANCISCO CARMELO',
          'ARNAY DEL ARCO, RAFAEL',
          'BACALLADO LÓPEZ, MANUEL ALEJANDRO',
          'BARRETO PESTANA, CLEMENTE',
          'BONAQUE GONZÁLEZ, SERGIO',
          'BRITO SANTANA, JULIO ANTONIO',
          'CABALLERO GIL, PINO TERESA',
          'CABALLERO GIL, CANDIDO',
          'CARBALLEIRA ABELLA, MONICA',
          'CASTELLANOS NIEVES, DAGOBERTO',
          'CASTILLA RODRIGUEZ, IVAN',
          'CEJAS RODRÍGUEZ, MARIANO GUILLERMO',
          'COLEBROOK SANTAMARIA, MARCOS ALEJANDRO',
          'DARUIS LUIS, MARÍA LEYLA',
          'DIAZ MENDOZA, CARLOS JAVIER',
          'DOMINGUEZ ESPINOSA, IGNACIO',
          'DOMÍNGUEZ MARTÍN, BENCOMO',
          'DORTA GONZALEZ, MARIA ISABEL',
          'DORTA GUERRA, ROBERTO',
          'ESTEVEZ DAMAS, JOSE IGNACIO',
          'EXPOSITO IZQUIERDO, CRISTOFER JUAN',
          'FARIÑA JERÓNIMO, BIBIANA'
        ]
      },
      { 
        label: '', 
        subitems: [
          'FARIÑA RODRIGUEZ, FELIX MIGUEL',
          'FRANCISCO PEREZ, CARMEN GLORIA',
          'FUENTES SANTOS, ISABEL',
          'GARCIA BAEZ, PATRICIO',
          'GARCIA BARROSO, EVELIA ROSA',
          'GARCIA FORTE, LUIS',
          'GARCIA MARCO, IGNACIO',
          'GONZALEZ AVILA, JOSE LUIS',
          'GONZALEZ FERNANDEZ, ALBANO JOSE',
          'GONZALEZ GONZALEZ, EVELIO JOSE',
          'GONZALEZ GONZALEZ, CARINA SOLEDAD',
          'GONZALEZ MARTINEZ, JESUS ALBERTO',
          'GONZALEZ PLATAS, JAVIER',
          'GUTIERREZ EXPOSITO, JOSE MIGUEL',
          'GÓMEZ CÁRDENES, ÓSCAR',
          'HAMILTON CASTRO, ALBERTO FRANCISCO',
          'HERNANDEZ ACEITUNO, JAVIER',
          'HERNANDEZ CONCEPCION, CARLOS ALFREDO',
          'HERNANDEZ GARCIA, MARIA DEL CARMEN',
          'HERNANDEZ GOYA, MARIA CANDELARIA',
          'HERNANDEZ PEREZ, HIPOLITO',
          'HERNÁNDEZ RODRÍGUEZ, MIGUEL ANDRÉS',
          'HERNÁNDEZ YANES, WILLIAM GIOVANI',
          'HERRERA PRIANO, FELIX ANGEL',
          'JIMENEZ PAIZ, MATEO MIGUEL'
        ]
      },
      { 
        label: '', 
        subitems: [
          'JORGE SANTISO, JESUS MANUEL',
          'LAVIN DELLA VENTURA, VICTOR',
          'LEAL MARRERO, WILFREDO ORESTE',
          'LEON HERNANDEZ, COROMOTO ANTONIA',
          'LOPEZ DE VERGARA MENDEZ, ALEJANDRO FERMIN',
          'LUKE, JONAS PHILIPP',
          'LÓPEZ PLATA, ISRAEL',
          'MAGDALENO CASTELLO, EDUARDO',
          'MARICHAL HERNANDEZ, JOSE GIL',
          'MARQUEZ CORBELLA, IRENE',
          'MARTIN GALAN, CARLOS ALBERTO',
          'MELIAN BATISTA, MARIA BELEN',
          'MELIÁN DÍAZ, DÁMARI',
          'MIRANDA VALLADARES, GARA',
          'MORENO DE ANTONIO, LUZ MARINA',
          'MORENO PEREZ, JOSE ANDRES',
          'MORENO VEGA, JOSE MARCOS',
          'MUÑOZ CRUZ, VANESA',
          'NACIMIENTO GARCÍA, EDUARDO',
          'NOVOA HERNÁNDEZ, PAVEL',
          'PEREZ BRITO, DIONISIO',
          'PEREZ DARIAS, JUAN CARLOS',
          'PEREZ NAVA, ALEJANDRO',
          'PEREZ NAVA, FERNANDO ANDRES',
          'PINEDA RAMOS, JOSÉ FABRIZIO'
        ]
      },
      { 
        label: '', 
        subitems: [
          'PIÑEIRO VERA, JOSE DEMETRIO',
          'PLATA SUAREZ, JESUS MANUEL',
          'PÉREZ MARTÍN, EVELIO JOSÉ',
          'RAMOS DOMINGUEZ, CARMEN ELVIRA',
          'RIERA LEDESMA, JORGE',
          'RODA GARCIA, JOSE LUIS',
          'RODRIGUEZ GONZALEZ, FRANCISCO JAVIER',
          'RODRIGUEZ LEON, CASIANO',
          'RODRIGUEZ MARTIN, INMACULADA',
          'RODRIGUEZ MENDOZA, BEATRIZ',
          'RODRIGUEZ VALIDO, MANUEL JESUS',
          'SAAVEDRA DÍAZ, JUAN MIGUEL',
          'SALAZAR GONZALEZ, JUAN JOSE',
          'SANCHEZ BERRIEL, ISABEL',
          'SANCHEZ DE LA ROSA, JOSE LUIS',
          'SANCHEZ NIELSEN, MARIA ELENA',
          'SANDE GONZALEZ, FRANCISCO DE',
          'SANTANA SÁNCHEZ, LUIS JOSÉ',
          'SANTOS LEON, JUAN CARLOS',
          'SAORIN PEREZ, JOSE LUIS',
          'SEDEÑO NODA, ANTONIO ALBERTO',
          'SEGREDO GONZALEZ, EDUARDO MANUEL',
          'SIGUT SAAVEDRA, MARTA',
          'TOLEDO CARRILLO, JONAY TOMAS',
          'TOLEDO DELGADO, PEDRO A.',
          'TORRES JORGE, JESUS MIGUEL',
          'ÁLVAREZ SUÁREZ, SOFÍA MARÍA'
        ]
      }
    ] },
    { title: 'Ubicación', items: [] },
    { title: 'Sobre nosotros', items: [] }
  ];

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeCourse, setActiveCourse] = useState(null);

  return (
    <div style={{ backglor: 'white', minHeight: '100vh' }}>
      {/* Menú desplegable */}
      <nav style={{ backgroundColor: '#ffffff', borderBottom: '3px solid #6b21a8', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
        {menuSections.map((section, idx) => (
          <div key={idx} style={{ position: 'relative' }}>
            <button
              onMouseEnter={() => setActiveDropdown(idx)}
              onMouseLeave={() => setActiveDropdown(null)}
              style={{ 
                backgroundColor: 'transparent', 
                color: idx === 0 ? '#6b21a8' : '#4b5563', 
                padding: '0.5rem 1rem', 
                border: 'none', 
                cursor: 'pointer', 
                fontWeight: '700',
                fontSize: '1.1rem',
                borderBottom: idx === 0 ? '3px solid #6b21a8' : 'none',
                paddingBottom: idx === 0 ? '1.5rem' : '0.5rem'
              }}
            >
              {section.title}
            </button>

            {activeDropdown === idx && section.items.length > 0 && (
              <div 
                onMouseEnter={() => setActiveDropdown(idx)}
                onMouseLeave={() => {
                  setActiveDropdown(null);
                  setActiveCourse(null);
                }}
                className="animate-slideDown" 
                style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: idx === 0 ? '-50%' : '0',
                  marginTop: '0.5rem', 
                  backgroundColor: 'white', 
                  borderRadius: '0.5rem', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
                  minWidth: idx === 0 ? '280px' : '800px',
                  padding: '1rem',
                  zIndex: 50,
                  display: idx === 0 ? 'block' : 'grid',
                  gridTemplateColumns: idx === 0 ? '1fr' : 'repeat(4, 1fr)',
                  gap: '1.5rem'
                }}
              >
                {idx === 0 ? (
                  // Menú para Asignaturas con submenu de cursos
                  <div style={{ display: 'flex', gap: '0' }}>
                    {/* Lista de cursos a la izquierda */}
                    <div style={{ minWidth: '180px', borderRight: '1px solid #e5e7eb' }}>
                      {section.items.map((course, courseIdx) => (
                        <div
                          key={courseIdx}
                          onMouseEnter={() => setActiveCourse(courseIdx)}
                          style={{
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            backgroundColor: activeCourse === courseIdx ? '#f3f4f6' : 'white',
                            fontWeight: activeCourse === courseIdx ? '600' : '500',
                            color: activeCourse === courseIdx ? '#6b21a8' : '#4b5563',
                            borderLeft: activeCourse === courseIdx ? '3px solid #6b21a8' : '3px solid transparent',
                            transition: 'all 0.2s'
                          }}
                        >
                          {course.label}
                        </div>
                      ))}
                    </div>
                    
                    {/* Asignaturas del curso seleccionado a la derecha */}
                    {activeCourse !== null && (
                      <div style={{ padding: '0.75rem 1rem', minWidth: '420px', maxHeight: '500px', overflowY: 'auto' }}>
                        {section.items[activeCourse].subitems.map((subitem, subIdx) => {
                          const isSectionTitle = subitem.includes('cuatrimestre');
                          return (
                            <div
                              key={subIdx}
                              style={{
                                padding: isSectionTitle ? '0.75rem 0 0.5rem' : '0.35rem 0',
                                fontWeight: isSectionTitle ? '700' : '400',
                                color: isSectionTitle ? '#1f2937' : '#6b7280',
                                fontSize: isSectionTitle ? '0.95rem' : '0.875rem',
                                marginTop: isSectionTitle && subIdx > 0 ? '0.75rem' : '0',
                                borderTop: isSectionTitle && subIdx > 0 ? '1px solid #e5e7eb' : 'none',
                                cursor: isSectionTitle ? 'default' : 'pointer'
                              }}
                              onMouseEnter={(e) => !isSectionTitle && (e.currentTarget.style.color = '#6b21a8')}
                              onMouseLeave={(e) => !isSectionTitle && (e.currentTarget.style.color = '#6b7280')}
                            >
                              {subitem}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  // Menú normal para otras secciones
                  section.items.map((item, itemIdx) => (
                    <div key={itemIdx}>
                      <h3 style={{ fontWeight: '700', color: '#1f2937', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                        {item.label}
                      </h3>
                      {item.subitems && item.subitems.map((subitem, subIdx) => (
                        <a
                          key={subIdx}
                          href="#"
                          style={{ 
                            display: 'block', 
                            padding: '0.4rem 0', 
                            textDecoration: 'none', 
                            color: '#6b7280',
                            fontSize: '0.875rem',
                            lineHeight: '1.3'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#6b21a8'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                        >
                          {subitem}
                        </a>
                      ))}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Contenido principal */}
      <main style={{ padding: '3rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Sección hero de bienvenida */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{ color: '#6b21a8', fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '700' }}>
            Sistema de Gestión de Tutorías ULL
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1.25rem', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
            Plataforma integral para la coordinación y gestión de tutorías académicas en la Universidad de La Laguna
          </p>
        </div>

        {/* Descripción de la aplicación */}
        <div style={{ backgroundColor: '#f9fafb', padding: '2rem', borderRadius: '0.75rem', marginBottom: '3rem', border: '1px solid #e5e7eb' }}>
          <h2 style={{ color: '#1f2937', fontSize: '1.75rem', marginBottom: '1.5rem', fontWeight: '600' }}>
            ¿Qué es el Sistema de Tutorías?
          </h2>
          <p style={{ color: '#4b5563', fontSize: '1rem', lineHeight: '1.8', marginBottom: '1rem' }}>
            Esta aplicación web está diseñada para facilitar la comunicación y coordinación entre estudiantes y profesores
            en el ámbito de las tutorías académicas. Proporciona un espacio centralizado donde gestionar citas, compartir
            recursos y mantener un seguimiento del progreso académico.
          </p>
          <p style={{ color: '#4b5563', fontSize: '1rem', lineHeight: '1.8' }}>
            Nuestro objetivo es optimizar el tiempo de profesores y estudiantes, eliminando la fricción en la organización
            de tutorías y fomentando un ambiente de aprendizaje más efectivo y accesible.
          </p>
        </div>

        {/* Funcionalidades principales */}
        <h2 style={{ color: '#1f2937', fontSize: '1.75rem', marginBottom: '2rem', fontWeight: '600', textAlign: 'center' }}>
          Funcionalidades Principales
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {/* Card 1 */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#ede9fe', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📅</span>
            </div>
            <h3 style={{ color: '#1f2937', fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>
              Gestión de Citas
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Reserva tutorías con tus profesores de forma sencilla. Visualiza la disponibilidad en tiempo real y recibe confirmaciones automáticas.
            </p>
          </div>

          {/* Card 2 */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#ede9fe', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>💬</span>
            </div>
            <h3 style={{ color: '#1f2937', fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>
              Foros de Discusión
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Participa en foros por asignatura donde estudiantes y profesores pueden compartir dudas, recursos y conocimientos.
            </p>
          </div>

          {/* Card 3 */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#ede9fe', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📍</span>
            </div>
            <h3 style={{ color: '#1f2937', fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>
              Ubicaciones y Aulas
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Encuentra fácilmente dónde se realizan las tutorías con mapas interactivos del campus y direcciones precisas.
            </p>
          </div>

          {/* Card 4 */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#ede9fe', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>👥</span>
            </div>
            <h3 style={{ color: '#1f2937', fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>
              Directorio de Profesores
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Accede a información de contacto, horarios de tutoría y especialidades de todos los profesores del departamento.
            </p>
          </div>

          {/* Card 5 */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#ede9fe', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📊</span>
            </div>
            <h3 style={{ color: '#1f2937', fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>
              Seguimiento Académico
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Lleva un registro de tus tutorías pasadas, temas tratados y objetivos planteados para un mejor seguimiento de tu progreso.
            </p>
          </div>

          {/* Card 6 */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#ede9fe', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🔔</span>
            </div>
            <h3 style={{ color: '#1f2937', fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>
              Notificaciones
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Recibe recordatorios de próximas tutorías, cambios de horario y mensajes importantes de tus profesores.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div style={{ textAlign: 'center', padding: '2.5rem', backgroundColor: '#6b21a8', borderRadius: '0.75rem', color: 'white' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem' }}>
            ¿Listo para comenzar?
          </h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', opacity: 0.9 }}>
            Únete a cientos de estudiantes que ya están optimizando sus tutorías
          </p>
          <button 
            onClick={() => navigate('/login')}
            style={{ 
              backgroundColor: 'white', 
              color: '#6b21a8', 
              padding: '0.75rem 2rem', 
              borderRadius: '0.5rem', 
              border: 'none', 
              fontSize: '1.05rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Acceder a la plataforma
          </button>
        </div>
      </main>
    </div>
  );
}

export default Home;

