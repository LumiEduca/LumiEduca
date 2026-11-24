import React, { useState } from 'react';
import '../styles/login.css';
import '../styles/register.css';
import '../styles/profile.css';
import PasswordField from '../components/PasswordField';
import { atualizarNome, trocarSenha } from '../services/perfilApi';

const PREFIXOS_POR_NOME = ['lumi_pontos_', 'lumi_concluidas_', 'lumi_tarefas_concluidas_'];

function sairDaSessao() {
  localStorage.removeItem('token');
  localStorage.removeItem('userType');
  localStorage.removeItem('userName');
  window.location.href = '/login';
}

// O app guarda pontos e tarefas concluídas usando o nome como parte da chave.
// Ao trocar o nome, copia esses dados para a chave nova para não perdê-los.
function migrarDadosDoNome(antigo, novo) {
  if (!antigo || antigo === novo) return;
  PREFIXOS_POR_NOME.forEach((prefixo) => {
    const valor = localStorage.getItem(`${prefixo}${antigo}`);
    if (valor !== null && localStorage.getItem(`${prefixo}${novo}`) === null) {
      localStorage.setItem(`${prefixo}${novo}`, valor);
    }
  });
}

function validarNome(nome) {
  const n = nome.trim();
  if (n.length < 2 || n.length > 100) return 'O nome deve ter entre 2 e 100 caracteres.';
  return null;
}

function validarSenha(senhaAtual, novaSenha, confirmar) {
  if (!senhaAtual) return 'Informe a senha atual.';
  if (novaSenha.length < 8) return 'A nova senha deve ter pelo menos 8 caracteres.';
  if (new TextEncoder().encode(novaSenha).length > 72) {
    return 'A nova senha é longa demais (máximo de 72 caracteres).';
  }
  if (novaSenha === senhaAtual) return 'A nova senha deve ser diferente da atual.';
  if (novaSenha !== confirmar) return 'As senhas não conferem.';
  return null;
}

export default function ProfilePage() {
  const nomeAtual = localStorage.getItem('userName') || '';
  const userType = localStorage.getItem('userType');

  const [nome, setNome] = useState(nomeAtual);
  const [msgNome, setMsgNome] = useState({ tipo: '', texto: '' });
  const [salvandoNome, setSalvandoNome] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [msgSenha, setMsgSenha] = useState({ tipo: '', texto: '' });
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const tratarErro = (e, definirMsg) => {
    if (e.status === 401) {
      sairDaSessao();
      return;
    }
    definirMsg({ tipo: 'erro', texto: e.message });
  };

  const salvarNome = async (e) => {
    e.preventDefault();
    setMsgNome({ tipo: '', texto: '' });

    const erro = validarNome(nome);
    if (erro) {
      setMsgNome({ tipo: 'erro', texto: erro });
      return;
    }

    setSalvandoNome(true);
    try {
      const { usuario } = await atualizarNome(nome.trim());
      migrarDadosDoNome(nomeAtual, usuario.nome);
      localStorage.setItem('userName', usuario.nome);
      // Recarrega para o App e o Header lerem o novo nome
      window.location.assign('/perfil');
    } catch (err) {
      tratarErro(err, setMsgNome);
      setSalvandoNome(false);
    }
  };

  const salvarSenha = async (e) => {
    e.preventDefault();
    setMsgSenha({ tipo: '', texto: '' });

    const erro = validarSenha(senhaAtual, novaSenha, confirmar);
    if (erro) {
      setMsgSenha({ tipo: 'erro', texto: erro });
      return;
    }

    setSalvandoSenha(true);
    try {
      await trocarSenha(senhaAtual, novaSenha);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmar('');
      setMsgSenha({ tipo: 'ok', texto: 'Senha alterada com sucesso.' });
    } catch (err) {
      tratarErro(err, setMsgSenha);
    } finally {
      setSalvandoSenha(false);
    }
  };

  return (
    <div className="page-wrapper login-page">
      <main className="profile-main">
        <h1 className="profile-title">Meu perfil</h1>
        <p className="profile-subtitle">
          Conta de {userType === 'professor' ? 'professor' : 'aluno'}. Aqui você troca seu nome e sua senha.
        </p>

        <section className="login-card profile-card" aria-labelledby="titulo-nome">
          <h2 id="titulo-nome" className="profile-card-title">Nome</h2>
          <form onSubmit={salvarNome} className="login-form" noValidate>
            <div className="login-field">
              <label htmlFor="perfil-nome" className="login-label">Seu nome</label>
              <input
                id="perfil-nome"
                type="text"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  setMsgNome({ tipo: '', texto: '' });
                }}
                autoComplete="name"
                maxLength={100}
                required
              />
            </div>

            <div aria-live="polite">
              {msgNome.texto && (
                <p className={msgNome.tipo === 'ok' ? 'profile-ok' : 'login-error'} role={msgNome.tipo === 'erro' ? 'alert' : 'status'}>
                  {msgNome.texto}
                </p>
              )}
            </div>

            <button type="submit" className="login-submit" disabled={salvandoNome}>
              {salvandoNome ? 'Salvando...' : 'Salvar nome'}
            </button>
          </form>
        </section>

        <section className="login-card profile-card" aria-labelledby="titulo-senha">
          <h2 id="titulo-senha" className="profile-card-title">Senha</h2>
          <form onSubmit={salvarSenha} className="login-form" noValidate>
            <PasswordField
              id="perfil-senha-atual"
              label="Senha atual"
              placeholder="Digite sua senha atual"
              value={senhaAtual}
              autoComplete="current-password"
              onChange={(e) => {
                setSenhaAtual(e.target.value);
                setMsgSenha({ tipo: '', texto: '' });
              }}
            />

            <PasswordField
              id="perfil-nova-senha"
              label="Nova senha"
              placeholder="Crie uma nova senha"
              value={novaSenha}
              autoComplete="new-password"
              onChange={(e) => {
                setNovaSenha(e.target.value);
                setMsgSenha({ tipo: '', texto: '' });
              }}
            />

            <PasswordField
              id="perfil-confirmar"
              label="Confirmar nova senha"
              placeholder="Digite a nova senha novamente"
              value={confirmar}
              autoComplete="new-password"
              onChange={(e) => {
                setConfirmar(e.target.value);
                setMsgSenha({ tipo: '', texto: '' });
              }}
            />

            <span className="register-hint register-hint-standalone">
              A nova senha precisa ter pelo menos 8 caracteres.
            </span>

            <div aria-live="polite">
              {msgSenha.texto && (
                <p className={msgSenha.tipo === 'ok' ? 'profile-ok' : 'login-error'} role={msgSenha.tipo === 'erro' ? 'alert' : 'status'}>
                  {msgSenha.texto}
                </p>
              )}
            </div>

            <button type="submit" className="login-submit" disabled={salvandoSenha}>
              {salvandoSenha ? 'Salvando...' : 'Alterar senha'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}