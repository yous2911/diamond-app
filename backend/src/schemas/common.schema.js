"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorResponse = exports.SuccessResponse = exports.PaginationQuery = exports.CommonIdParams = exports.CommonParams = exports.IdOrCode = exports.SanitizedText = exports.SanitizedHTML = exports.SanitizedString = void 0;
const typebox_1 = require("@sinclair/typebox");
const xss_1 = __importDefault(require("xss"));
// Custom TypeBox keyword for sanitization
const SANITIZE_KEY = 'xss-clean';
// Custom TypeBox type for sanitized strings
function SanitizedString(options) {
    return typebox_1.Type.Transform(typebox_1.Type.String(options))
        .Decode(value => (0, xss_1.default)(value))
        .Encode(value => value);
}
exports.SanitizedString = SanitizedString;
// More specific sanitized types
exports.SanitizedHTML = SanitizedString({ description: 'Contenu HTML qui sera nettoyé des scripts potentiellement malveillants.' });
exports.SanitizedText = SanitizedString({ description: 'Texte simple qui sera nettoyé pour éviter les attaques XSS.' });
// General-purpose ID type
exports.IdOrCode = typebox_1.Type.String({
    pattern: '^[a-zA-Z0-9_.-]+$',
    description: 'ID ou code alphanumérique',
    examples: ['CE1.2024.1', 'student-123']
});
// Common parameter schemas
exports.CommonParams = typebox_1.Type.Object({
    id: exports.IdOrCode
});
exports.CommonIdParams = typebox_1.Type.Object({
    id: typebox_1.Type.Integer({ minimum: 1, description: "Identifiant numérique de l'entité" })
});
// Common query schemas
exports.PaginationQuery = typebox_1.Type.Object({
    page: typebox_1.Type.Optional(typebox_1.Type.Integer({ minimum: 1, default: 1, description: 'Numéro de page' })),
    limit: typebox_1.Type.Optional(typebox_1.Type.Integer({ minimum: 1, maximum: 100, default: 20, description: 'Nombre d\'éléments par page' }))
});
// Common response schemas
exports.SuccessResponse = typebox_1.Type.Object({
    success: typebox_1.Type.Boolean(),
    message: typebox_1.Type.Optional(typebox_1.Type.String())
});
exports.ErrorResponse = typebox_1.Type.Object({
    success: typebox_1.Type.Literal(false),
    error: typebox_1.Type.Object({
        code: typebox_1.Type.String(),
        message: typebox_1.Type.String()
    })
});
