import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import HomePage from '../pages/HomePage';
import LearningPathPage from '../pages/LearningPathPage';
import QuestionPage from '../pages/QuestionPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import CreateTaskPage from '../pages/CreateTaskPage';
import ReceivedTasksPage from '../pages/ReceivedTasksPage';
import TeacherReportPage from '../pages/TeacherReportPage';
import ClassroomsPage from '../pages/ClassroomsPage';
import DemosHubPage from '../pages/demos/DemosHubPage';
import CacaPalavrasPage from '../pages/demos/CacaPalavrasPage';
import JogoMemoriaPage from '../pages/demos/JogoMemoriaPage';
import QuizRelampagoPage from '../pages/demos/QuizRelampagoPage';
import ProfilePage from '../pages/ProfilePage';

export default function AppRoutes({
  userType,
  setPontos,
  concluidas,
  setConcluidas,
}) {
  const isAuthenticated = Boolean(userType);
  const isProfessor = userType === 'professor';

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <HomePage /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/login"
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />}
      />

      <Route
        path="/cadastro"
        element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" replace />}
      />

      {/* Demonstrações públicas (sem login) */}
      <Route path="/demos" element={<DemosHubPage />} />
      <Route path="/demos/caca-palavras" element={<CacaPalavrasPage />} />
      <Route path="/demos/memoria" element={<JogoMemoriaPage />} />
      <Route path="/demos/quiz" element={<QuizRelampagoPage />} />

      <Route
        path="/criar-tarefa"
        element={isProfessor ? <CreateTaskPage /> : <Navigate to="/" replace />}
      />

      <Route
        path="/relatorio-professor"
        element={isProfessor ? <TeacherReportPage /> : <Navigate to="/" replace />}
      />

      <Route
        path="/tarefas-recebidas"
        element={
          isAuthenticated ? (
            <ReceivedTasksPage setPontos={setPontos} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/trilha/:materia"
        element={
          isAuthenticated ? (
            <LearningPathPage />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/exercicio/:materia"
        element={
          isAuthenticated ? (
            <QuestionPage
              setPontos={setPontos}
              concluidas={concluidas}
              setConcluidas={setConcluidas}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/salas-de-aula"
        element={
          isAuthenticated ? (
            <ClassroomsPage />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/perfil"
        element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" replace />}
      />

      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />}
      />
    </Routes>
  );
}