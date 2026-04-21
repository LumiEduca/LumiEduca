import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import HomePage from '../pages/HomePage';
import LearningPathPage from '../pages/LearningPathPage';
import QuestionPage from '../pages/QuestionPage';
import VictoryPage from '../pages/VictoryPage';
import LoginPage from '../pages/LoginPage';
import CreateTaskPage from '../pages/CreateTaskPage';
import ReceivedTasksPage from '../pages/ReceivedTasksPage';
import TeacherReportPage from '../pages/TeacherReportPage';

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
        element={isAuthenticated ? <LearningPathPage /> : <Navigate to="/login" replace />}
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
        path="/vitoria"
        element={isAuthenticated ? <VictoryPage /> : <Navigate to="/login" replace />}
      />

      <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
    </Routes>
  );
}