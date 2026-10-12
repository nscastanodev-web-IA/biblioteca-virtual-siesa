<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\HttpException;
use App\Repositories\DocumentRepository;
use App\Repositories\UserRepository;
use App\Support\Presenter;

final class DocumentService
{
    public function __construct(
        private DocumentRepository $documents = new DocumentRepository(),
        private UserRepository $users = new UserRepository(),
    ) {
    }

    /**
     * Listado con filtros combinables. El agente puede incluir borradores.
     *
     * @param array<string, mixed> $filters
     * @return array{items: list<array<string, mixed>>, meta: array<string, int>}
     */
    public function list(array $filters, bool $includeUnpublished = false): array
    {
        $result = $this->documents->search($filters, $includeUnpublished);

        $items = array_map(
            fn (array $row): array => Presenter::document($row, $this->documentRelatedIds($row)),
            $result['items'],
        );

        return [
            'items' => $items,
            'meta' => [
                'total' => $result['total'],
                'page' => $result['page'],
                'perPage' => $result['perPage'],
                'pages' => $result['pages'],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function detail(int $id, bool $includeUnpublished = false): array
    {
        $row = $this->documents->findById($id);

        if ($row === null) {
            throw HttpException::notFound('El documento solicitado no existe.');
        }

        if (($row['status'] ?? '') !== 'publicado' && !$includeUnpublished) {
            throw HttpException::notFound('El documento solicitado no existe.');
        }

        $this->documents->incrementViews($id);

        $related = array_map(
            static fn (array $item): array => Presenter::document($item),
            $this->documents->relatedDocuments($id, !$includeUnpublished),
        );

        $creator = $this->users->findById((int) $row['created_by']);

        return [
            'document' => Presenter::document($row, $this->documents->relatedIds($id)),
            'related' => $related,
            'versions' => $this->documents->versions($id),
            'createdBy' => $creator === null ? null : Presenter::user($creator),
        ];
    }

    /**
     * Registra la descarga y devuelve el contenido del PDF.
     * La respuesta binaria nunca expone la ruta real del archivo.
     *
     * @return array{content: string, filename: string, mime: string}
     */
    public function download(int $id, int $userId, string $ip, bool $includeUnpublished = false): array
    {
        $row = $this->documents->findById($id);

        if ($row === null || (($row['status'] ?? '') !== 'publicado' && !$includeUnpublished)) {
            throw HttpException::notFound('El documento solicitado no existe.');
        }

        $file = StorageService::locate((string) $row['pdf_path']);

        if ($file === null) {
            throw HttpException::notFound('El archivo del documento no está disponible en el servidor.');
        }

        $this->documents->registerDownload($id, $userId, $ip);

        return [
            'content' => (string) file_get_contents($file['absolutePath']),
            'filename' => (string) ($row['original_name'] !== '' ? $row['original_name'] : 'documento.pdf'),
            'mime' => 'application/pdf',
        ];
    }

    /** @param array<string, mixed> $data */
    public function create(array $data, array $file, int $agentId): array
    {
        $stored = StorageService::storePdf($file);

        $documentId = $this->documents->create([
            'title' => $data['title'],
            'description' => $data['description'],
            'type' => $data['type'],
            'system' => $data['system'],
            'app' => $data['app'],
            'version' => $data['version'] ?? null,
            'year' => (int) $data['year'],
            'keywords' => $data['keywords'] ?? [],
            'status' => ($data['publish'] ?? false) ? 'publicado' : 'borrador',
            'pdfPath' => $stored['pdfPath'],
            'originalName' => $stored['originalName'],
            'detectedMime' => $stored['detectedMime'],
            'detectedSize' => $stored['detectedSize'],
        ], $agentId);

        return $this->detail($documentId, true);
    }

    /** @param array<string, mixed> $data */
    public function replaceVersion(int $id, array $data, array $file, int $agentId): array
    {
        $row = $this->documents->findById($id);

        if ($row === null) {
            throw HttpException::notFound('El documento solicitado no existe.');
        }

        $stored = StorageService::storePdf($file);

        $this->documents->addVersion($id, [
            'pdfPath' => $stored['pdfPath'],
            'originalName' => $stored['originalName'],
            'detectedSize' => $stored['detectedSize'],
        ], $agentId);

        if ($data !== []) {
            $this->documents->update($id, $data);
        }

        return $this->detail($id, true);
    }

    /** @param array<string, mixed> $data */
    public function updateMetadata(int $id, array $data): array
    {
        if ($this->documents->findById($id) === null) {
            throw HttpException::notFound('El documento solicitado no existe.');
        }

        $this->documents->update($id, $data);

        return $this->detail($id, true);
    }

    public function changeStatus(int $id, string $status): array
    {
        if (!in_array($status, ['borrador', 'publicado', 'inactivo'], true)) {
            throw HttpException::unprocessable('El estado del documento no es válido.');
        }

        $row = $this->documents->findById($id);

        if ($row === null) {
            throw HttpException::notFound('El documento solicitado no existe.');
        }

        $this->documents->updateStatus($id, $status);

        return $this->detail($id, true);
    }

    public function saveFeedback(int $id, int $userId, bool $helpful): void
    {
        $row = $this->documents->findById($id);

        if ($row === null || ($row['status'] ?? '') !== 'publicado') {
            throw HttpException::notFound('El documento solicitado no existe.');
        }

        $this->documents->saveFeedback($id, $userId, $helpful);
    }

    /** @return array<string, int> */
    public function stats(): array
    {
        return $this->documents->stats();
    }

    /**
     * Catálogo para poblar los filtros de la biblioteca.
     *
     * @return array<string, list<string>>
     */
    public function filters(): array
    {
        return [
            'types' => $this->documents->distinctValues('type'),
            'systems' => $this->documents->distinctValues('system_name'),
            'apps' => $this->documents->distinctValues('application_name'),
            'versions' => $this->documents->distinctValues('version_label'),
            'years' => $this->documents->distinctValues('publication_year'),
        ];
    }

    /** @param array<string, mixed> $row */
    private function documentRelatedIds(array $row): array
    {
        return $this->documents->relatedIds((int) $row['id']);
    }
}
