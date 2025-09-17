import { Type } from '@sinclair/typebox';
import { SanitizedText, SanitizedHTML, CommonIdParams, PaginationQuery } from './common.schema';

const CompetenceCode = Type.RegEx(/^[A-Z]{2}\.\d{4}\.\d+$/, {
  description: 'Code de compétence (e.g., CP.2025.1)',
});

export const ExerciseSchema = Type.Object({
  id: Type.Integer(),
  titre: SanitizedText,
  competenceCode: CompetenceCode,
  niveau: Type.String(),
  typeExercice: Type.String(),
  matiere: Type.String(),
  difficulte: Type.String(),
  contenu: Type.Object({}, { additionalProperties: true }),
  solution: Type.Object({}, { additionalProperties: true }),
});

export const CreateModuleSchema = {
  body: Type.Object({
    titre: SanitizedText,
    description: SanitizedHTML,
    competences: Type.Array(CompetenceCode),
    niveau: Type.String(),
  }),
};

export const GenerateExercisesSchema = {
  body: Type.Object({
    competences: Type.Array(CompetenceCode),
    quantite: Type.Integer({ minimum: 1, maximum: 10 }),
    niveau: Type.String(),
  }),
};

export const GetExercisesSchema = {
  querystring: Type.Intersect([
    PaginationQuery,
    Type.Object({
      competence: Type.Optional(CompetenceCode),
      search: Type.Optional(SanitizedText),
      matiere: Type.Optional(Type.String()),
      niveau: Type.Optional(Type.String()),
      difficulte: Type.Optional(Type.String()),
    }),
  ]),
};

export const CreateExerciseSchema = {
  body: Type.Object({
    titre: SanitizedText,
    competence: CompetenceCode,
    niveau: Type.String(),
    typeExercice: Type.String(),
    matiere: Type.String(),
    difficulte: Type.String(),
    contenu: Type.Object({}, { additionalProperties: true }),
    solution: Type.Object({}, { additionalProperties: true }),
  }),
};

export const UpdateExerciseSchema = {
  params: CommonIdParams,
  body: Type.Partial(CreateExerciseSchema.body),
};

export const AttemptExerciseSchema = {
  body: Type.Object({
    exerciseId: Type.Integer(),
    score: Type.Number({ minimum: 0, maximum: 100 }),
    completed: Type.Boolean(),
    timeSpent: Type.Optional(Type.Integer({ minimum: 0 })),
    answers: Type.Optional(Type.Object({}, { additionalProperties: true })),
  }),
};

export const StudentHistorySchema = {
  params: CommonIdParams,
  querystring: PaginationQuery,
};

export const GetExercisesByLevelSchema = {
  params: Type.Object({
    level: Type.Enum({
      CP: 'CP',
      CE1: 'CE1',
      CE2: 'CE2',
      CM1: 'CM1',
      CM2: 'CM2',
    }),
  }),
  querystring: Type.Object({
    matiere: Type.Optional(Type.Enum({
      MATHEMATIQUES: 'MATHEMATIQUES',
      FRANCAIS: 'FRANCAIS',
      SCIENCES: 'SCIENCES',
      HISTOIRE_GEOGRAPHIE: 'HISTOIRE_GEOGRAPHIE',
      ANGLAIS: 'ANGLAIS',
    })),
    type: Type.Optional(Type.Enum({
      QCM: 'QCM',
      CALCUL: 'CALCUL',
      TEXTE_LIBRE: 'TEXTE_LIBRE',
      DRAG_DROP: 'DRAG_DROP',
      CONJUGAISON: 'CONJUGAISON',
      LECTURE: 'LECTURE',
      GEOMETRIE: 'GEOMETRIE',
      PROBLEME: 'PROBLEME',
    })),
    difficulte: Type.Optional(Type.Enum({
      FACILE: 'FACILE',
      MOYEN: 'MOYEN',
      DIFFICILE: 'DIFFICILE',
    })),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  }),
};

export const GetRandomExercisesSchema = {
  params: GetExercisesByLevelSchema.params,
  querystring: Type.Object({
    count: Type.Optional(Type.Integer({ minimum: 1, maximum: 10, default: 5 })),
    exclude_types: Type.Optional(Type.Array(Type.String())),
  }),
};

export const GetExerciseStatsSchema = {
  params: Type.Object({
    level: Type.String(),
  }),
};
