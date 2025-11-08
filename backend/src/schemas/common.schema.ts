import { Type, Kind, TSchema, TString, StringOptions } from '@sinclair/typebox';
import xss from 'xss';

// Custom TypeBox keyword for sanitization
const SANITIZE_KEY = 'xss-clean';

// Custom TypeBox type for sanitized strings
export function SanitizedString<T extends StringOptions>(options?: T) {
  return Type.Transform(Type.String(options))
    .Decode(value => xss(value))
    .Encode(value => value);
}

// More specific sanitized types
export const SanitizedHTML = SanitizedString({ description: 'Contenu HTML qui sera nettoyé des scripts potentiellement malveillants.' });
export const SanitizedText = SanitizedString({ description: 'Texte simple qui sera nettoyé pour éviter les attaques XSS.' });

// General-purpose ID type
export const IdOrCode = Type.String({
  pattern: '^[a-zA-Z0-9_.-]+$',
  description: 'ID ou code alphanumérique',
  examples: ['CE1.2024.1', 'student-123']
});

// Common parameter schemas
export const CommonParams = Type.Object({
  id: IdOrCode
});

export const CommonIdParams = Type.Object({
  id: Type.Integer({ minimum: 1, description: "Identifiant numérique de l'entité" })
});

// Common query schemas
export const PaginationQuery = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1, description: 'Numéro de page' })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20, description: 'Nombre d\'éléments par page' }))
});

// Common response schemas
export const SuccessResponse = Type.Object({
  success: Type.Boolean(),
  message: Type.Optional(Type.String())
});

export const ErrorResponse = Type.Object({
  success: Type.Literal(false),
  error: Type.Object({
    code: Type.String(),
    message: Type.String()
  })
});
