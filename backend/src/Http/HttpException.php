<?php

declare(strict_types=1);

namespace App\Http;

use RuntimeException;

/**
 * Error HTTP controlado. El Kernel lo traduce a una respuesta JSON segura.
 */
final class HttpException extends RuntimeException
{
    /** @param array<string, array<int, string>> $errors */
    public function __construct(
        public readonly int $status,
        string $message,
        public readonly array $errors = [],
    ) {
        parent::__construct($message, $status);
    }

    /** @param array<string, array<int, string>> $errors */
    public static function unprocessable(string $message, array $errors = []): self
    {
        return new self(422, $message, $errors);
    }

    public static function unauthorized(string $message = 'Debes iniciar sesión para continuar.'): self
    {
        return new self(401, $message);
    }

    public static function forbidden(string $message = 'No tienes permisos para realizar esta acción.'): self
    {
        return new self(403, $message);
    }

    public static function notFound(string $message = 'El recurso solicitado no existe.'): self
    {
        return new self(404, $message);
    }
}
