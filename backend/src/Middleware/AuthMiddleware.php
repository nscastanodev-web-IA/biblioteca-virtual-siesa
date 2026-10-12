<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Http\HttpException;
use App\Http\Request;
use App\Repositories\UserRepository;
use App\Security\Session;

/**
 * Autenticación por sesión y control de roles.
 * Regla de negocio: solo agentes modifican estados y administran documentos.
 */
final class AuthMiddleware
{
    public static function user(): ?array
    {
        $id = Session::get('user_id');

        if (!is_int($id) && !is_string($id)) {
            return null;
        }

        return (new UserRepository())->findById((int) $id);
    }

    public static function requireUser(): array
    {
        $user = self::user();

        if ($user === null) {
            throw HttpException::unauthorized();
        }

        if (($user['status'] ?? '') === 'inactivo') {
            throw HttpException::forbidden('Tu cuenta está inactiva. Contacta a soporte.');
        }

        return $user;
    }

    public static function requireAgent(): array
    {
        $user = self::requireUser();

        if ($user['role'] !== 'agente') {
            throw HttpException::forbidden('Solo el equipo interno puede realizar esta acción.');
        }

        return $user;
    }

    /**
     * Las operaciones de escritura exigen el token CSRF de la sesión.
     */
    public static function requireCsrf(Request $request): void
    {
        if (!Session::verifyCsrf($request->csrfToken())) {
            throw new HttpException(419, 'El token de seguridad expiró. Recarga la página e intenta de nuevo.');
        }
    }
}
