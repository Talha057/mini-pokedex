import { FormControl, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoadStatus } from '../../common/models/load-status.model';
import { teamNameLengthValidator, uniqueTeamNameValidator } from './team-name.validator';

describe('teamNameLengthValidator', () => {
  const validate = teamNameLengthValidator(3, 30);

  it('accepts a name inside the range', () => {
    expect(validate(new FormControl('Elite Four'))).toBeNull();
  });

  it('measures the trimmed name, so padding does not count', () => {
    expect(validate(new FormControl('  ab  '))).toEqual({
      nameLength: { min: 3, max: 30, actual: 2 },
    });
  });

  it('rejects a name that is too long', () => {
    expect(validate(new FormControl('x'.repeat(31)))).not.toBeNull();
  });
});

describe('uniqueTeamNameValidator', () => {
  function validateWith(status: LoadStatus, value: string) {
    const lookup = {
      status$: of(status),
      isNameTaken: (name: string) => name.trim().toLowerCase() === 'kanto starters',
    };
    const out: { current: ValidationErrors | null | undefined } = { current: undefined };
    (uniqueTeamNameValidator(lookup, 300)(new FormControl(value)) as Observable<ValidationErrors | null>)
      .subscribe((result) => (out.current = result));
    return out;
  }

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('answers only after the debounce window', () => {
    const out = validateWith('success', 'Kanto Starters');

    vi.advanceTimersByTime(299);
    expect(out.current).toBeUndefined();

    vi.advanceTimersByTime(1);
    expect(out.current).toEqual({ nameTaken: true });
  });

  it('ignores case and surrounding spaces', () => {
    const out = validateWith('success', '  KANTO starters ');
    vi.advanceTimersByTime(300);

    expect(out.current).toEqual({ nameTaken: true });
  });

  it('accepts a name that is not used yet', () => {
    const out = validateWith('success', 'Elite Four');
    vi.advanceTimersByTime(300);

    expect(out.current).toBeNull();
  });

  it('skips the check when the team list failed to load', () => {
    const out = validateWith('error', 'Kanto Starters');
    vi.advanceTimersByTime(300);

    expect(out.current).toBeNull();
  });
});