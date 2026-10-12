<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Middleware\AuthMiddleware;
use App\Security\Session;
use App\Services\AuthService;
use App\Support\Env;
use App\Validation\Validator;

final class AuthController
{
    public function __construct(private AuthService $auth = new AuthService())
    {
    }

    public function register(Request $request): Response
    {
        $data = [
            'email' => $request->string('email'),
            'nit' => $request->string('nit'),
            'company' => $request->string('company'),
            'phone' => $request->string('phone'),
            'firstName' => $request->string('firstName'),
            'lastName' => $request->string('lastName'),
            'jobTitle' => $request->string('jobTitle'),
            'password' => $request->string('password'),
            'passwordConfirmation' => $request->string('passwordConfirmation'),
        ];

        $validator = (new Validator($data))
            ->required('email', 'El correo electrónico')
            ->email('email', 'El correo electrónico')
            ->corporateEmail('email', 'El correo electrónico')
            ->required('firstName', 'El nombre')
            ->maxLength('firstName', 'El nombre', 100)
            ->required('lastName', 'El apellido')
            ->maxLength('lastName', 'El apellido', 100)
            ->required('company', 'La empresa')
            ->maxLength('company', 'La empresa', 190)
            ->required('nit', 'El NIT')
            ->digitsOnly('nit', 'El NIT')
            ->required('password', 'La contraseña')
            ->same('passwordConfirmation', 'password', 'La confirmación de contraseña')
            ->password('password', 'La contraseña')
            ->maxLength('jobTitle', 'El cargo', 120);

        $validator->fail();

        $result = $this->auth->register($data);

        return Response::json(
            ['id' => (string) $result['id']],
            ['message' => 'Cuenta creada. Revisa tu correo para verificarla.'],
            201,
        );
    }

    public function login(Request $request): Response
    {
        $data = [
            'email' => $request->string('email'),
            'password' => $request->input('password'),
        ];

        (new Validator($data))
            ->required('email', 'El correo electrónico')
            ->email('email', 'El correo electrónico')
            ->required('password', 'La contraseña')
            ->fail();

        $user = $this->auth->login((string) $data['email'], (string) $data['password'], $request->ip);

        return Response::json($this->auth->sessionPayload($user));
    }

    public function logout(Request $request): Response
    {
        AuthMiddleware::requireCsrf($request);

        $this->auth->logout();

        return Response::json(['ok' => true]);
    }

    /**
     * Devuelve el usuario actual (o null) junto con el token CSRF. Se responde
     * 200 incluso sin sesión para que el frontend pueda obtener el token antes
     * de autenticarse.
     */
    public function me(): Response
    {
        $user = AuthMiddleware::user();

        if ($user === null) {
            return Response::json([
                'user' => null,
                'permissions' => null,
                'csrfToken' => Session::csrfToken(),
            ]);
        }

        return Response::json($this->auth->sessionPayload($user));
    }

    public function forgotPassword(Request $request): Response
    {
        $email = $request->string('email');

        (new Validator(['email' => $email]))
            ->required('email', 'El correo electrónico')
            ->email('email', 'El correo electrónico')
            ->fail();

        $token = $this->auth->requestPasswordReset($email);

        $payload = [
            'message' => 'Si el correo está registrado, recibirás un enlace de recuperación.',
        ];

        // En entornos locales exponemos el token para poder probar el flujo.
        if ($token !== null && Env::get('APP_ENV', 'local') !== 'production') {
            $payload['resetToken'] = $token;
        }

        return Response::json($payload);
    }

    public function resetPassword(Request $request): Response
    {
        $data = [
            'token' => $request->string('token'),
            'password' => $request->string('password'),
            'passwordConfirmation' => $request->string('passwordConfirmation'),
        ];

        $validator = (new Validator($data))
            ->required('token', 'El token')
            ->required('password', 'La contraseña')
            ->same('passwordConfirmation', 'password', 'La confirmación de contraseña')
            ->password('password', 'La contraseña');

        $validator->fail();

        $this->auth->resetPassword($data['token'], $data['password']);

        return Response::json(['message' => 'Contraseña actualizada. Ya puedes iniciar sesión.']);
    }

    public function verifyEmail(Request $request): Response
    {
        // La verificación por correo real queda fuera del alcance de esta fase.
        $token = $request->string('token');

        (new Validator(['token' => $token]))->required('token', 'El token')->fail();

        return Response::json(['message' => 'Correo verificado. Ya puedes iniciar sesión.']);
    }
}
