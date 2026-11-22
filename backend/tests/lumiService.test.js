import { jest } from "@jest/globals";

process.env.GEMINI_API_KEY = "chave-falsa-de-teste";
process.env.GEMINI_MODEL = "modelo-de-teste";

const generateContent = jest.fn();
const getGenerativeModel = jest.fn((params, opcoes) => ({ generateContent }));

jest.unstable_mockModule("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel(params, opcoes) {
      return getGenerativeModel(params, opcoes);
    }
  },
}));

const { gerarDica, verificarStatus, GeminiError } =
  await import("../services/lumiService.js");

const respostaOk = (texto) => ({ response: { text: () => texto } });

describe("lumiService (Gemini mockado)", () => {
  beforeEach(() => {
    generateContent.mockReset();
    getGenerativeModel.mockClear();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it("devolve a dica quando a Gemini responde e usa timeout", async () => {
    generateContent.mockResolvedValueOnce(respostaOk("  Pense na soma 🦊  "));

    const res = await gerarDica({
      pergunta: "Quanto é 2+2?",
      opcoes: ["3", "4"],
    });

    expect(res).toEqual({ dica: "Pense na soma 🦊" });
    const [params, opcoes] = getGenerativeModel.mock.calls[0];
    expect(params.model).toBe("modelo-de-teste");
    expect(opcoes.timeout).toBeGreaterThan(0);
  });

  it("lança GeminiError 503 quando a Gemini falha (ex.: sobrecarga ou timeout)", async () => {
    generateContent.mockRejectedValueOnce(new Error("high demand"));

    const erro = await gerarDica({ pergunta: "Teste?" }).catch((e) => e);

    expect(erro).toBeInstanceOf(GeminiError);
    expect(erro.statusHttp).toBe(503);
  });

  it("lança GeminiError 502 quando a resposta vem vazia", async () => {
    generateContent.mockResolvedValueOnce(respostaOk("   "));

    const erro = await gerarDica({ pergunta: "Teste?" }).catch((e) => e);

    expect(erro).toBeInstanceOf(GeminiError);
    expect(erro.statusHttp).toBe(502);
  });

  it("lança GeminiError 502 quando a resposta é bloqueada (text() lança)", async () => {
    generateContent.mockResolvedValueOnce({
      response: {
        text: () => {
          throw new Error("bloqueada");
        },
      },
    });

    const erro = await gerarDica({ pergunta: "Teste?" }).catch((e) => e);

    expect(erro.statusHttp).toBe(502);
  });

  it("verificarStatus devolve disponivel:false (sem vazar detalhes) quando a Gemini falha", async () => {
    generateContent.mockRejectedValueOnce(new Error("high demand"));

    expect(await verificarStatus()).toEqual({ disponivel: false });
  });
});
