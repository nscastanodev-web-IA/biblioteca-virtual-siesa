<?php

declare(strict_types=1);

namespace App\Http;

/**
 * Respuesta HTTP. Serializa el contrato { data, meta } de docs/API.md.
 */
final class Response
{
    /** @param array<string, string> $headers */
    public function __construct(
        public readonly int $status,
        public readonly string $body,
        public readonly array $headers = [],
    ) {
    }

    /** @param array<string, mixed> $meta */
    public static function json(mixed $data, array $meta = [], int $status = 200): self
    {
        $payload = ['data' => $data];

        if ($meta !== []) {
            $payload['meta'] = $meta;
        }

        return new self(
            $status,
            self::encode($payload),
            ['Content-Type' => 'application/json; charset=utf-8'],
        );
    }

    /** @param array<string, array<int, string>> $errors */
    public static function error(string $message, array $errors = [], int $status = 400): self
    {
        $payload = ['message' => $message];

        if ($errors !== []) {
            $payload['errors'] = $errors;
        }

        return new self(
            $status,
            self::encode($payload),
            ['Content-Type' => 'application/json; charset=utf-8'],
        );
    }

    public static function noContent(): self
    {
        return new self(204, '');
    }

    /** @param array<string, string> $headers */
    public static function bytes(string $content, string $contentType, int $status = 200, array $headers = []): self
    {
        return new self($status, $content, ['Content-Type' => $contentType] + $headers);
    }

    public function withHeader(string $name, string $value): self
    {
        $headers = $this->headers;
        $headers[$name] = $value;

        return new self($this->status, $this->body, $headers);
    }

    public function send(): void
    {
        if (!headers_sent()) {
            http_response_code($this->status);

            foreach ($this->headers as $name => $value) {
                header($name . ': ' . $value);
            }
        }

        if ($this->status !== 204) {
            echo $this->body;
        }
    }

    /** @param array<string, mixed> $payload */
    private static function encode(array $payload): string
    {
        return (string) json_encode(
            $payload,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION,
        );
    }
}
