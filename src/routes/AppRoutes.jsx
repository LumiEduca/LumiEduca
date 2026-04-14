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
  return (
    <Routes>
      <Route path="/" element={userType ? <HomePage /> : <Navigate to="/login" />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/criar-tarefa"
        element={userType === 'professor' ? <CreateTaskPage /> : <Navigate to="/" />}
      />

      <Route
        path="/relatorio"
        element={userType === 'professor' ? <TeacherReportPage /> : <Navigate to="/" />}
      />

      <Route
        path="/tarefas-recebidas"
        element={
          userType ? <ReceivedTasksPage setPontos={setPontos} /> : <Navigate to="/login" />
        }
      />

      <Route
        path="/trilha/:materia"
        element={userType ? <LearningPathPage /> : <Navigate to="/login" />}
      />

      <Route
        path="/exercicio/:materia"
        element={
          userType ? (
            <QuestionPage
              setPontos={setPontos}
              concluidas={concluidas}
              setConcluidas={setConcluidas}
            />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/vitoria"
        element={userType ? <VictoryPage /> : <Navigate to="/login" />}
      />
    </Routes>
  );
}