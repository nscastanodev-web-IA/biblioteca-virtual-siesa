<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\HttpException;
use App\Http\Request;
use App\Http\Response;
use App\Middleware\AuthMiddleware;
use App\Repositories\UserRepository;
use App\Support\Presenter;
use App\Validation\Validator;

final class ProfileController
{
    public function __construct(private UserRepository $users = new UserRepository())
    {
    }

    public function show(): Response
    {
        $user = AuthMiddleware::requireUser();

        return Response::json(Presenter::user($user));
    }

    public function update(Request $request): Response
    {
        $user = AuthMiddleware::requireUser();
        AuthMiddleware::requireCsrf($request);

        $fields = [];

        foreach (['phone', 'company', 'jobTitle', 'system'] as $field) {
            if ($request->input($field) !== null) {
                $fields[$field] = $request->string($field);
            }
        }

        (new Validator($fields))
            ->maxLength('phone', 'El teléfono', 30)
            ->maxLength('company', 'La empresa', 190)
            ->maxLength('jobTitle', 'El cargo', 120)
            ->maxLength('system', 'El sistema', 120)
            ->fail();

        // El repositorio espera snake_case.
        $mapped = [];

        foreach (['phone' => 'phone', 'company' => 'company', 'jobTitle' => 'job_title', 'system' => 'system_name'] as $key => $column) {
            if (array_key_exists($key, $fields)) {
                $mapped[$column] = $fields[$key];
            }
        }

        $this->users->updateProfile((int) $user['id'], $mapped);

        return Response::json(Presenter::user($this->users->findById((int) $user['id']) ?? $user));
    }

    public function password(Request $request): Response
    {
        $user = AuthMiddleware::requireUser();
        AuthMiddleware::requireCsrf($request);

        $data = [
            'currentPassword' => $request->string('currentPassword'),
            'password' => $request->string('password'),
            'passwordConfirmation' => $request->string('passwordConfirmation'),
        ];

        (new Validator($data))
            ->required('currentPassword', 'La contraseña actual')
            ->required('password', 'La nueva contraseña')
            ->same('passwordConfirmation', 'password', 'La confirmación de contraseña')
            ->password('password', 'La nueva contraseña')
            ->fail();

        if (!password_verify($data['currentPassword'], (string) $user['password_hash'])) {
            throw HttpException::unprocessable(
                'La contraseña actual no es correcta.',
                ['currentPassword' => ['La contraseña actual no es correcta.']],
            );
        }

        $this->users->updatePassword((int) $user['id'], password_hash($data['password'], PASSWORD_DEFAULT));

        return Response::json(['message' => 'Contraseña actualizada.']);
    }

    public function preferences(Request $request): Response
    {
        $user = AuthMiddleware::requireUser();
        AuthMiddleware::requireCsrf($request);

        $theme = $request->string('theme', 'system');

        (new Validator(['theme' => $theme]))
            ->in('theme', 'El tema', ['light', 'dark', 'system'])
            ->fail();

        $this->users->updateProfile((int) $user['id'], ['theme_preference' => $theme]);

        return Response::json(Presenter::user($this->users->findById((int) $user['id']) ?? $user));
    }

    public function onboarding(Request $request): Response
    {
        $user = AuthMiddleware::requireUser();
        AuthMiddleware::requireCsrf($request);

        $this->users->updateProfile((int) $user['id'], [
            'onboarding_completed' => $request->bool('completed'),
        ]);

        return Response::json(Presenter::user($this->users->findById((int) $user['id']) ?? $user));
    }
}
