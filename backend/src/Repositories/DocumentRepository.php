<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Connection;

final class DocumentRepository
{
    /**
     * Búsqueda combinable por texto, tipo, sistema, aplicativo, versión, año,
     * rango de publicación y etiqueta (nuevo / actualizado).
     *
     * @param array<string, mixed> $filters
     * @return array{items: list<array<string, mixed>>, total: int, page: int, perPage: int, pages: int}
     */
    public function search(array $filters, bool $includeUnpublished = false): array
    {
        $conditions = [];
        $parameters = [];

        if (!$includeUnpublished) {
            $conditions[] = "d.status = 'publicado'";
        } elseif (trim((string) ($filters['status'] ?? '')) !== '') {
            $conditions[] = 'd.status = :status';
            $parameters['status'] = (string) $filters['status'];
        }

        $term = trim((string) ($filters['q'] ?? ''));

        if ($term !== '') {
            $conditions[] = '(d.title LIKE :q_title OR d.description LIKE :q_description'
                . ' OR d.system_name LIKE :q_system OR d.application_name LIKE :q_app'
                . ' OR CAST(d.keywords AS CHAR) LIKE :q_keywords)';

            $like = '%' . $term . '%';
            $parameters['q_title'] = $like;
            $parameters['q_description'] = $like;
            $parameters['q_system'] = $like;
            $parameters['q_app'] = $like;
            $parameters['q_keywords'] = $like;
        }

        $exactFilters = [
            'type' => 'd.type',
            'system' => 'd.system_name',
            'app' => 'd.application_name',
            'version' => 'd.version_label',
        ];

        foreach ($exactFilters as $key => $column) {
            $value = trim((string) ($filters[$key] ?? ''));

            if ($value !== '') {
                $conditions[] = $column . ' = :' . $key;
                $parameters[$key] = $value;
            }
        }

        if (trim((string) ($filters['year'] ?? '')) !== '') {
            $conditions[] = 'd.publication_year = :year';
            $parameters['year'] = (int) $filters['year'];
        }

        if (trim((string) ($filters['published_from'] ?? '')) !== '') {
            $conditions[] = 'd.published_at >= :published_from';
            $parameters['published_from'] = $filters['published_from'] . ' 00:00:00';
        }

        if (trim((string) ($filters['published_to'] ?? '')) !== '') {
            $conditions[] = 'd.published_at <= :published_to';
            $parameters['published_to'] = $filters['published_to'] . ' 23:59:59';
        }

        $flag = trim((string) ($filters['flag'] ?? ''));

        if ($flag === 'nuevo') {
            $conditions[] = 'd.published_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        } elseif ($flag === 'actualizado') {
            $conditions[] = 'd.updated_at > DATE_ADD(d.published_at, INTERVAL 1 DAY)';
        }

        $where = $conditions === [] ? '' : ' WHERE ' . implode(' AND ', $conditions);

        $orderBy = match (trim((string) ($filters['sort'] ?? 'fecha'))) {
            'antiguos' => 'd.published_at ASC',
            'relevancia' => 'd.downloads_count DESC, d.views_count DESC',
            'titulo' => 'd.title ASC',
            default => 'd.published_at DESC',
        };

        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = min(50, max(1, (int) ($filters['per_page'] ?? 12)));
        $offset = ($page - 1) * $perPage;

        $countStatement = Connection::get()->prepare('SELECT COUNT(*) FROM documents d' . $where);
        $countStatement->execute($parameters);
        $total = (int) $countStatement->fetchColumn();

        $statement = Connection::get()->prepare(
            'SELECT d.* FROM documents d' . $where . ' ORDER BY ' . $orderBy . ' LIMIT ' . $perPage . ' OFFSET ' . $offset,
        );
        $statement->execute($parameters);
        /** @var list<array<string, mixed>> $items */
        $items = $statement->fetchAll();

        return [
            'items' => $items,
            'total' => $total,
            'page' => $page,
            'perPage' => $perPage,
            'pages' => $total === 0 ? 0 : (int) ceil($total / $perPage),
        ];
    }

    /** @return array<string, mixed>|null */
    public function findById(int $id): ?array
    {
        $statement = Connection::get()->prepare('SELECT * FROM documents WHERE id = :id LIMIT 1');
        $statement->execute(['id' => $id]);
        $row = $statement->fetch();

        return $row === false ? null : $row;
    }

