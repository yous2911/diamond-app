import { Type } from '@sinclair/typebox';
import { SanitizedText, CommonIdParams } from './common.schema';
// Schema for student properties
export const StudentSchema = Type.Object({
  id: Type.Integer(),
  prenom: Type.String(),
  nom: Type.String(),
  dateNaissance: Type.String({ format: 'date' }),
  niveauActuel: Type.String(),
  totalPoints: Type.Integer(),
  serieJours: Type.Integer(),
  mascotteType: Type.String(),
  dernierAcces: Type.String({ format: 'date-time' }),
  estConnecte: Type.Boolean()
});

// Schema for updating a student's profile
export const UpdateProfileSchema = {
  body: Type.Object({
    prenom: Type.Optional(SanitizedText),
    nom: Type.Optional(SanitizedText),
    preferences: Type.Optional(Type.Object({}, { additionalProperties: true }))
  })
};

// Schema for student recommendations
export const RecommendationsSchema = {
  params: CommonIdParams,
  querystring: Type.Object({
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 20, default: 5 }))
  })
};

// Schema for exercise attempt
export const AttemptSchema = {
  params: CommonIdParams,
  body: Type.Object({
    exerciseId: Type.Integer(),
    attempt: Type.Object({
      reussi: Type.Boolean(),
      tempsSecondes: Type.Integer({ minimum: 0 })
    })
  })
};

// Schema for getting student progress
export const ProgressSchema = {
  params: CommonIdParams
};

// Schema for getting student competence progress
export const CompetenceProgressSchema = {
  params: CommonIdParams
};

// Schema for recording student progress
export const RecordProgressSchema = {
  params: CommonIdParams,
  body: Type.Object({
    // Define the properties for recording progress
  })
};

// Schema for getting student achievements
export const AchievementsSchema = {
  params: CommonIdParams
};
