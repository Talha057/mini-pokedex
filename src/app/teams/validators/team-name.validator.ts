import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Observable, filter, map, switchMap, take, timer } from 'rxjs';
import { TEAM_NAME_DEBOUNCE_MS } from '../constants/team.constants';
import { TeamStore } from '../state/team.store';

type NameLookup = Pick<TeamStore, 'status$' | 'isNameTaken'>;

export function teamNameLengthValidator(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const length = String(control.value ?? '').trim().length;
    return length < min || length > max ? { nameLength: { min, max, actual: length } } : null;
  };
}


export function uniqueTeamNameValidator(
  teams: NameLookup,
  debounceMs = TEAM_NAME_DEBOUNCE_MS,
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> =>
    timer(debounceMs).pipe(
      switchMap(() =>
        teams.status$.pipe(
          filter((status) => status === 'success' || status === 'error'),
          take(1),
        ),
      ),
      map((status) =>
        status === 'success' && teams.isNameTaken(String(control.value ?? ''))
          ? { nameTaken: true }
          : null,
      ),
    );
}