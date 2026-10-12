<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\HttpException;
use App\Http\Request;
use App\Http\Response;
use App\Middleware\AuthMiddleware;
use App\Services\DocumentService;
use App\Validation\Validator;

final class DocumentController
{
    public function __construct(private DocumentService $documents = new DocumentService())
    {
    }

    public function index(Request $request): Response
    {
        $user = AuthMiddleware::requireUser();
        $isAgent = $user['role'] === 'agente';

        $filters = [
            'q' => $request->queryParam('q', ''),
            'type' => $request->queryParam('type', ''),
            'system' => $request->queryParam('system', ''),
            'app' => $request->queryParam('app', ''),
            'version' => $request->queryParam('version', ''),
            'year' => $request->queryParam('year', ''),
            'published_from' => $request->queryParam('published_from', ''),
            'published_to' => $request->queryParam('published_to', ''),
            'flag' => $request->queryParam('flag', ''),
            'sort' => $request->queryParam('sort', 'fecha'),
            'status' => $request->queryParam('status', ''),
            'page' => $request->queryParam('page', '1'),
            'per_page' => $request->queryParam('per_page', '12'),
        ];

        // Solo el equipo interno ve borradores o inactivos.
        $includeUnpublished = $isAgent && ($request->queryParam('include_unpublished', '0') === '1' || $filters['status'] !== '');

        $result = $this->documents->list($filters, $includeUnpublished);

        return Response::json($result['items'], $result['meta']);
    }

    public function filters(): Response
    {
        AuthMiddleware::requireUser();

        return Response::json($this->documents->filters());
    }

    public function show(Request $request, array $args): Response
    {
        $user = AuthMiddleware::requireUser();

        $detail = $this->documents->detail(
            $this->idFromArgs($args),
            $user['role'] === 'agente',
        );

        return Response::json($detail);
    }

    public function preview(Request $request, array $args): Response
    {
        $user = AuthMiddleware::requireUser();
        $id = $this->idFromArgs($args);

        $file = $this->documents->download($id, (int) $user['id'], $request->ip, $user['role'] === 'agente');

        return Response::bytes($file['content'], 'application/pdf', 200, [
            'Content-Disposition' => 'inline; filename="' . $file['filename'] . '"',
            'Content-Length' => (string) strlen($file['content']),
            'Cache-Control' => 'private, max-age=60',
        ]);
    }

    public function download(Request $request, array $args): Response
    {
        $user = AuthMiddleware::requireUser();
        $id = $this->idFromArgs($args);

        $file = $this->documents->download($id, (int) $user['id'], $request->ip, $user['role'] === 'agente');

        return Response::bytes($file['content'], 'application/pdf', 200, [
            'Content-Disposition' => 'attachment; filename="' . $file['filename'] . '"',
            'Content-Length' => (string) strlen($file['content']),
            'Cache-Control' => 'private, no-store',
        ]);
    }

    public function feedback(Request $request, array $args): Response
    {
        $user = AuthMiddleware::requireUser();
        AuthMiddleware::requireCsrf($request);

        $helpful = $request->bool('helpful');
        $this->documents->saveFeedback($this->idFromArgs($args), (int) $user['id'], $helpful);

        return Response::json(['helpful' => $helpful]);
    }

    public function store(Request $request): Response
    {
        AuthMiddleware::requireAgent();
        AuthMiddleware::requireCsrf($request);

        $agent = AuthMiddleware::requireAgent();

        $data = $this->metadata($request);
        $this->validateMetadata($data)->fail();

        $file = $this->requiredPdf($request);

        $detail = $this->documents->create($data, $file, (int) $agent['id']);

        return Response::json($detail, [], 201);
    }

