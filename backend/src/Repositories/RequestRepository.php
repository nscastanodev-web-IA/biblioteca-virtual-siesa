<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Connection;

final class RequestRepository
{
    /**
     * Búsqueda con filtros avanzados. El cliente siempre se limita a sus
     * propias solicitudes; el agente consulta todo según permisos.
     *
     * @param array<string, mixed> $filters
     * @return array{items: list<array<string, mixed>>, total: int, page: int, perPage: int, pages: int}
     */
    public function search(array $filters, ?int $clientId = null): array
    {
        $conditions = [];
        $parameters = [];

        if ($clientId !== null) {
            $conditions[] = 'r.client_id = :client_id';
            $parameters['client_id'] = $clientId;
        }

        $term = trim((string) ($filters['q'] ?? ''));

        if ($term !== '') {
            $conditions[] = '(r.consecutive LIKE :q_number OR r.title LIKE :q_title)';
            $parameters['q_number'] = '%' . $term . '%';
            $parameters['q_title'] = '%' . $term . '%';
        }

        $exactFilters = [
            'status' => 'r.status',
            'priority' => 'r.priority',
            'type' => 'r.document_type',
            'system' => 'r.system_name',
            'app' => 'r.application_name',
        ];

        foreach ($exactFilters as $key => $column) {
            $value = trim((string) ($filters[$key] ?? ''));

            if ($value !== '') {
                $conditions[] = $column . ' = :' . $key;
                $parameters[$key] = $value;
            }
        }

        if (trim((string) ($filters['assigned'] ?? '')) !== '') {
            $conditions[] = 'r.assigned_to = :assigned';
            $parameters['assigned'] = (int) $filters['assigned'];
        }

        if (trim((string) ($filters['client'] ?? '')) !== '') {
            $conditions[] = 'TRIM(CONCAT(c.first_name, \' \', c.last_name)) LIKE :client_name';
            $parameters['client_name'] = '%' . trim((string) $filters['client']) . '%';
        }

        if (trim((string) ($filters['company'] ?? '')) !== '') {
            $conditions[] = 'c.company LIKE :company';
            $parameters['company'] = '%' . trim((string) $filters['company']) . '%';
        }

        if (trim((string) ($filters['nit'] ?? '')) !== '') {
            $conditions[] = 'c.nit LIKE :nit';
            $parameters['nit'] = '%' . trim((string) $filters['nit']) . '%';
        }

        if (trim((string) ($filters['date_from'] ?? '')) !== '') {
            $conditions[] = 'r.created_at >= :date_from';
            $parameters['date_from'] = $filters['date_from'] . ' 00:00:00';
        }

        if (trim((string) ($filters['date_to'] ?? '')) !== '') {
            $conditions[] = 'r.created_at <= :date_to';
            $parameters['date_to'] = $filters['date_to'] . ' 23:59:59';
        }

        $where = $conditions === [] ? '' : ' WHERE ' . implode(' AND ', $conditions);

        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = min(100, max(1, (int) ($filters['per_page'] ?? 20)));
        $offset = ($page - 1) * $perPage;

        $countStatement = Connection::get()->prepare(
            'SELECT COUNT(*) FROM requests r INNER JOIN users c ON c.id = r.client_id' . $where,
        );
        $countStatement->execute($parameters);
        $total = (int) $countStatement->fetchColumn();

        $statement = Connection::get()->prepare(
            'SELECT r.* FROM requests r INNER JOIN users c ON c.id = r.client_id' . $where
            . ' ORDER BY FIELD(r.priority, \'Alta\', \'Media\', \'Baja\'), r.updated_at DESC'
            . ' LIMIT ' . $perPage . ' OFFSET ' . $offset,
        );
        $statement->execute($parameters);

        return [
            'items' => $statement->fetchAll(),
            'total' => $total,
            'page' => $page,
            'perPage' => $perPage,
            'pages' => $total === 0 ? 0 : (int) ceil($total / $perPage),
        ];
    }

