<?php

declare(strict_types=1);

namespace App;

use App\Http\HttpException;
use App\Http\Request;
use App\Http\Response;
use App\Http\Router;
use App\Security\Session;
use App\Support\Env;
use App\Support\Logger;
use Throwable;

/**
 * Arranque, enrutado y traducción de errores a JSON.
 */
final class Kernel
{
    public static function boot(): self
    {
        error_reporting(E_ALL);
        ini_set('display_errors', '0');
        ini_set('log_errors', '1');
        date_default_timezone_set(Env::get('APP_TIMEZONE', 'America/Bogota'));

        set_exception_handler(static function (Throwable $exception): void {
            Logger::error($exception);
            Response::error('Ocurrió un error inesperado. Intenta de nuevo.', [], 500)->send();
        });

        return new self();
    }

    public function run(): void
    {
        $request = Request::capture();

        try {
            Session::start();

            if ($request->method === 'OPTIONS') {
                $this->applyCors(Response::noContent())->send();

                return;
            }

            $router = new Router();

            /** @var callable(Router): void $register */
            $register = require BASE_PATH . '/config/routes.php';
            $register($router);

            $response = $router->dispatch($request);
        } catch (HttpException $exception) {
            $response = Response::error($exception->getMessage(), $exception->errors, $exception->status);
        } catch (Throwable $exception) {
            Logger::error($exception, ['path' => $request->path, 'method' => $request->method]);
            $response = Response::error('Ocurrió un error inesperado. Intenta de nuevo.', [], 500);
        }

        $this->applySecurityHeaders($this->applyCors($response))->send();
    }

    private function applyCors(Response $response): Response
    {
        return $response
            ->withHeader('Access-Control-Allow-Origin', Env::get('FRONTEND_URL', 'http://localhost:5173'))
            ->withHeader('Access-Control-Allow-Credentials', 'true')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token, Accept, X-Requested-With')
            ->withHeader('Vary', 'Origin');
    }

    private function applySecurityHeaders(Response $response): Response
    {
        return $response
            ->withHeader('X-Content-Type-Options', 'nosniff')
            // SAMEORIGIN permite incrustar el visor de PDF inline en el propio sitio
            // sin abrir la puerta a clickjacking desde otros orígenes.
            ->withHeader('X-Frame-Options', 'SAMEORIGIN')
            ->withHeader('Referrer-Policy', 'same-origin');
    }
}
