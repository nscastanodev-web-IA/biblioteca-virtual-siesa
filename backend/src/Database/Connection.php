<?php

declare(strict_types=1);

namespace App\Database;

use App\Support\Env;
use PDO;
use PDOException;
use RuntimeException;

/**
 * Conexión PDO única y perezosa.
 * Todas las consultas del proyecto pasan por repositorios con sentencias preparadas.
 */
final class Connection
{
    private static ?PDO $pdo = null;

    public static function get(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            Env::get('DB_HOST', '127.0.0.1'),
            Env::get('DB_PORT', '3306'),
            Env::get('DB_DATABASE', 'biblioteca_siesa'),
        );

        try {
            self::$pdo = new PDO(
                $dsn,
                Env::get('DB_USERNAME', 'biblioteca'),
                Env::get('DB_PASSWORD', ''),
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::ATTR_STRINGIFY_FETCHES => false,
                ],
            );
        } catch (PDOException $exception) {
            throw new RuntimeException('No fue posible conectar con la base de datos.', 0, $exception);
        }

        return self::$pdo;
    }

    public static function reset(): void
    {
        self::$pdo = null;
    }
}
