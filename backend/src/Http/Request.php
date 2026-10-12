<?php

declare(strict_types=1);

namespace App\Http;

/**
 * Petición HTTP normalizada. Los controladores solo ven esta abstracción.
 */
final class Request
{
    public const METHODS_WITH_BODY = ['POST', 'PATCH', 'PUT', 'DELETE'];

    /**
     * @param array<string, mixed>  $query
     * @param array<string, mixed>  $body
     * @param array<string, mixed>  $files
     * @param array<string, string> $headers
     * @param array<string, string> $cookies
     */
    public function __construct(
        public readonly string $method,
        public readonly string $path,
        public readonly array $query = [],
        public readonly array $body = [],
        public readonly array $files = [],
        public readonly array $headers = [],
        public readonly array $cookies = [],
        public readonly string $ip = '',
    ) {
    }

    public static function capture(): self
    {
        $uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
        $path = (string) (parse_url($uri, PHP_URL_PATH) ?? '/');
        $path = '/' . trim($path, '/');

        $contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));

        $body = [];
        $files = [];

        if (str_contains($contentType, 'application/json')) {
            $raw = (string) file_get_contents('php://input');

            if ($raw !== '') {
                $decoded = json_decode($raw, true);

                if (is_array($decoded)) {
                    $body = $decoded;
                }
            }
        } else {
            /** @var array<string, mixed> $post */
            $post = $_POST;
            $body = $post;
            $files = $_FILES;
        }

        $headers = [];

        foreach ($_SERVER as $key => $value) {
            if (!is_string($key) || !is_string($value)) {
                continue;
            }

            if (str_starts_with($key, 'HTTP_')) {
                $headers[strtolower(str_replace('_', '-', substr($key, 5)))] = $value;
            }
        }

        if (isset($_SERVER['CONTENT_TYPE']) && is_string($_SERVER['CONTENT_TYPE'])) {
            $headers['content-type'] = $_SERVER['CONTENT_TYPE'];
        }

        /** @var array<string, string> $cookies */
        $cookies = $_COOKIE;

        return new self(
            method: strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')),
            path: $path,
            query: $_GET,
            body: $body,
            files: $files,
            headers: $headers,
            cookies: $cookies,
            ip: (string) ($_SERVER['REMOTE_ADDR'] ?? ''),
        );
    }

    public function header(string $name): ?string
    {
        return $this->headers[strtolower($name)] ?? null;
    }

    public function input(string $key, mixed $default = null): mixed
    {
        return $this->body[$key] ?? $default;
    }

    public function string(string $key, string $default = ''): string
    {
        $value = $this->body[$key] ?? $default;

        return is_scalar($value) ? trim((string) $value) : $default;
    }

    public function int(string $key, int $default = 0): int
    {
        $value = $this->body[$key] ?? null;

        return is_numeric($value) ? (int) $value : $default;
    }

    public function bool(string $key, bool $default = false): bool
    {
        $value = $this->body[$key] ?? null;

        if (is_bool($value)) {
            return $value;
        }

        if (is_scalar($value)) {
            return in_array(strtolower((string) $value), ['1', 'true', 'yes', 'on', 'si', 'sí'], true);
        }

        return $default;
    }

    public function queryParam(string $key, ?string $default = null): ?string
    {
        $value = $this->query[$key] ?? null;

        return is_scalar($value) && (string) $value !== '' ? (string) $value : $default;
    }

    public function csrfToken(): ?string
    {
        return $this->header('x-csrf-token')
            ?? (is_string($this->body['_csrf'] ?? null) ? $this->body['_csrf'] : null);
    }

    public function wantsJson(): bool
    {
        return str_contains((string) $this->header('accept'), 'application/json')
            || $this->header('x-requested-with') === 'XMLHttpRequest';
    }
}
