<?php

declare(strict_types=1);

// =====================================================================
// Arranque del backend Biblioteca Virtual Siesa
// =====================================================================
// Autoloader PSR-4 mínimo (namespace App\ -> backend/src).
// No requiere Composer para funcionar; composer.json existe solo para
// autoload optimizado si más adelante se agregan dependencias.
// =====================================================================

const BASE_PATH = __DIR__;

spl_autoload_register(static function (string $class): void {
    $prefix = 'App\\';

    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relative = str_replace('\\', '/', substr($class, strlen($prefix)));
    $path = BASE_PATH . '/src/' . $relative . '.php';

    if (is_file($path)) {
        require $path;
    }
});

App\Support\Env::load(BASE_PATH . '/.env');
