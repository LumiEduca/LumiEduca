import { jest } from '@jest/globals';

const initializeApp = jest.fn(() => ({ name: 'app-falso' }));
const cert = jest.fn((c) => c);
const getApps = jest.fn(() => []);
const send = jest.fn().mockResolvedValue('id-real');
const getMessaging = jest.fn(() => ({ send }));

jest.unstable_mockModule('firebase-admin/app', () => ({ initializeApp, cert, getApps }));
jest.unstable_mockModule('firebase-admin/messaging', () => ({ getMessaging }));

const { default: admin, resetarFirebaseParaTestes } = await import('../services/firebaseAdmin.js');

const credencialFalsa = Buffer.from(
  JSON.stringify({
    project_id: 'proj-falso',
    client_email: 'x@proj-falso.iam.gserviceaccount.com',
    private_key: 'CHAVE-FALSA',
  })
).toString('base64');

describe('firebaseAdmin (real x simulado)', () => {
  const envOriginal = { ...process.env };
  let logSpy, errSpy, warnSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    resetarFirebaseParaTestes();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errSpy.mockRestore();
    warnSpy.mockRestore();
    process.env.NODE_ENV = envOriginal.NODE_ENV;
    if (envOriginal.FIREBASE_SERVICE_ACCOUNT_BASE64 === undefined) {
      delete process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    } else {
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = envOriginal.FIREBASE_SERVICE_ACCOUNT_BASE64;
    }
  });

  it('em NODE_ENV=test nunca inicializa o Firebase, mesmo com credencial válida', async () => {
    process.env.NODE_ENV = 'test';
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = credencialFalsa;

    const id = await admin.messaging().send({ token: 't', notification: { title: 'a', body: 'b' } });

    expect(id).toBe('mock-message-id');
    expect(initializeApp).not.toHaveBeenCalled();
    expect(getMessaging).not.toHaveBeenCalled();
  });

  it('sem credencial (fora de teste) cai no simulado', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

    const id = await admin.messaging().send({ token: 't', notification: { title: 'a', body: 'b' } });

    expect(id).toBe('mock-message-id');
    expect(initializeApp).not.toHaveBeenCalled();
  });

  it('credencial inválida cai no simulado e não imprime a credencial', async () => {
    process.env.NODE_ENV = 'development';
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = 'SEGREDO-INVALIDO-123';

    const id = await admin.messaging().send({ token: 't', notification: { title: 'a', body: 'b' } });

    expect(id).toBe('mock-message-id');
    expect(initializeApp).not.toHaveBeenCalled();
    const impresso = JSON.stringify([...errSpy.mock.calls, ...warnSpy.mock.calls, ...logSpy.mock.calls]);
    expect(impresso).not.toContain('SEGREDO-INVALIDO-123');
  });

  it('com credencial válida fora de teste usa o Firebase (mockado) e inicializa uma vez só', async () => {
    process.env.NODE_ENV = 'development';
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = credencialFalsa;

    const msg = { token: 't', notification: { title: 'a', body: 'b' } };
    expect(await admin.messaging().send(msg)).toBe('id-real');
    expect(await admin.messaging().send(msg)).toBe('id-real');

    expect(initializeApp).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(msg);
  });
});