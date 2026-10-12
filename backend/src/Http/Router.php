<?php

declare(strict_types=1);

namespace App\Http;

/**
 * Enrutador mínimo con parámetros tipo {id}.
 */
final class Router
{
    /** @var list<array{method: string, regex: string, params: list<string>, handler: callable}> */
    private array $routes = [];

    public function get(string $pattern, callable $handler): void
    {
        $this->add('GET', $pattern, $handler);
    }

    public function post(string $pattern, callable $handler): void
    {
        $this->add('POST', $pattern, $handler);
    }

    public function patch(string $pattern, callable $handler): void
    {
        $this->add('PATCH', $pattern, $handler);
    }

    public function delete(string $pattern, callable $handler): void
    {
        $this->add('DELETE', $pattern, $handler);
    }

    public function add(string $method, string $pattern, callable $handler): void
    {
        /** @var list<string> $params */
        $params = [];

        $regex = (string) preg_replace_callback(
            '#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#',
            static function (array $matches) use (&$params): string {
                $params[] = $matches[1];

                return '([^/]+)';
            },
            $pattern,
        );

        $this->routes[] = [
            'method' => strtoupper($method),
            'regex' => '#^' . $regex . '$#',
            'params' => $params,
            'handler' => $handler,
        ];
    }

    public function dispatch(Request $request): Response
    {
        $allowed = [];

        foreach ($this->routes as $route) {
            if (preg_match($route['regex'], $request->path, $matches) !== 1) {
                continue;
            }

            if ($route['method'] !== $request->method) {
                $allowed[] = $route['method'];

                continue;
            }

            array_shift($matches);

            /** @var array<string, string> $arguments */
            $arguments = $route['params'] === [] ? [] : array_combine($route['params'], $matches);

            /** @var Response $response */
            $response = ($route['handler'])($request, $arguments);

            return $response;
        }

        if ($allowed !== []) {
            throw new HttpException(405, 'El método HTTP no está permitido para esta ruta.');
        }

        throw HttpException::notFound('La ruta solicitada no existe.');
    }
}
