// Teste simples para verificar se Jest está funcionando
describe('Simple Test', () => {
  test('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should work with async', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });
});