    /** @return array<string, mixed>|null */
    public function findById(int $id): ?array
    {
        $statement = Connection::get()->prepare(
            'SELECT r.*, c.first_name AS client_first_name, c.last_name AS client_last_name,
                    c.email AS client_email, c.phone AS client_phone, c.company AS client_company,
                    c.nit AS client_nit, c.job_title AS client_job_title, c.system_name AS client_system,
                    c.role AS client_role, c.status AS client_status, c.theme_preference AS client_theme,
                    c.onboarding_completed AS client_onboarding, c.created_at AS client_created_at
             FROM requests r
             INNER JOIN users c ON c.id = r.client_id
             WHERE r.id = :id LIMIT 1',
        );
        $statement->execute(['id' => $id]);
        $row = $statement->fetch();

        return $row === false ? null : $row;
    }

    public function nextConsecutive(): string
    {
        $prefix = sprintf('SOL-%d-', (int) date('Y'));

        $statement = Connection::get()->prepare(
            'SELECT consecutive FROM requests WHERE consecutive LIKE :prefix ORDER BY consecutive DESC LIMIT 1',
        );
        $statement->execute(['prefix' => $prefix . '%']);
        $last = $statement->fetchColumn();

        $number = 1;

        if (is_string($last) && preg_match('/-(\d+)$/', $last, $matches) === 1) {
            $number = ((int) $matches[1]) + 1;
        }

        return sprintf('%s%04d', $prefix, $number);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data, string $consecutive): int
    {
        $connection = Connection::get();

        $connection->prepare(
            'INSERT INTO requests
               (consecutive, client_id, document_type, request_type, system_name, application_name, version_label,
                publication_year, title, description, reason, priority, notification_channel, status)
             VALUES
               (:consecutive, :client_id, :document_type, :request_type, :system_name, :application_name, :version_label,
                :publication_year, :title, :description, :reason, :priority, :notification_channel, \'Recibida\')',
        )->execute([
            'consecutive' => $consecutive,
            'client_id' => $data['clientId'],
            'document_type' => $data['type'],
            'request_type' => $data['requestType'],
            'system_name' => $data['system'],
            'application_name' => $data['app'],
            'version_label' => $data['version'] ?? null,
            'publication_year' => $data['year'],
            'title' => $data['title'],
            'description' => $data['description'],
            'reason' => $data['reason'],
            'priority' => $data['priority'],
            'notification_channel' => $data['notificationChannel'] ?? 'ambos',
        ]);

        return (int) $connection->lastInsertId();
    }

    public function addHistory(
        int $requestId,
        ?string $previousStatus,
        string $newStatus,
        string $action,
        ?string $comment,
        string $visibility,
        int $userId,
    ): int {
        $connection = Connection::get();

        $connection->prepare(
            'INSERT INTO request_history
               (request_id, previous_status, new_status, action_name, comment_text, visibility, responsible_user_id)
             VALUES (:request_id, :previous_status, :new_status, :action_name, :comment_text, :visibility, :user_id)',
        )->execute([
            'request_id' => $requestId,
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'action_name' => $action,
            'comment_text' => $comment,
            'visibility' => $visibility,
            'user_id' => $userId,
        ]);

        $historyId = (int) $connection->lastInsertId();

        // Cualquier movimiento del historial refresca la fecha de la solicitud,
        // de modo que el listado (ordenado por updated_at) quede consistente.
        $connection->prepare('UPDATE requests SET updated_at = NOW() WHERE id = :id')->execute(['id' => $requestId]);

        return $historyId;
    }

    /** @return list<array<string, mixed>> */
    public function history(int $requestId, bool $includeInternal = true): array
    {
        $sql = 'SELECT h.*, TRIM(CONCAT(u.first_name, \' \', u.last_name)) AS responsible_name, u.role AS responsible_role
                FROM request_history h
                INNER JOIN users u ON u.id = h.responsible_user_id
                WHERE h.request_id = :id';

        if (!$includeInternal) {
            $sql .= " AND h.visibility = 'cliente'";
        }

        $sql .= ' ORDER BY h.created_at, h.id';

        $statement = Connection::get()->prepare($sql);
        $statement->execute(['id' => $requestId]);

        return $statement->fetchAll();
    }

    /** @return list<array<string, mixed>> */
    public function attachments(int $requestId): array
    {
        $statement = Connection::get()->prepare(
            'SELECT * FROM request_attachments WHERE request_id = :id ORDER BY created_at',
        );
        $statement->execute(['id' => $requestId]);

        return $statement->fetchAll();
    }

    /** @param array<string, mixed> $data */
    public function addAttachment(int $requestId, array $data, int $userId): int
    {
        $connection = Connection::get();

        $connection->prepare(
            'INSERT INTO request_attachments (request_id, history_id, uploaded_by, stored_path, original_name, detected_mime, detected_size)
             VALUES (:request_id, :history_id, :uploaded_by, :stored_path, :original_name, :detected_mime, :detected_size)',
        )->execute([
            'request_id' => $requestId,
            'history_id' => $data['historyId'] ?? null,
            'uploaded_by' => $userId,
            'stored_path' => $data['storedPath'],
            'original_name' => $data['originalName'],
            'detected_mime' => $data['detectedMime'],
            'detected_size' => $data['detectedSize'],
        ]);

        return (int) $connection->lastInsertId();
    }

    /** @param array<string, mixed> $fields */
    public function update(int $id, array $fields): void
    {
        $allowed = [
            'assignedTo' => 'assigned_to',
            'estimatedDate' => 'estimated_at',
            'status' => 'status',
            'linkedDocumentId' => 'related_document_id',
            'productionInstructions' => 'production_instructions',
            'priority' => 'priority',
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

        Connection::get()->prepare('UPDATE requests SET ' . implode(', ', $assignments) . ' WHERE id = :id')
            ->execute($parameters);
    }

    /**
     * Indicadores del panel del agente (y resumen del cliente si se pasa clientId).
     *
     * @return array<string, float|int>
     */
    public function stats(?int $clientId = null): array
    {
        $where = $clientId === null ? '' : ' WHERE client_id = :client_id';
        $parameters = $clientId === null ? [] : ['client_id' => $clientId];

        $statement = Connection::get()->prepare(
            "SELECT
               COUNT(*) AS total,
               SUM(status IN ('Recibida','En validación','Información adicional requerida')) AS pendientes,
               SUM(status = 'En validación') AS en_validacion,
               SUM(status = 'Información adicional requerida') AS info_requerida,
               SUM(status = 'Aprobada') AS aprobadas,
               SUM(status = 'En producción') AS en_produccion,
               SUM(status IN ('Documento disponible','Cerrada')) AS finalizadas,
               SUM(status = 'Rechazada') AS rechazadas,
               SUM(priority = 'Alta') AS alta_prioridad,
               SUM(estimated_at IS NOT NULL AND estimated_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
                   AND status NOT IN ('Documento disponible','Cerrada','Rechazada')) AS proximas_a_vencer,
               SUM(estimated_at IS NOT NULL AND estimated_at < NOW()
                   AND status NOT IN ('Documento disponible','Cerrada','Rechazada')) AS vencidas,
               AVG(CASE WHEN status IN ('Documento disponible','Cerrada')
                        THEN TIMESTAMPDIFF(HOUR, created_at, updated_at) END) AS promedio_horas
             FROM requests" . $where,
        );
        $statement->execute($parameters);

        /** @var array<string, mixed> $row */
        $row = $statement->fetch() ?: [];

        $stats = [];

        foreach ($row as $key => $value) {
            if ($key === 'promedio_horas') {
                $stats['tiempoPromedioDias'] = $value === null ? 0.0 : round(((float) $value) / 24, 1);

                continue;
            }

            $stats[self::camel((string) $key)] = (int) $value;
        }

        return $stats;
    }

    private static function camel(string $value): string
    {
        return (string) preg_replace_callback(
            '/_([a-z])/',
            static fn (array $matches): string => strtoupper($matches[1]),
            $value,
        );
    }
}