    /** @return list<int> */
    public function relatedIds(int $documentId): array
    {
        $statement = Connection::get()->prepare(
            'SELECT related_id FROM document_related WHERE document_id = :id ORDER BY related_id',
        );
        $statement->execute(['id' => $documentId]);

        return array_map(static fn (mixed $value): int => (int) $value, $statement->fetchAll(\PDO::FETCH_COLUMN));
    }

    /** @return list<array<string, mixed>> */
    public function relatedDocuments(int $documentId, bool $onlyPublished = true): array
    {
        $sql = 'SELECT d.* FROM document_related r
                INNER JOIN documents d ON d.id = r.related_id
                WHERE r.document_id = :id';

        if ($onlyPublished) {
            $sql .= " AND d.status = 'publicado'";
        }

        $sql .= ' ORDER BY d.published_at DESC LIMIT 6';

        $statement = Connection::get()->prepare($sql);
        $statement->execute(['id' => $documentId]);

        return $statement->fetchAll();
    }

    /** @return list<string> */
    public function distinctValues(string $column): array
    {
        $allowed = ['type', 'system_name', 'application_name', 'version_label', 'publication_year'];

        if (!in_array($column, $allowed, true)) {
            return [];
        }

        $statement = Connection::get()->query(
            "SELECT DISTINCT {$column} AS value FROM documents
             WHERE status = 'publicado' AND {$column} IS NOT NULL AND {$column} <> ''
             ORDER BY value",
        );

        return array_map(static fn (mixed $value): string => (string) $value, $statement->fetchAll(\PDO::FETCH_COLUMN));
    }

    public function incrementViews(int $id): void
    {
        Connection::get()->prepare('UPDATE documents SET views_count = views_count + 1 WHERE id = :id')->execute(['id' => $id]);
    }

    public function registerDownload(int $id, int $userId, string $ip): void
    {
        $connection = Connection::get();

        $connection->prepare('UPDATE documents SET downloads_count = downloads_count + 1 WHERE id = :id')->execute(['id' => $id]);
        $connection->prepare('INSERT INTO document_downloads (document_id, user_id, ip_address) VALUES (:id, :user_id, :ip)')
            ->execute(['id' => $id, 'user_id' => $userId, 'ip' => $ip]);
    }

    /** @return list<array<string, mixed>> */
    public function versions(int $documentId): array
    {
        $statement = Connection::get()->prepare(
            'SELECT v.*, TRIM(CONCAT(u.first_name, \' \', u.last_name)) AS responsible_name
             FROM document_versions v
             INNER JOIN users u ON u.id = v.responsible_user_id
             WHERE v.document_id = :id
             ORDER BY v.version_number DESC',
        );
        $statement->execute(['id' => $documentId]);

        return $statement->fetchAll();
    }

    public function saveFeedback(int $documentId, int $userId, bool $helpful): void
    {
        Connection::get()->prepare(
            'INSERT INTO document_feedback (document_id, user_id, helpful) VALUES (:document_id, :user_id, :helpful)
             ON DUPLICATE KEY UPDATE helpful = VALUES(helpful), created_at = NOW()',
        )->execute(['document_id' => $documentId, 'user_id' => $userId, 'helpful' => $helpful ? 1 : 0]);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data, int $userId): int
    {
        $connection = Connection::get();

        $connection->prepare(
            'INSERT INTO documents
               (title, description, type, system_name, application_name, version_label, publication_year, keywords,
                pdf_path, original_name, detected_mime, detected_size, current_version, status, published_at, created_by)
             VALUES
               (:title, :description, :type, :system_name, :application_name, :version_label, :publication_year, :keywords,
                :pdf_path, :original_name, :detected_mime, :detected_size, 1, :status, :published_at, :created_by)',
        )->execute([
            'title' => $data['title'],
            'description' => $data['description'],
            'type' => $data['type'],
            'system_name' => $data['system'],
            'application_name' => $data['app'],
            'version_label' => $data['version'] ?? null,
            'publication_year' => $data['year'],
            'keywords' => json_encode($data['keywords'] ?? [], JSON_UNESCAPED_UNICODE),
            'pdf_path' => $data['pdfPath'],
            'original_name' => $data['originalName'],
            'detected_mime' => $data['detectedMime'],
            'detected_size' => $data['detectedSize'],
            'status' => $data['status'] ?? 'borrador',
            'published_at' => ($data['status'] ?? 'borrador') === 'publicado' ? date('Y-m-d H:i:s') : null,
            'created_by' => $userId,
        ]);

        $documentId = (int) $connection->lastInsertId();

        $connection->prepare(
            'INSERT INTO document_versions (document_id, version_number, pdf_path, original_name, detected_size, responsible_user_id)
             VALUES (:document_id, 1, :pdf_path, :original_name, :detected_size, :user_id)',
        )->execute([
            'document_id' => $documentId,
            'pdf_path' => $data['pdfPath'],
            'original_name' => $data['originalName'],
            'detected_size' => $data['detectedSize'],
            'user_id' => $userId,
        ]);

        return $documentId;
    }

