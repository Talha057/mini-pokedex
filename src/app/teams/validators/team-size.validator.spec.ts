import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { teamSizeValidator } from './team-size.validator';

describe('teamSizeValidator', () => {
  const validate = teamSizeValidator(1, 6);

  it('rejects an empty team', () => {
    expect(validate(new FormControl([]))).toEqual({ teamSize: { min: 1, max: 6, actual: 0 } });
  });

  it('accepts one to six members', () => {
    expect(validate(new FormControl([1]))).toBeNull();
    expect(validate(new FormControl([1, 2, 3, 4, 5, 6]))).toBeNull();
  });

  it('rejects more than six members', () => {
    expect(validate(new FormControl([1, 2, 3, 4, 5, 6, 7]))).not.toBeNull();
  });
});
