<?php

declare(strict_types=1);

namespace App\Validation;

use App\Http\HttpException;

/**
 * Validador de entrada. Acumula todos los errores y los devuelve en el
 * formato { campo: [detalles] } descrito en docs/API.md.
 */
final class Validator
{
    /** @var array<string, list<string>> */
    private array $errors = [];

    /** @param array<string, mixed> $data */
    public function __construct(private array $data)
    {
    }

    public function required(string $field, string $label): self
    {
        $value = $this->data[$field] ?? null;

        if ($value === null || (is_string($value) && trim($value) === '') || $value === []) {
            $this->add($field, $label . ' es obligatorio.');
        }

        return $this;
    }

    public function email(string $field, string $label): self
    {
        $value = trim((string) ($this->data[$field] ?? ''));

        if ($value !== '' && filter_var($value, FILTER_VALIDATE_EMAIL) === false) {
            $this->add($field, $label . ' no tiene un formato válido.');
        }

        return $this;
    }

    public function corporateEmail(string $field, string $label): self
    {
        $value = trim((string) ($this->data[$field] ?? ''));
        $domain = mb_strtolower((string) strrchr($value, '@'));

        $free = ['@gmail.com', '@hotmail.com', '@outlook.com', '@yahoo.com', '@live.com'];

        if ($value !== '' && in_array($domain, $free, true)) {
            $this->add($field, $label . ' debe ser tu correo empresarial.');
        }

        return $this;
    }

    public function minLength(string $field, string $label, int $min): self
    {
        $value = trim((string) ($this->data[$field] ?? ''));

        if ($value !== '' && mb_strlen($value) < $min) {
            $this->add($field, sprintf('%s debe tener al menos %d caracteres.', $label, $min));
        }

        return $this;
    }

    public function maxLength(string $field, string $label, int $max): self
    {
        $value = trim((string) ($this->data[$field] ?? ''));

        if (mb_strlen($value) > $max) {
            $this->add($field, sprintf('%s no puede superar %d caracteres.', $label, $max));
        }

        return $this;
    }

    /** @param list<string> $allowed */
    public function in(string $field, string $label, array $allowed): self
    {
        $value = $this->data[$field] ?? null;

        if ($value !== null && $value !== '' && !in_array((string) $value, $allowed, true)) {
            $this->add($field, $label . ' tiene un valor no permitido.');
        }

        return $this;
    }

    public function integer(string $field, string $label): self
    {
        $value = $this->data[$field] ?? null;

        if ($value !== null && $value !== '' && !is_numeric($value)) {
            $this->add($field, $label . ' debe ser numérico.');
        }

        return $this;
    }

    public function digitsOnly(string $field, string $label): self
    {
        $value = trim((string) ($this->data[$field] ?? ''));

        if ($value !== '' && preg_match('/^\d+$/', $value) !== 1) {
            $this->add($field, $label . ' debe contener únicamente números.');
        }

        return $this;
    }

    /**
     * Requisitos mínimos de contraseña: 8 caracteres, mayúscula y número.
     */
    public function password(string $field, string $label): self
    {
        $value = (string) ($this->data[$field] ?? '');

        if ($value === '') {
            return $this;
        }

        if (mb_strlen($value) < 8 || preg_match('/[A-Z]/', $value) !== 1 || preg_match('/\d/', $value) !== 1) {
            $this->add($field, $label . ' debe tener mínimo 8 caracteres, una mayúscula y un número.');
        }

        return $this;
    }

    /**
     * Comprueba que dos campos tengan el mismo valor (confirmaciones).
     */
    public function same(string $field, string $other, string $label): self
    {
        $value = $this->data[$field] ?? null;
        $reference = $this->data[$other] ?? null;

        if ((string) $value !== (string) $reference) {
            $this->add($field, $label . ' no coincide.');
        }

        return $this;
    }

    public function accepted(string $field, string $label): self
    {
        if (($this->data[$field] ?? false) !== true) {
            $this->add($field, 'Debes ' . mb_strtolower($label) . '.');
        }

        return $this;
    }

    public function passes(): bool
    {
        return $this->errors === [];
    }

    /** @return array<string, list<string>> */
    public function errors(): array
    {
        return $this->errors;
    }

    public function fail(string $message = 'Revisa los datos ingresados.'): void
    {
        if ($this->errors !== []) {
            throw HttpException::unprocessable($message, $this->errors);
        }
    }

    private function add(string $field, string $message): void
    {
        $this->errors[$field] ??= [];
        $this->errors[$field][] = $message;
    }
}