    /** @param array<string, mixed> $fields */
    public function update(int $id, array $fields): void
    {
        $allowed = [
            'title' => 'title',
            'description' => 'description',
            'type' => 'type',
            'system' => 'system_name',
            'app' => 'application_name',
            'version' => 'version_label',
            'year' => 'publication_year',
        ];

        $assignments = [];
        $parameters = ['id' => $id];

        foreach ($allowed as $key => $column) {
            if (array_key_exists($key, $fields)) {
                $assignments[] = $column . ' = :' . $key;
                $parameters[$key] = $fields[$key];
            }
        }

        if (array_key_exists('keywords', $fields)) {
            $assignments[] = 'keywords = :keywords';
            $parameters['keywords'] = json_encode($fields['keywords'], JSON_UNESCAPED_UNICODE);
        }

        if ($assignments === []) {
            return;
        }

        Connection::get()->prepare('UPDATE documents SET ' . implode(', ', $assignments) . ' WHERE id = :id')
            ->execute($parameters);
    }

    /** @param array<string, mixed> $data */
    public function addVersion(int $documentId, array $data, int $userId): int
    {
        $connection = Connection::get();

        $statement = $connection->prepare('SELECT COALESCE(MAX(version_number), 0) + 1 FROM document_versions WHERE document_id = :id');
        $statement->execute(['id' => $documentId]);
        $nextVersion = (int) $statement->fetchColumn();

        $connection->prepare(
            'INSERT INTO document_versions (document_id, version_number, pdf_path, original_name, detected_size, responsible_user_id)
             VALUES (:document_id, :version_number, :pdf_path, :original_name, :detected_size, :user_id)',
        )->execute([
            'document_id' => $documentId,
            'version_number' => $nextVersion,
            'pdf_path' => $data['pdfPath'],
            'original_name' => $data['originalName'],
            'detected_size' => $data['detectedSize'],
            'user_id' => $userId,
        ]);

        $connection->prepare(
            'UPDATE documents SET pdf_path = :pdf_path, original_name = :original_name, detected_size = :detected_size, current_version = :version WHERE id = :id',
        )->execute([
            'pdf_path' => $data['pdfPath'],
            'original_name' => $data['originalName'],
            'detected_size' => $data['detectedSize'],
            'version' => $nextVersion,
            'id' => $documentId,
        ]);

        return $nextVersion;
    }

    public function updateStatus(int $id, string $status): void
    {
        $publishedAt = $status === 'publicado' ? date('Y-m-d H:i:s') : null;

        Connection::get()->prepare(
            'UPDATE documents SET status = :status, published_at = COALESCE(:published_at, published_at) WHERE id = :id',
        )->execute(['status' => $status, 'published_at' => $publishedAt, 'id' => $id]);
    }

    /** @return array<string, int> */
    public function stats(): array
    {
        $statement = Connection::get()->query(
            "SELECT
               COUNT(*) AS total,
               SUM(status = 'publicado') AS publicados,
               SUM(status = 'borrador') AS borradores,
               SUM(status = 'inactivo') AS inactivos,
               COALESCE(SUM(views_count), 0) AS vistas,
               COALESCE(SUM(downloads_count), 0) AS descargas
             FROM documents",
        );

        /** @var array<string, mixed> $row */
        $row = $statement->fetch() ?: [];

        return array_map(static fn (mixed $value): int => (int) $value, $row);
    }
}
