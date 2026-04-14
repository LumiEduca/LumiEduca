import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Home from '../pages/Home';
import Trilha from '../pages/Trilha';
import Questao from '../pages/Questao';
import TelaVitoria from '../pages/TelaVitoria';
import Login from '../pages/Login';
import CriarTarefa from '../pages/CriarTarefa';
import TarefasRecebidas from '../pages/TarefasRecebidas';
import RelatorioProfessor from '../pages/RelatorioProfessor';

export default function AppRoutes({
  userType,
  setPontos,
  concluidas,
  setConcluidas,
}) {
  return (
    <Routes>
      <Route path="/" element={userType ? <Home /> : <Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/criar-tarefa"
        element={userType === 'professor' ? <CriarTarefa /> : <Navigate to="/" />}
      />

      <Route
        path="/relatorio"
        element={userType === 'professor' ? <RelatorioProfessor /> : <Navigate to="/" />}
      />

      <Route
        path="/tarefas-recebidas"
        element={
          userType ? <TarefasRecebidas setPontos={setPontos} /> : <Navigate to="/login" />
        }
      />

      <Route
        path="/trilha/:materia"
        element={userType ? <Trilha /> : <Navigate to="/login" />}
      />

      <Route
        path="/exercicio/:materia"
        element={
          userType ? (
            <Questao
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
        element={userType ? <TelaVitoria /> : <Navigate to="/login" />}
      />
    </Routes>
  );
}