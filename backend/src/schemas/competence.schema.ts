import { Type } from '@sinclair/typebox';
import { PaginationQuery, SanitizedText } from './common.schema';

const CompetenceCode = Type.RegEx(/^[A-Z]{2}\.\d{4}\.\d+$/, {
  description: 'Code de compétence (e.g., CP.2025.1)',
});

export const GetCompetenciesSchema = {
  querystring: Type.Intersect([
    PaginationQuery,
    Type.Object({
      level: Type.Optional(SanitizedText),
      subject: Type.Optional(SanitizedText),
    }),
  ]),
};

export const GetCompetenceSchema = {
  params: Type.Object({
    code: CompetenceCode,
  }),
};

export const GetPrerequisitesSchema = {
  params: Type.Object({
    code: CompetenceCode,
  }),
  querystring: Type.Object({
    includePrerequisiteDetails: Type.Optional(Type.Boolean({ default: true })),
    studentId: Type.Optional(Type.Integer()),
    depth: Type.Optional(Type.Integer({ default: 1, minimum: 1, maximum: 5 })),
  }),
};

export const GetProgressSchema = {
  params: Type.Object({
    code: CompetenceCode,
  }),
  querystring: Type.Object({
    studentId: Type.Optional(Type.Integer()),
    limit: Type.Optional(Type.Integer({ default: 50 })),
    offset: Type.Optional(Type.Integer({ default: 0 })),
  }),
};
