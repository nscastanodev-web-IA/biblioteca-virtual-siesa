<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Traduce filas de MariaDB (snake_case) al contrato JSON que consume el frontend
 * (src/types/index.ts). Así el frontend no conoce detalles de la base de datos.
 */
final class Presenter
{
    /** @param array<string, mixed> $row */
    public static function user(array $row): array
    {
        $firstName = (string) ($row['first_name'] ?? '');
        $lastName = (string) ($row['last_name'] ?? '');
        $name = trim($firstName . ' ' . $lastName);

        return [
            'id' => self::id($row['id'] ?? null),
            'name' => $name,
            'email' => (string) ($row['email'] ?? ''),
            'phone' => (string) ($row['phone'] ?? ''),
            'company' => (string) ($row['company'] ?? ''),
            'nit' => (string) ($row['nit'] ?? ''),
            'jobTitle' => (string) ($row['job_title'] ?? ''),
            'system' => (string) ($row['system_name'] ?? ''),
            'userRole' => (string) ($row['role'] ?? 'cliente'),
            'registeredAt' => self::date($row['created_at'] ?? null),
            'status' => (string) ($row['status'] ?? 'activo'),
            'avatarInitials' => self::initials($name),
            'themePreference' => (string) ($row['theme_preference'] ?? 'system'),
            'onboardingCompleted' => (bool) ($row['onboarding_completed'] ?? false),
        ];
    }

    /** @param array<string, mixed> $row */
    public static function document(array $row, array $relatedIds = []): array
    {
        $publishedAt = self::date($row['published_at'] ?? null);
        $updatedAt = self::date($row['updated_at'] ?? null);

        return [
            'id' => self::id($row['id'] ?? null),
            'title' => (string) ($row['title'] ?? ''),
            'description' => (string) ($row['description'] ?? ''),
            'type' => (string) ($row['type'] ?? 'Manual'),
            'system' => (string) ($row['system_name'] ?? ''),
            'app' => (string) ($row['application_name'] ?? ''),
            'version' => (string) ($row['version_label'] ?? ''),
            'year' => (int) ($row['publication_year'] ?? 0),
            'publishedAt' => $publishedAt,
            'updatedAt' => $updatedAt,
            'format' => 'PDF',
            'fileSize' => self::fileSize((int) ($row['detected_size'] ?? 0)),
            'keywords' => self::keywords($row['keywords'] ?? null),
            'isNew' => self::isRecent($publishedAt, 30),
            'isUpdated' => $updatedAt !== '' && $publishedAt !== '' && strtotime($updatedAt) > strtotime($publishedAt) + 86400,
            'views' => (int) ($row['views_count'] ?? 0),
            'downloads' => (int) ($row['downloads_count'] ?? 0),
            'relatedDocIds' => $relatedIds,
            'active' => (string) ($row['status'] ?? '') === 'publicado',
            'status' => (string) ($row['status'] ?? 'borrador'),
            'currentVersion' => (int) ($row['current_version'] ?? 1),
        ];
    }

    /** @param array<string, mixed> $row */
    public static function historyEntry(array $row): array
    {
        return [
            'id' => self::id($row['id'] ?? null),
            'previousStatus' => $row['previous_status'] !== null ? (string) $row['previous_status'] : null,
            'newStatus' => (string) ($row['new_status'] ?? ''),
            'date' => self::dateTime($row['created_at'] ?? null),
            'userId' => self::id($row['responsible_user_id'] ?? null),
            'comment' => (string) ($row['comment_text'] ?? ''),
            'internal' => (string) ($row['visibility'] ?? 'cliente') === 'interno',
            'action' => (string) ($row['action_name'] ?? ''),
        ];
    }

    /** @param array<string, mixed> $row */
    public static function comment(array $row): array
    {
        return [
            'id' => self::id($row['id'] ?? null),
            'requestId' => self::id($row['request_id'] ?? null),
            'userId' => self::id($row['responsible_user_id'] ?? null),
            'text' => (string) ($row['comment_text'] ?? ''),
            'date' => self::dateTime($row['created_at'] ?? null),
            'internal' => (string) ($row['visibility'] ?? 'cliente') === 'interno',
        ];
    }

    /** @param array<string, mixed> $row */
    public static function notification(array $row): array
    {
        return [
            'id' => self::id($row['id'] ?? null),
            'userId' => self::id($row['user_id'] ?? null),
            'title' => (string) ($row['title'] ?? ''),
            'message' => (string) ($row['message'] ?? ''),
            'date' => self::dateTime($row['created_at'] ?? null),
            'read' => ($row['read_at'] ?? null) !== null,
            'type' => (string) ($row['event_type'] ?? 'sistema'),
            'linkPath' => $row['link_path'] !== null ? (string) $row['link_path'] : null,
        ];
    }

