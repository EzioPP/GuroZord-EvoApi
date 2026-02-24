const parts = {
  open: ['/', '|', '\\', '/\\', '|/'],
  inner: ['-', '~', '=', '--', '~~'],
  arrow: ['>', '>>', '|>', '/>'],
  close: ['\\', '|', '/', '\\|', '/|', '\\/'],
};

const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const randomFrame = () =>
  `${random(parts.open)}${random(parts.inner)}${random(parts.arrow)}${random(parts.inner)}${random(parts.close)}`;

export const randomVariation = (message: string): string => `${randomFrame()}\n${message}`;
