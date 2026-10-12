<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Connection;

final class UserRepository
{
    /** @return array<string, mixed>|null */
    public function findById(int $id): ?array
    {
        $statement = Connection::get()->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
        $statement->execute(['id' => $id]);
        $row = $statement->fetch();

        return $row === false ? null : $row;
    }

    /** @return array<string, mixed>|null */
    public function findByEmail(string $email): ?array
    {
        $statement = Connection::get()->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
        $statement->execute(['email' => mb_strtolower($email)]);
        $row = $statement->fetch();

        return $row === false ? null : $row;
    }

    /** @return array<string, mixed>|null */
    public function findByResetTokenHash(string $hash): ?array
    {
        $statement = Connection::get()->prepare(
            'SELECT u.* FROM auth_tokens t
             INNER JOIN users u ON u.id = t.user_id
             WHERE t.token_hash = :hash AND t.purpose = \'reset_password\'
               AND t.used_at IS NULL AND t.expires_at > NOW()
             LIMIT 1',
        );
        $statement->execute(['hash' => $hash]);
        $row = $statement->fetch();

        return $row === false ? null : $row;
    }

    /** @return array<string, mixed> */
    public function listAgents(): array
    {
        $statement = Connection::get()->query(
            "SELECT * FROM users WHERE role = 'agente' AND status = 'activo' ORDER BY first_name",
        );

        return $statement->fetchAll();
    }

    public function emailExists(string $email): bool
    {
        $statement = Connection::get()->prepare('SELECT 1 FROM users WHERE email = :email LIMIT 1');
        $statement->execute(['email' => mb_strtolower($email)]);

        return $statement->fetchColumn() !== false;
    }

    public function nitExists(string $nit): bool
    {
        $statement = Connection::get()->prepare('SELECT 1 FROM users WHERE nit = :nit LIMIT 1');
        $statement->execute(['nit' => $nit]);

        return $statement->fetchColumn() !== false;
    }

    /** @param array<string, string> $data */
    public function createClient(array $data, string $passwordHash): int
    {
        $statement = Connection::get()->prepare(
            'INSERT INTO users (email, phone, nit, company, first_name, last_name, job_title, system_name, password_hash, role, status, theme_preference)
             VALUES (:email, :phone, :nit, :company, :first_name, :last_name, :job_title, :system_name, :password_hash, \'cliente\', \'activo\', :theme)',
        );

        $statement->execute([
            'email' => mb_strtolower($data['email']),
            'phone' => $data['phone'] ?? '',
            'nit' => $data['nit'] ?? '',
            'company' => $data['company'] ?? '',
            'first_name' => $data['firstName'] ?? '',
            'last_name' => $data['lastName'] ?? '',
            'job_title' => $data['jobTitle'] ?? '',
            'system_name' => $data['system'] ?? 'Por configurar',
            'password_hash' => $passwordHash,
            'theme' => $data['theme'] ?? 'system',
        ]);

        return (int) Connection::get()->lastInsertId();
    }

    public function touchLastLogin(int $id): void
    {
        $statement = Connection::get()->prepare('UPDATE users SET last_login_at = NOW() WHERE id = :id');
        $statement->execute(['id' => $id]);
    }

    public function updatePassword(int $id, string $passwordHash): void
    {
        $statement = Connection::get()->prepare('UPDATE users SET password_hash = :hash WHERE id = :id');
        $statement->execute(['hash' => $passwordHash, 'id' => $id]);
    }

    /** @param array<string, mixed> $fields */
    public function updateProfile(int $id, array $fields): void
    {
        $allowed = [
            'phone' => 'phone',
            'company' => 'company',
            'job_title' => 'job_title',
            'system_name' => 'system_name',
            'theme_preference' => 'theme_preference',
            'onboarding_completed' => 'onboarding_completed',
        ];

        $assignments = [];
        $parameters = ['id' => $id];

        foreach ($allowed as $key => $column) {
            if (array_key_exists($key, $fields)) {
                $assignments[] = $column . ' = :' . $key;
                $parameters[$key] = $fields[$key];
            }
        }

        if ($assignments === []) {
            return;
        }

        $statement = Connection::get()->prepare('UPDATE users SET ' . implode(', ', $assignments) . ' WHERE id = :id');
        $statement->execute($parameters);
    }

    public function createAuthToken(int $userId, string $purpose, string $tokenHash, int $minutes): void
    {
        $connection = Connection::get();

        $connection->prepare('UPDATE auth_tokens SET used_at = NOW() WHERE user_id = :user_id AND purpose = :purpose AND used_at IS NULL')
            ->execute(['user_id' => $userId, 'purpose' => $purpose]);

        // El intervalo se interpola como entero (no admite marcador en MariaDB).
        $connection->prepare(
            'INSERT INTO auth_tokens (user_id, purpose, token_hash, expires_at)
             VALUES (:user_id, :purpose, :token_hash, DATE_ADD(NOW(), INTERVAL ' . max(1, $minutes) . ' MINUTE))',
        )->execute([
            'user_id' => $userId,
            'purpose' => $purpose,
            'token_hash' => $tokenHash,
        ]);
    }

    public function consumeAuthToken(string $tokenHash): void
    {
        Connection::get()
            ->prepare('UPDATE auth_tokens SET used_at = NOW() WHERE token_hash = :hash AND used_at IS NULL')
            ->execute(['hash' => $tokenHash]);
    }

    public function registerLoginAttempt(string $email, string $ip, bool $successful): void
    {
        Connection::get()
            ->prepare('INSERT INTO login_attempts (email, ip_address, successful) VALUES (:email, :ip, :successful)')
            ->execute([
                'email' => mb_strtolower($email),
                'ip' => $ip,
                'successful' => $successful ? 1 : 0,
            ]);
    }

    public function recentFailedAttempts(string $email, int $minutes): int
    {
        $statement = Connection::get()->prepare(
            'SELECT COUNT(*) FROM login_attempts
             WHERE email = :email AND successful = 0 AND attempted_at > DATE_SUB(NOW(), INTERVAL ' . max(1, $minutes) . ' MINUTE)',
        );
        $statement->execute(['email' => mb_strtolower($email)]);

        return (int) $statement->fetchColumn();
    }
}
