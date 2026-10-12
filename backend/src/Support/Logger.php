<?php

declare(strict_types=1);

namespace App\Support;

use Throwable;

/**
 * Bitácora simple de errores. Nunca expone detalles técnicos al cliente.
 */
final class Logger
{
    public static function error(Throwable $exception, array $context = []): void
    {
        $directory = BASE_PATH . '/storage/logs';

        if (!is_dir($directory)) {
            @mkdir($directory, 0775, true);
        }

        $line = sprintf(
            "[%s] %s: %s en %s:%d%s%s\n",
            date('Y-m-d H:i:s'),
            $exception::class,
            $exception->getMessage(),
            $exception->getFile(),
            $exception->getLine(),
            $context === [] ? '' : ' | contexto: ' . json_encode($context, JSON_UNESCAPED_UNICODE),
            PHP_EOL . $exception->getTraceAsString(),
        );

        @file_put_contents($directory . '/api.log', $line, FILE_APPEND | LOCK_EX);
    }

    public static function info(string $message): void
    {
        $directory = BASE_PATH . '/storage/logs';

        if (!is_dir($directory)) {
            @mkdir($directory, 0775, true);
        }

        @file_put_contents(
            $directory . '/api.log',
            sprintf("[%s] INFO: %s\n", date('Y-m-d H:i:s'), $message),
            FILE_APPEND | LOCK_EX,
        );
    }
}
