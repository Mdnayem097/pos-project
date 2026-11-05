import { ValueTransformer } from 'typeorm';

// MySQL returns DECIMAL columns as strings. This converts them back to numbers.
export const money: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value == null ? value : parseFloat(value)),
};
