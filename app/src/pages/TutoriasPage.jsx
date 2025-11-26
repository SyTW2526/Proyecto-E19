import React from 'react';
import Icon from '../components/Icon';
import TutoriasAlumno from './TutoriasAlumno';
import TutoriasProfesor from './TutoriasProfesor';

function TutoriasPage({ menu, activeSubsection, user }) {
  const role = user?.rol ?? 'alumno';
  const Component = role === 'profesor' ? TutoriasProfesor : TutoriasAlumno;
  return <Component menu={menu} activeSubsection={activeSubsection} user={user} />;
}

export default TutoriasPage;
