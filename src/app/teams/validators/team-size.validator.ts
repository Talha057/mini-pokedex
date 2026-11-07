import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function teamSizeValidator(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const size = Array.isArray(control.value) ? control.value.length : 0;
    return size < min || size > max ? { teamSize: { min, max, actual: size } } : null;
  };
}