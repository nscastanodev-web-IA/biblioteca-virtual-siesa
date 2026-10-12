<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\HttpException;
use App\Repositories\NotificationRepository;
use App\Repositories\UserRepository;
use App\Security\Session;
use App\Support\Env;
use App\Support\Presenter;

final class AuthService
{
    public function __construct(
        private UserRepository $users = new UserRepository(),
        private NotificationRepository $notifications = new NotificationRepository(),
    ) {
    }

    private const MAX_ATTEMPTS = 8;

    private const ATTEMPT_WINDOW_MINUTES = 15;

    /**
     * @return array<string, mixed> usuario autenticado
     */
    public function login(string $email, string $password, string $ip): array
    {
        if ($this->users->recentFailedAttempts($email, self::ATTEMPT_WINDOW_MINUTES) >= self::MAX_ATTEMPTS) {
            throw new HttpException(429, 'Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.');
        }

        $user = $this->users->findByEmail($email);

        if ($user === null || !password_verify($password, (string) $user['password_hash'])) {
            $this->users->registerLoginAttempt($email, $ip, false);

            throw HttpException::unauthorized('Correo electrónico o contraseña incorrectos.');
        }

        if (($user['status'] ?? '') === 'inactivo') {
            throw HttpException::forbidden('Tu cuenta está inactiva. Contacta a soporte para reactivarla.');
        }

        $this->users->registerLoginAttempt($email, $ip, true);
        $this->users->touchLastLogin((int) $user['id']);

        Session::regenerate();
        Session::put('user_id', (int) $user['id']);
        Session::put('role', (string) $user['role']);

        return $user;
    }

    /**
     * El registro público solo puede crear clientes: el rol enviado por el
     * navegador se ignora por completo.
     *
     * @param array<string, mixed> $data
     */
    public function register(array $data): array
    {
        if ($this->users->emailExists((string) $data['email'])) {
            throw HttpException::unprocessable(
                'Ya existe una cuenta registrada con este correo.',
                ['email' => ['Ya existe una cuenta registrada con este correo.']],
            );
        }

        if (($data['nit'] ?? '') !== '' && $this->users->nitExists((string) $data['nit'])) {
            throw HttpException::unprocessable(
                'Ya existe una empresa registrada con este NIT. Contacta a soporte para asociarte.',
                ['nit' => ['Ya existe una empresa registrada con este NIT.']],
            );
        }

        $userId = $this->users->createClient($data, password_hash((string) $data['password'], PASSWORD_DEFAULT));

        // El envío real de correo no forma parte del alcance de esta fase.
        $verifyToken = bin2hex(random_bytes(32));
        $this->users->createAuthToken($userId, 'verify_email', hash('sha256', $verifyToken), 1440);

        return ['id' => $userId, 'verifyToken' => $verifyToken];
    }

    public function requestPasswordReset(string $email): ?string
    {
        $user = $this->users->findByEmail($email);

        // Respuesta idéntica exista o no la cuenta: evita enumerar correos.
        if ($user === null) {
            return null;
        }

        $token = bin2hex(random_bytes(32));
        $this->users->createAuthToken((int) $user['id'], 'reset_password', hash('sha256', $token), 60);

        return $token;
    }

    public function resetPassword(string $token, string $newPassword): void
    {
        $user = $this->users->findByResetTokenHash(hash('sha256', $token));

        if ($user === null) {
            throw HttpException::unprocessable('El enlace de recuperación no es válido o ya expiró.');
        }

        $this->users->updatePassword((int) $user['id'], password_hash($newPassword, PASSWORD_DEFAULT));
        $this->users->consumeAuthToken(hash('sha256', $token));
        $this->notifications->create(
            (int) $user['id'],
            'sistema',
            'Contraseña actualizada',
            'Tu contraseña fue cambiada correctamente. Si no fuiste tú, contacta a soporte de inmediato.',
            '/client/profile',
        );
    }

    public function logout(): void
    {
        Session::destroy();
    }

    /** @param array<string, mixed> $user */
    public function sessionPayload(array $user): array
    {
        return [
            'user' => Presenter::user($user),
            'permissions' => $this->permissions($user),
            'csrfToken' => Session::csrfToken(),
        ];
    }

    /** @param array<string, mixed> $user */
    private function permissions(array $user): array
    {
        $isAgent = ($user['role'] ?? '') === 'agente';

        return [
            'manageDocuments' => $isAgent,
            'manageRequests' => $isAgent,
            'viewAllRequests' => $isAgent,
            'download' => true,
            'isDemo' => Env::get('APP_ENV', 'local') !== 'production',
        ];
    }
}
