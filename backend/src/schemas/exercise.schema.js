"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExerciseStatsSchema = exports.GetRandomExercisesSchema = exports.GetExercisesByLevelSchema = exports.StudentHistorySchema = exports.AttemptExerciseSchema = exports.UpdateExerciseSchema = exports.CreateExerciseSchema = exports.GetExercisesSchema = exports.GenerateExercisesSchema = exports.CreateModuleSchema = exports.ExerciseSchema = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_schema_1 = require("./common.schema");
const CompetenceCode = typebox_1.Type.String({
    pattern: '^[A-Z]{2}\\.\\d{4}\\.\\d+$',
    description: 'Code de compétence (e.g., CP.2025.1)',
});
exports.ExerciseSchema = typebox_1.Type.Object({
    id: typebox_1.Type.Integer(),
    titre: common_schema_1.SanitizedText,
    competenceCode: CompetenceCode,
    niveau: typebox_1.Type.String(),
    typeExercice: typebox_1.Type.String(),
    matiere: typebox_1.Type.String(),
    difficulte: typebox_1.Type.String(),
    contenu: typebox_1.Type.Object({}, { additionalProperties: true }),
    solution: typebox_1.Type.Object({}, { additionalProperties: true }),
});
exports.CreateModuleSchema = {
    body: typebox_1.Type.Object({
        titre: common_schema_1.SanitizedText,
        description: common_schema_1.SanitizedHTML,
        competences: typebox_1.Type.Array(CompetenceCode),
        niveau: typebox_1.Type.String(),
    }),
};
exports.GenerateExercisesSchema = {
    body: typebox_1.Type.Object({
        competences: typebox_1.Type.Array(CompetenceCode),
        quantite: typebox_1.Type.Integer({ minimum: 1, maximum: 10 }),
        niveau: typebox_1.Type.String(),
    }),
};
exports.GetExercisesSchema = {
    querystring: typebox_1.Type.Intersect([
        common_schema_1.PaginationQuery,
        typebox_1.Type.Object({
            competence: typebox_1.Type.Optional(CompetenceCode),
            search: typebox_1.Type.Optional(common_schema_1.SanitizedText),
            matiere: typebox_1.Type.Optional(typebox_1.Type.String()),
            niveau: typebox_1.Type.Optional(typebox_1.Type.String()),
            difficulte: typebox_1.Type.Optional(typebox_1.Type.String()),
        }),
    ]),
};
exports.CreateExerciseSchema = {
    body: typebox_1.Type.Object({
        titre: common_schema_1.SanitizedText,
        competence: CompetenceCode,
        niveau: typebox_1.Type.String(),
        typeExercice: typebox_1.Type.String(),
        matiere: typebox_1.Type.String(),
        difficulte: typebox_1.Type.String(),
        contenu: typebox_1.Type.Object({}, { additionalProperties: true }),
        solution: typebox_1.Type.Object({}, { additionalProperties: true }),
    }),
};
exports.UpdateExerciseSchema = {
    params: common_schema_1.CommonIdParams,
    body: typebox_1.Type.Partial(exports.CreateExerciseSchema.body),
};
exports.AttemptExerciseSchema = {
    body: typebox_1.Type.Object({
        exerciseId: typebox_1.Type.Integer(),
        score: typebox_1.Type.Number({ minimum: 0, maximum: 100 }),
        completed: typebox_1.Type.Boolean(),
        timeSpent: typebox_1.Type.Optional(typebox_1.Type.Integer({ minimum: 0 })),
        answers: typebox_1.Type.Optional(typebox_1.Type.Object({}, { additionalProperties: true })),
    }),
};
exports.StudentHistorySchema = {
    params: common_schema_1.CommonIdParams,
    querystring: common_schema_1.PaginationQuery,
};
exports.GetExercisesByLevelSchema = {
    params: typebox_1.Type.Object({
        level: typebox_1.Type.Enum({
            CP: 'CP',
            CE1: 'CE1',
            CE2: 'CE2',
            CM1: 'CM1',
            CM2: 'CM2',
        }),
    }),
    querystring: typebox_1.Type.Object({
        matiere: typebox_1.Type.Optional(typebox_1.Type.Enum({
            MATHEMATIQUES: 'MATHEMATIQUES',
            FRANCAIS: 'FRANCAIS',
            SCIENCES: 'SCIENCES',
            HISTOIRE_GEOGRAPHIE: 'HISTOIRE_GEOGRAPHIE',
            ANGLAIS: 'ANGLAIS',
        })),
        type: typebox_1.Type.Optional(typebox_1.Type.Enum({
            QCM: 'QCM',
            CALCUL: 'CALCUL',
            TEXTE_LIBRE: 'TEXTE_LIBRE',
            DRAG_DROP: 'DRAG_DROP',
            CONJUGAISON: 'CONJUGAISON',
            LECTURE: 'LECTURE',
            GEOMETRIE: 'GEOMETRIE',
            PROBLEME: 'PROBLEME',
        })),
        difficulte: typebox_1.Type.Optional(typebox_1.Type.Enum({
            FACILE: 'FACILE',
            MOYEN: 'MOYEN',
            DIFFICILE: 'DIFFICILE',
        })),
        limit: typebox_1.Type.Optional(typebox_1.Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
    }),
};
exports.GetRandomExercisesSchema = {
    params: exports.GetExercisesByLevelSchema.params,
    querystring: typebox_1.Type.Object({
        count: typebox_1.Type.Optional(typebox_1.Type.Integer({ minimum: 1, maximum: 10, default: 5 })),
        exclude_types: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String())),
    }),
};
exports.GetExerciseStatsSchema = {
    params: typebox_1.Type.Object({
        level: typebox_1.Type.String(),
    }),
};
