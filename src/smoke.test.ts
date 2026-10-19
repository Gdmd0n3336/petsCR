describe('test runner', () => {
  it('runs in jsdom', () => {
    expect(document.createElement('div')).toBeInstanceOf(HTMLElement);
  });
});
