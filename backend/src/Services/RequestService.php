<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\HttpException;
use App\Repositories\NotificationRepository;
use App\Repositories\RequestRepository;
use App\Repositories\UserRepository;
use App\Support\Presenter;

/**
 * Reglas de negocio de las solicitudes documentales.
 * Concentra el consecutivo, el historial, las notificaciones y las
 * restricciones por rol, de modo que los controladores queden delgados.
 */
final class RequestService
{
    public function __construct(
        private RequestRepository $requests = new RequestRepository(),
        private UserRepository $users = new UserRepository(),
        private NotificationRepository $notifications = new NotificationRepository(),
    ) {
    }

    /**
     * @param array<string, mixed> $filters
     * @param array<string, mixed> $user
     * @return array{items: list<array<string, mixed>>, meta: array<string, int>}
     */
    public function list(array $filters, array $user): array
    {
        $clientId = ($user['role'] ?? '') === 'cliente' ? (int) $user['id'] : null;
        $result = $this->requests->search($filters, $clientId);

        $items = array_map(
            fn (array $row): array => $this->hydrate($row, $user),
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
     * @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    public function detail(int $id, array $user): array
    {
        $row = $this->requireVisible($id, $user);

        return $this->hydrate($row, $user);
    }

    /**
     * Crea la solicitud, genera el consecutivo y deja la primera entrada del
     * historial de forma atómica con las notificaciones al equipo interno.
     *
     * @param array<string, mixed> $data
     * @param array<string, mixed> $files
     * @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    public function create(array $data, array $files, array $user): array
    {
        $consecutive = $this->requests->nextConsecutive();

        $requestId = $this->requests->create([
            'clientId' => (int) $user['id'],
            'type' => $data['type'],
            'requestType' => $data['requestType'],
            'system' => $data['system'],
            'app' => $data['app'],
            'version' => $data['version'] ?? null,
            'year' => (int) $data['year'],
            'title' => $data['title'],
            'description' => $data['description'],
            'reason' => $data['reason'],
            'priority' => $data['priority'],
            'notificationChannel' => $data['notificationChannel'] ?? 'ambos',
        ], $consecutive);

        $historyId = $this->requests->addHistory(
            $requestId,
            null,
            RequestStatusService::RECIBIDA,
            'Solicitud registrada',
            'Solicitud enviada por el cliente.',
            'cliente',
            (int) $user['id'],
        );

        $this->storeAttachments($requestId, $historyId, $files, (int) $user['id']);

        $clientName = trim((string) $user['first_name'] . ' ' . (string) $user['last_name']);

        $this->notifications->notifyAgents(
            'solicitud',
            'Nueva solicitud recibida: ' . $consecutive,
            sprintf('%s ha enviado una nueva solicitud.', $clientName !== '' ? $clientName : 'Un cliente'),
            '/agent/requests/' . $requestId,
        );

        $this->notifications->create(
            (int) $user['id'],
            'solicitud',
            'Solicitud ' . $consecutive . ' registrada',
            'Tu solicitud ha sido registrada exitosamente. Te notificaremos sobre su avance.',
            '/client/requests/' . $requestId,
        );

        return $this->detail($requestId, $user);
    }

    /**
     * @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    public function addComment(int $id, array $user, string $text, bool $internal): array
    {
        $row = $this->requireVisible($id, $user);

        $isAgent = ($user['role'] ?? '') === 'agente';

        // Un cliente nunca puede publicar notas internas.
        $internal = $internal && $isAgent;
        $visibility = $internal ? 'interno' : 'cliente';

        $this->requests->addHistory(
            $id,
            (string) $row['status'],
            (string) $row['status'],
            'Comentario',
            $text,
            $visibility,
            (int) $user['id'],
        );

        $this->notifyComment($row, $user, $text, $internal);

        return $this->detail($id, $user);
    }

    /**
     * Cambio de estado validado contra el mapa de transiciones.
     *
     * @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    public function transition(int $id, array $user, string $status, ?string $comment, bool $internal = false): array
    {
        $row = $this->requireVisible($id, $user);
        $current = (string) $row['status'];

        RequestStatusService::assertTransition($current, $status);

        $action = RequestStatusService::ACTION_BY_STATUS[$status] ?? 'Cambio de estado';

        $this->requests->update($id, ['status' => $status]);
        $this->requests->addHistory(
            $id,
            $current,
            $status,
            $action,
            $comment,
            $internal ? 'interno' : 'cliente',
            (int) $user['id'],
        );

        if (!$internal) {
            $this->notifications->create(
                (int) $row['client_id'],
                'estado',
                sprintf('Solicitud %s: %s', (string) $row['consecutive'], $status),
                trim(sprintf('Tu solicitud cambió a "%s". %s', $status, (string) $comment)),
                '/client/requests/' . $id,
            );
        }

        return $this->detail($id, $user);
    }

    /**
     * Asigna responsable y fecha estimada. La nota de asignación es interna.
     *
     * @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    public function assign(int $id, array $user, int $assigneeId, ?string $estimatedDate): array
    {
        $row = $this->requireVisible($id, $user);

        $assignee = $this->users->findById($assigneeId);

        if ($assignee === null || ($assignee['role'] ?? '') !== 'agente' || ($assignee['status'] ?? '') !== 'activo') {
            throw HttpException::unprocessable(
                'El responsable seleccionado no es válido.',
                ['assignedTo' => ['Selecciona un agente activo.']],
            );
        }

        $this->requests->update($id, [
            'assignedTo' => $assigneeId,
            'estimatedDate' => $estimatedDate,
        ]);

        $assigneeName = trim((string) $assignee['first_name'] . ' ' . (string) $assignee['last_name']);

        $this->requests->addHistory(
            $id,
            (string) $row['status'],
            (string) $row['status'],
            'Asignación',
            'Asignada a ' . ($assigneeName !== '' ? $assigneeName : 'un agente') . '.',
            'interno',
            (int) $user['id'],
        );

        if ($assigneeId !== (int) $user['id']) {
            $this->notifications->create(
                $assigneeId,
                'solicitud',
                'Solicitud asignada: ' . (string) $row['consecutive'],
                sprintf('Se te asignó la solicitud "%s".', (string) $row['title']),
                '/agent/requests/' . $id,
            );
        }

        return $this->detail($id, $user);
    }

    /**
     * Envío a producción: exige responsable, fecha e instrucciones.
     *
     * @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    public function sendToProduction(int $id, array $user, int $assigneeId, string $estimatedDate, string $instructions, ?string $comment): array
    {
        $row = $this->requireVisible($id, $user);

        RequestStatusService::assertTransition((string) $row['status'], RequestStatusService::EN_PRODUCCION);

        $assignee = $this->users->findById($assigneeId);

        if ($assignee === null || ($assignee['role'] ?? '') !== 'agente') {
            throw HttpException::unprocessable(
                'El responsable de producción no es válido.',
                ['assignedTo' => ['Selecciona un agente activo.']],
            );
        }

        $this->requests->update($id, [
            'status' => RequestStatusService::EN_PRODUCCION,
            'assignedTo' => $assigneeId,
            'estimatedDate' => $estimatedDate,
            'productionInstructions' => $instructions,
        ]);

        $this->requests->addHistory(
            $id,
            (string) $row['status'],
            RequestStatusService::EN_PRODUCCION,
            'Envío a producción',
            $comment !== null && $comment !== '' ? $comment : 'Solicitud aprobada y enviada a producción.',
            'cliente',
            (int) $user['id'],
        );

        $this->notifications->create(
            (int) $row['client_id'],
            'estado',
            'Solicitud ' . (string) $row['consecutive'] . ' en producción',
            sprintf('Tu solicitud está en producción. Fecha estimada: %s.', $estimatedDate),
            '/client/requests/' . $id,
        );

        $this->notifications->create(
            $assigneeId,
            'solicitud',
            'Producción asignada: ' . (string) $row['consecutive'],
            sprintf('Debes construir: %s.', (string) $row['title']),
            '/agent/requests/' . $id,
        );

        return $this->detail($id, $user);
    }

    /**
     * Vincula un documento existente como resultado de la solicitud.
     *
     * @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    public function linkDocument(int $id, array $user, int $documentId, ?string $comment): array
    {
        $row = $this->requireVisible($id, $user);

        $this->requests->update($id, ['linkedDocumentId' => $documentId]);

        $this->requests->addHistory(
            $id,
            (string) $row['status'],
            (string) $row['status'],
            'Vinculación de documento',
            $comment !== null && $comment !== '' ? $comment : 'Se vinculó un documento a la solicitud.',
            'cliente',
            (int) $user['id'],
        );

        $this->notifications->create(
            (int) $row['client_id'],
            'documento',
            'Documento vinculado a ' . (string) $row['consecutive'],
            'Ya puedes consultar el documento asociado a tu solicitud en la biblioteca.',
            '/client/requests/' . $id,
        );

        return $this->detail($id, $user);
    }

    /**
     * Publicar el documento resultante: vincula y pasa a "Documento disponible".
     *
     * @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    public function publishDocument(int $id, array $user, int $documentId, ?string $comment): array
    {
        $row = $this->requireVisible($id, $user);

        RequestStatusService::assertTransition((string) $row['status'], RequestStatusService::DOCUMENTO_DISPONIBLE);

        $this->requests->update($id, [
            'status' => RequestStatusService::DOCUMENTO_DISPONIBLE,
            'linkedDocumentId' => $documentId,
        ]);

        $this->requests->addHistory(
            $id,
            (string) $row['status'],
            RequestStatusService::DOCUMENTO_DISPONIBLE,
            'Publicación de documento',
            $comment !== null && $comment !== '' ? $comment : 'El documento quedó publicado y vinculado a la solicitud.',
            'cliente',
            (int) $user['id'],
        );

        $this->notifications->create(
            (int) $row['client_id'],
            'documento',
            'Documento disponible para ' . (string) $row['consecutive'],
            'El documento solicitado ya está disponible en la biblioteca.',
            '/client/requests/' . $id,
        );

        return $this->detail($id, $user);
    }

    /**
     * Cancelación por parte del cliente propietario, permitida solo en estados
     * donde el equipo interno aún no ha iniciado producción.
     *
     * @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    public function cancelByClient(int $id, array $user): array
    {
        $row = $this->requireVisible($id, $user);

        if (($user['role'] ?? '') === 'agente') {
            throw HttpException::forbidden('Usa la gestión de estado para cerrar la solicitud.');
        }

        if (!RequestStatusService::canClientCancel((string) $row['status'])) {
            throw HttpException::unprocessable('La solicitud ya no puede cancelarse en su estado actual.');
        }

        $this->requests->update($id, ['status' => RequestStatusService::CERRADA]);
        $this->requests->addHistory(
            $id,
            (string) $row['status'],
            RequestStatusService::CERRADA,
            'Cancelación del cliente',
            'Solicitud cancelada por el cliente.',
            'cliente',
            (int) $user['id'],
        );

        $clientName = trim((string) $user['first_name'] . ' ' . (string) $user['last_name']);

        $this->notifications->notifyAgents(
            'estado',
            'Solicitud cancelada: ' . (string) $row['consecutive'],
            sprintf('%s canceló su solicitud.', $clientName !== '' ? $clientName : 'El cliente'),
            '/agent/requests/' . $id,
        );

        return $this->detail($id, $user);
    }

    /**
     * @param array<string, mixed> $user
     * @return array<string, int|float>
     */
    public function stats(array $user): array
    {
        $clientId = ($user['role'] ?? '') === 'cliente' ? (int) $user['id'] : null;

        return $this->requests->stats($clientId);
    }

    /** @return list<array<string, mixed>> */
    public function agents(): array
    {
        return array_map(
            static fn (array $row): array => Presenter::user($row),
            $this->users->listAgents(),
        );
    }

    /**
     * @param array<string, mixed> $row
     * @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    private function hydrate(array $row, array $user): array
    {
        $isAgent = ($user['role'] ?? '') === 'agente';
        $id = (int) $row['id'];

        $history = $this->requests->history($id, $isAgent);
        $attachments = $this->requests->attachments($id);

        $client = $this->clientFromRow($row);
        $assignee = null;

        if (($row['assigned_to'] ?? null) !== null) {
            $assigneeRow = $this->users->findById((int) $row['assigned_to']);
            $assignee = $assigneeRow === null ? null : $assigneeRow;
        }

        return Presenter::request($row, $history, $attachments, $client, $assignee);
    }

    /**
     * El detalle de una solicitud solo es visible para su dueño o el equipo interno.
     *
     * @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    private function requireVisible(int $id, array $user): array
    {
        $row = $this->requests->findById($id);

        if ($row === null) {
            throw HttpException::notFound('La solicitud indicada no existe.');
        }

        if (($user['role'] ?? '') !== 'agente' && (int) $row['client_id'] !== (int) $user['id']) {
            throw HttpException::notFound('La solicitud indicada no existe.');
        }

        return $row;
    }

    /**
     * @param array<string, mixed> $row
     * @param array<string, mixed> $user
     */
    private function notifyComment(array $row, array $user, string $text, bool $internal): void
    {
        if ($internal) {
            return;
        }

        $excerpt = mb_strlen($text) > 80 ? mb_substr($text, 0, 80) . '…' : $text;

        if (($user['role'] ?? '') === 'agente') {
            $this->notifications->create(
                (int) $row['client_id'],
                'estado',
                'Nuevo mensaje en ' . (string) $row['consecutive'],
                $excerpt,
                '/client/requests/' . (int) $row['id'],
            );

            return;
        }

        $clientName = trim((string) $user['first_name'] . ' ' . (string) $user['last_name']);

        $this->notifications->notifyAgents(
            'solicitud',
            'Nuevo mensaje del cliente en ' . (string) $row['consecutive'],
            sprintf('%s escribió: %s', $clientName !== '' ? $clientName : 'El cliente', $excerpt),
            '/agent/requests/' . (int) $row['id'],
        );
    }

    /**
     * Reconstruye la fila del cliente a partir del JOIN de findById.
     *
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function clientFromRow(array $row): array
    {
        return [
            'id' => $row['client_id'] ?? null,
            'first_name' => $row['client_first_name'] ?? '',
            'last_name' => $row['client_last_name'] ?? '',
            'email' => $row['client_email'] ?? '',
            'phone' => $row['client_phone'] ?? '',
            'company' => $row['client_company'] ?? '',
            'nit' => $row['client_nit'] ?? '',
            'job_title' => $row['client_job_title'] ?? '',
            'system_name' => $row['client_system'] ?? '',
            'role' => $row['client_role'] ?? 'cliente',
            'status' => $row['client_status'] ?? 'activo',
            'theme_preference' => $row['client_theme'] ?? 'system',
            'onboarding_completed' => $row['client_onboarding'] ?? false,
            'created_at' => $row['client_created_at'] ?? null,
        ];
    }

    /**
     * Normaliza $_FILES (incluidos arrays tipo attachments[]) y los guarda.
     *
     * @param array<string, mixed> $files
     */
    private function storeAttachments(int $requestId, ?int $historyId, array $files, int $userId): void
    {
        foreach ($this->flattenFiles($files) as $file) {
            if ((int) ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
                continue;
            }

            $stored = StorageService::storeAttachment($file);

            $this->requests->addAttachment($requestId, [
                'historyId' => $historyId,
                'storedPath' => $stored['storedPath'],
                'originalName' => $stored['originalName'],
                'detectedMime' => $stored['detectedMime'],
                'detectedSize' => $stored['detectedSize'],
            ], $userId);
        }
    }

    /**
     * @param array<string, mixed> $files
     * @return list<array<string, mixed>>
     */
    private function flattenFiles(array $files): array
    {
        $flat = [];

        foreach ($files as $entry) {
            if (!is_array($entry)) {
                continue;
            }

            if (isset($entry['tmp_name']) && is_string($entry['tmp_name'])) {
                $flat[] = $entry;

                continue;
            }

            foreach ($entry as $nested) {
                if (is_array($nested) && isset($nested['tmp_name'])) {
                    $flat[] = $nested;
                }
            }
        }

        return $flat;
    }
}