    public function update(Request $request, array $args): Response
    {
        AuthMiddleware::requireAgent();
        AuthMiddleware::requireCsrf($request);

        $agent = AuthMiddleware::requireAgent();
        $id = $this->idFromArgs($args);
        $data = [];
        $mapping = ['title', 'description', 'type', 'system', 'app', 'version', 'year', 'keywords'];

        foreach ($mapping as $field) {
            if ($request->input($field) !== null) {
                $data[$field] = $request->input($field);
            }
        }

        if (isset($data['year'])) {
            $data['year'] = (int) $data['year'];
        }

        if (isset($data['keywords']) && is_string($data['keywords'])) {
            $data['keywords'] = array_values(array_filter(array_map('trim', explode(',', $data['keywords']))));
        }

        (new Validator($data))
            ->maxLength('title', 'El título', 255)
            ->maxLength('description', 'La descripción', 5000)
            ->in('type', 'El tipo', ['Manual', 'Comunicado'])
            ->integer('year', 'El año')
            ->fail();

        $file = $this->optionalPdf($request);

        if ($file !== null) {
            $detail = $this->documents->replaceVersion($id, $data, $file, (int) $agent['id']);
        } else {
            $detail = $this->documents->updateMetadata($id, $data);
        }

        return Response::json($detail);
    }

    public function storeVersion(Request $request, array $args): Response
    {
        AuthMiddleware::requireAgent();
        AuthMiddleware::requireCsrf($request);

        $agent = AuthMiddleware::requireAgent();
        $file = $this->requiredPdf($request);

        $detail = $this->documents->replaceVersion($this->idFromArgs($args), [], $file, (int) $agent['id']);

        return Response::json($detail, [], 201);
    }

    public function updateStatus(Request $request, array $args): Response
    {
        AuthMiddleware::requireAgent();
        AuthMiddleware::requireCsrf($request);

        $status = $request->string('status');

        (new Validator(['status' => $status]))
            ->required('status', 'El estado')
            ->in('status', 'El estado', ['borrador', 'publicado', 'inactivo'])
            ->fail();

        return Response::json($this->documents->changeStatus($this->idFromArgs($args), $status));
    }

    /** @return array<string, mixed> */
    private function metadata(Request $request): array
    {
        $keywords = $request->input('keywords');

        if (is_string($keywords)) {
            $keywords = array_values(array_filter(array_map('trim', explode(',', $keywords))));
        }

        return [
            'title' => $request->string('title'),
            'description' => $request->string('description'),
            'type' => $request->string('type'),
            'system' => $request->string('system'),
            'app' => $request->string('app'),
            'version' => $request->string('version'),
            'year' => $request->int('year'),
            'keywords' => is_array($keywords) ? $keywords : [],
            'publish' => $request->bool('publish'),
        ];
    }

    /** @param array<string, mixed> $data */
    private function validateMetadata(array $data): Validator
    {
        return (new Validator($data))
            ->required('title', 'El título')
            ->maxLength('title', 'El título', 255)
            ->required('description', 'La descripción')
            ->maxLength('description', 'La descripción', 5000)
            ->required('type', 'El tipo')
            ->in('type', 'El tipo', ['Manual', 'Comunicado'])
            ->required('system', 'El sistema')
            ->required('app', 'El aplicativo')
            ->required('year', 'El año')
            ->integer('year', 'El año');
    }

    /** @return array<string, mixed> */
    private function requiredPdf(Request $request): array
    {
        $file = $request->files['file'] ?? $request->files['pdf'] ?? null;

        if (!is_array($file) || (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            throw HttpException::unprocessable(
                'Debes adjuntar el archivo PDF del documento.',
                ['file' => ['El archivo es obligatorio.']],
            );
        }

        return $file;
    }

    /** @return array<string, mixed>|null */
    private function optionalPdf(Request $request): ?array
    {
        $file = $request->files['file'] ?? $request->files['pdf'] ?? null;

        if (!is_array($file) || (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            return null;
        }

        return $file;
    }

    /** @param array<string, mixed> $args */
    private function idFromArgs(array $args): int
    {
        $id = (int) ($args['id'] ?? 0);

        if ($id <= 0) {
            throw HttpException::notFound('El documento solicitado no existe.');
        }

        return $id;
    }
}
