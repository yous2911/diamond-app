"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetProgressSchema = exports.GetPrerequisitesSchema = exports.GetCompetenceSchema = exports.GetCompetenciesSchema = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_schema_1 = require("./common.schema");
const CompetenceCode = typebox_1.Type.String({
    pattern: '^[A-Z]{2}\\.\\d{4}\\.\\d+$',
    description: 'Code de compétence (e.g., CP.2025.1)',
});
exports.GetCompetenciesSchema = {
    querystring: typebox_1.Type.Intersect([
        common_schema_1.PaginationQuery,
        typebox_1.Type.Object({
            level: typebox_1.Type.Optional(common_schema_1.SanitizedText),
            subject: typebox_1.Type.Optional(common_schema_1.SanitizedText),
        }),
    ]),
};
exports.GetCompetenceSchema = {
    params: typebox_1.Type.Object({
        code: CompetenceCode,
    }),
};
exports.GetPrerequisitesSchema = {
    params: typebox_1.Type.Object({
        code: CompetenceCode,
    }),
    querystring: typebox_1.Type.Object({
        includePrerequisiteDetails: typebox_1.Type.Optional(typebox_1.Type.Boolean({ default: true })),
        studentId: typebox_1.Type.Optional(typebox_1.Type.Integer()),
        depth: typebox_1.Type.Optional(typebox_1.Type.Integer({ default: 1, minimum: 1, maximum: 5 })),
    }),
};
exports.GetProgressSchema = {
    params: typebox_1.Type.Object({
        code: CompetenceCode,
    }),
    querystring: typebox_1.Type.Object({
        studentId: typebox_1.Type.Optional(typebox_1.Type.Integer()),
        limit: typebox_1.Type.Optional(typebox_1.Type.Integer({ default: 50 })),
        offset: typebox_1.Type.Optional(typebox_1.Type.Integer({ default: 0 })),
    }),
};
