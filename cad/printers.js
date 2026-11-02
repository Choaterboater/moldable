// Manufacturer source (W×D×H): https://bambulab.com/en/h2c/specs
// The combined 330×320×320 volume is NOT the dual-nozzle printable envelope.
export const H2C_PROFILES = [
  { name: 'H2C · left nozzle', spec: '325x320x320', volume: [325,320,320] },
  { name: 'H2C · right nozzle', spec: '305x320x325', volume: [305,320,325] },
  { name: 'H2C · dual nozzle', spec: '300x320x320', volume: [300,320,320] },
];
