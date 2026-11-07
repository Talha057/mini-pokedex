import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Pokemon } from '../../pokedex/models/pokemon.model';
import { PokemonPickerComponent } from '../components/pokemon-picker/pokemon-picker.component';
import {
  TEAM_MAX_POKEMON, TEAM_MIN_POKEMON, TEAM_NAME_MAX_LENGTH, TEAM_NAME_MIN_LENGTH,
} from '../constants/team.constants';
import { TeamStore } from '../state/team.store';
import { teamNameLengthValidator, uniqueTeamNameValidator } from '../validators/team-name.validator';
import { teamSizeValidator } from '../validators/team-size.validator';

@Component({
  selector: 'app-team-form-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PokemonPickerComponent],
  templateUrl: './team-form.component.html',
  styleUrl: './team-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamFormPage implements OnInit {
  readonly maxPokemon = TEAM_MAX_POKEMON;

  private readonly teamStore = inject(TeamStore);
  private readonly router = inject(Router);

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, teamNameLengthValidator(TEAM_NAME_MIN_LENGTH, TEAM_NAME_MAX_LENGTH)],
      asyncValidators: [uniqueTeamNameValidator(this.teamStore)],
    }),
    members: new FormControl<Pokemon[]>([], {
      nonNullable: true,
      validators: [teamSizeValidator(TEAM_MIN_POKEMON, TEAM_MAX_POKEMON)],
    }),
  });

  readonly formStatus = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  ngOnInit(): void {
    this.teamStore.load(); // the name validator needs the existing teams
  }

  nameError(): string | null {
    const control = this.form.controls.name;
    if (!(control.touched || control.dirty) || !control.errors) return null;
    if (control.errors['required']) return 'Team name is required.';
    if (control.errors['nameLength']) {
      return `Use ${TEAM_NAME_MIN_LENGTH} to ${TEAM_NAME_MAX_LENGTH} characters.`;
    }
    if (control.errors['nameTaken']) return 'A team with this name already exists.';
    return null;
  }

  membersError(): string | null {
    const control = this.form.controls.members;
    if (!(control.touched || control.dirty) || !control.errors) return null;
    return `Pick between ${TEAM_MIN_POKEMON} and ${TEAM_MAX_POKEMON} Pokémon.`;
  }

  addPokemon(pokemon: Pokemon): void {
    const control = this.form.controls.members;
    const current = control.value;
    if (current.length >= TEAM_MAX_POKEMON || current.some((member) => member.id === pokemon.id)) {
      return;
    }
    control.setValue([...current, pokemon]);
    control.markAsDirty();
  }

  removePokemon(id: number): void {
    const control = this.form.controls.members;
    control.setValue(control.value.filter((member) => member.id !== id));
    control.markAsDirty();
  }

  markMembersTouched(): void {
    this.form.controls.members.markAsTouched();
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { name, members } = this.form.getRawValue();

    this.teamStore
      .createTeam({ name: name.trim(), pokemonIds: members.map((member) => member.id) })
      .subscribe({ error: () => undefined }); // the store already reports the failure
    void this.router.navigateByUrl('/teams');
  }
}