<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Connection;

final class NotificationRepository
{
    /** @return list<array<string, mixed>> */
    public function forUser(int $userId, bool $onlyUnread = false): array
    {
        $sql = 'SELECT * FROM notifications WHERE user_id = :user_id';

        if ($onlyUnread) {
            $sql .= ' AND read_at IS NULL';
        }

        $sql .= ' ORDER BY created_at DESC LIMIT 100';

        $statement = Connection::get()->prepare($sql);
        $statement->execute(['user_id' => $userId]);

        return $statement->fetchAll();
    }

    public function unreadCount(int $userId): int
    {
        $statement = Connection::get()->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = :user_id AND read_at IS NULL');
        $statement->execute(['user_id' => $userId]);

        return (int) $statement->fetchColumn();
    }

    public function markRead(int $id, int $userId): bool
    {
        $statement = Connection::get()->prepare(
            'UPDATE notifications SET read_at = NOW() WHERE id = :id AND user_id = :user_id AND read_at IS NULL',
        );
        $statement->execute(['id' => $id, 'user_id' => $userId]);

        return $statement->rowCount() > 0;
    }

    public function markAllRead(int $userId): int
    {
        $statement = Connection::get()->prepare('UPDATE notifications SET read_at = NOW() WHERE user_id = :user_id AND read_at IS NULL');
        $statement->execute(['user_id' => $userId]);

        return $statement->rowCount();
    }

    public function create(int $userId, string $type, string $title, string $message, ?string $linkPath = null): int
    {
        $connection = Connection::get();

        $connection->prepare(
            'INSERT INTO notifications (user_id, event_type, title, message, link_path)
             VALUES (:user_id, :event_type, :title, :message, :link_path)',
        )->execute([
            'user_id' => $userId,
            'event_type' => $type,
            'title' => $title,
            'message' => $message,
            'link_path' => $linkPath,
        ]);

        return (int) $connection->lastInsertId();
    }

    /**
     * Avisa a todo el equipo interno. En producción esto dispararía además el correo.
     *
     * @return list<int>
     */
    public function notifyAgents(string $type, string $title, string $message, ?string $linkPath = null): array
    {
        $statement = Connection::get()->query("SELECT id FROM users WHERE role = 'agente' AND status = 'activo'");
        $ids = [];

        foreach ($statement->fetchAll(\PDO::FETCH_COLUMN) as $agentId) {
            $ids[] = $this->create((int) $agentId, $type, $title, $message, $linkPath);
        }

        return $ids;
    }
}
