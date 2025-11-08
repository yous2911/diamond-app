"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievementsSchema = exports.RecordProgressSchema = exports.CompetenceProgressSchema = exports.ProgressSchema = exports.AttemptSchema = exports.RecommendationsSchema = exports.UpdateProfileSchema = exports.StudentSchema = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_schema_1 = require("./common.schema");
// Schema for student properties
exports.StudentSchema = typebox_1.Type.Object({
    id: typebox_1.Type.Integer(),
    prenom: typebox_1.Type.String(),
    nom: typebox_1.Type.String(),
    dateNaissance: typebox_1.Type.String({ format: 'date' }),
    niveauActuel: typebox_1.Type.String(),
    totalPoints: typebox_1.Type.Integer(),
    serieJours: typebox_1.Type.Integer(),
    mascotteType: typebox_1.Type.String(),
    dernierAcces: typebox_1.Type.String({ format: 'date-time' }),
    estConnecte: typebox_1.Type.Boolean()
});
// Schema for updating a student's profile
exports.UpdateProfileSchema = {
    body: typebox_1.Type.Object({
        prenom: typebox_1.Type.Optional(common_schema_1.SanitizedText),
        nom: typebox_1.Type.Optional(common_schema_1.SanitizedText),
        preferences: typebox_1.Type.Optional(typebox_1.Type.Object({}, { additionalProperties: true }))
    })
};
// Schema for student recommendations
exports.RecommendationsSchema = {
    params: common_schema_1.CommonIdParams,
    querystring: typebox_1.Type.Object({
        limit: typebox_1.Type.Optional(typebox_1.Type.Integer({ minimum: 1, maximum: 20, default: 5 }))
    })
};
// Schema for exercise attempt
exports.AttemptSchema = {
    params: common_schema_1.CommonIdParams,
    body: typebox_1.Type.Object({
        exerciseId: typebox_1.Type.Integer(),
        attempt: typebox_1.Type.Object({
            reussi: typebox_1.Type.Boolean(),
            tempsSecondes: typebox_1.Type.Integer({ minimum: 0 })
        })
    })
};
// Schema for getting student progress
exports.ProgressSchema = {
    params: common_schema_1.CommonIdParams
};
// Schema for getting student competence progress
exports.CompetenceProgressSchema = {
    params: common_schema_1.CommonIdParams
};
// Schema for recording student progress
exports.RecordProgressSchema = {
    params: common_schema_1.CommonIdParams,
    body: typebox_1.Type.Object({
    // Define the properties for recording progress
    })
};
// Schema for getting student achievements
exports.AchievementsSchema = {
    params: common_schema_1.CommonIdParams
};