    /**
     * @param array<string, mixed> $row
     * @param array<int, array<string, mixed>> $history
     */
    public static function request(array $row, array $history = [], array $attachments = [], ?array $client = null, ?array $assignee = null): array
    {
        $timeline = array_map([self::class, 'historyEntry'], $history);

        $comments = [];

        foreach ($history as $entry) {
            if (($entry['action_name'] ?? '') === 'Comentario') {
                $comments[] = self::comment($entry);
            }
        }

        $payload = [
            'id' => self::id($row['id'] ?? null),
            'number' => (string) ($row['consecutive'] ?? ''),
            'clientId' => self::id($row['client_id'] ?? null),
            'type' => (string) ($row['document_type'] ?? 'Manual'),
            'requestType' => (string) ($row['request_type'] ?? 'Documento nuevo'),
            'system' => (string) ($row['system_name'] ?? ''),
            'app' => (string) ($row['application_name'] ?? ''),
            'version' => (string) ($row['version_label'] ?? ''),
            'year' => (int) ($row['publication_year'] ?? 0),
            'title' => (string) ($row['title'] ?? ''),
            'description' => (string) ($row['description'] ?? ''),
            'reason' => (string) ($row['reason'] ?? ''),
            'priority' => (string) ($row['priority'] ?? 'Media'),
            'status' => (string) ($row['status'] ?? 'Recibida'),
            'assignedTo' => $row['assigned_to'] !== null ? self::id($row['assigned_to']) : null,
            'estimatedDate' => self::date($row['estimated_at'] ?? null),
            'createdAt' => self::dateTime($row['created_at'] ?? null),
            'updatedAt' => self::dateTime($row['updated_at'] ?? null),
            'history' => $timeline,
            'comments' => $comments,
            'attachments' => array_map([self::class, 'attachment'], $attachments),
            'notificationChannel' => (string) ($row['notification_channel'] ?? 'ambos'),
            'linkedDocumentId' => $row['related_document_id'] !== null ? self::id($row['related_document_id']) : null,
            'productionInstructions' => $row['production_instructions'] !== null ? (string) $row['production_instructions'] : '',
        ];

        if ($client !== null) {
            $payload['client'] = self::user($client);
        }

        if ($assignee !== null) {
            $payload['assignee'] = self::user($assignee);
        }

        return $payload;
    }

    /** @param array<string, mixed> $row */
    public static function attachment(array $row): array
    {
        return [
            'id' => self::id($row['id'] ?? null),
            'name' => (string) ($row['original_name'] ?? ''),
            'size' => self::fileSize((int) ($row['detected_size'] ?? 0)),
            'mime' => (string) ($row['detected_mime'] ?? ''),
            'date' => self::dateTime($row['created_at'] ?? null),
            'uploadedBy' => self::id($row['uploaded_by'] ?? null),
        ];
    }

    public static function id(mixed $value): string
    {
        return $value === null ? '' : (string) $value;
    }

    public static function date(mixed $value): string
    {
        if (!is_string($value) || $value === '') {
            return '';
        }

        return substr($value, 0, 10);
    }

    public static function dateTime(mixed $value): string
    {
        if (!is_string($value) || $value === '') {
            return '';
        }

        return str_replace(' ', 'T', $value);
    }

    public static function fileSize(int $bytes): string
    {
        if ($bytes <= 0) {
            return '—';
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        $index = 0;
        $size = (float) $bytes;

        while ($size >= 1024 && $index < count($units) - 1) {
            $size /= 1024;
            $index++;
        }

        return ($index === 0 ? (string) (int) $size : number_format($size, 1, '.', '')) . ' ' . $units[$index];
    }

    /** @return list<string> */
    private static function keywords(mixed $raw): array
    {
        if (!is_string($raw) || $raw === '') {
            return [];
        }

        $decoded = json_decode($raw, true);

        if (!is_array($decoded)) {
            return [];
        }

        return array_values(array_filter(array_map(
            static fn (mixed $item): string => is_scalar($item) ? (string) $item : '',
            $decoded,
        ), static fn (string $item): bool => $item !== ''));
    }

    private static function initials(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];
        $parts = array_values(array_filter($parts, static fn (string $part): bool => $part !== ''));

        if ($parts === []) {
            return '';
        }

        $first = mb_substr($parts[0], 0, 1);
        $second = count($parts) > 1 ? mb_substr($parts[count($parts) - 1], 0, 1) : '';

        return mb_strtoupper($first . $second);
    }

    private static function isRecent(string $date, int $days): bool
    {
        if ($date === '') {
            return false;
        }

        $timestamp = strtotime($date);

        return $timestamp !== false && $timestamp >= time() - ($days * 86400);
    }
}
