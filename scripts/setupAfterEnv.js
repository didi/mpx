
expect.extend({
  toHaveBeenWarnedLast(received) {
    asserted.add(received);
    const passed =
      warn.mock.calls[warn.mock.calls.length - 1][0].includes(received);
    if (passed) {
      return {
        pass: true,
        message: () => `expected "${received}" not to have been warned last.`,
      };
    } else {
      const msgs = warn.mock.calls.map((args) => args[0]).join("\n - ");
      return {
        pass: false,
        message: () =>
          `expected "${received}" to have been warned last.\n\nActual messages:\n\n - ${msgs}`,
      };
    }
  },
}); 

let warn;
const asserted = new Set();

beforeEach(() => {
  asserted.clear();
  warn = jest.spyOn(console, "warn");
  warn.mockImplementation(() => {});
});

afterEach(() => {
  const assertedArray = Array.from(asserted);
  const nonAssertedWarnings = warn.mock.calls
    .map((args) => args[0])
    .filter((received) => {
      return !assertedArray.some((assertedMsg) => {
        return received.includes(assertedMsg);
      });
    });
  warn.mockRestore();
  if (nonAssertedWarnings.length) {
    throw new Error(
      `test case threw unexpected warnings:\n - ${nonAssertedWarnings.join(
        "\n - "
      )}`
    );
  }
});
