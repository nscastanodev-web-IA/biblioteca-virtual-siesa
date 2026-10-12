<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\HttpException;
use App\Http\Request;
use App\Http\Response;
use App\Middleware\AuthMiddleware;
use App\Services\RequestService;
use App\Services\RequestStatusService;
use App\Validation\Validator;

final class RequestController
{
    public function __construct(private RequestService $requests = new RequestService())
    {
    }

    public function index(Request $request): Response
    {
        $user = AuthMiddleware::requireUser();

        $filters = [
            'q' => $request->queryParam('q', ''),
            'status' => $request->queryParam('status', ''),
            'priority' => $request->queryParam('priority', ''),
            'type' => $request->queryParam('type', ''),
            'system' => $request->queryParam('system', ''),
            'app' => $request->queryParam('app', ''),
            'assigned' => $request->queryParam('assigned', ''),
            'client' => $request->queryParam('client', ''),
            'company' => $request->queryParam('company', ''),
            'nit' => $request->queryParam('nit', ''),
            'date_from' => $request->queryParam('date_from', ''),
            'date_to' => $request->queryParam('date_to', ''),
            'page' => $request->queryParam('page', '1'),
            'per_page' => $request->queryParam('per_page', '20'),
        ];

        $result = $this->requests->list($filters, $user);

        return Response::json($result['items'], $result['meta']);
    }

    public function stats(Request $request): Response
    {
        $user = AuthMiddleware::requireUser();

        return Response::json($this->requests->stats($user));
    }

    public function agents(): Response
    {
        AuthMiddleware::requireAgent();

        return Response::json($this->requests->agents());
    }

    public function show(Request $request, array $args): Response
    {
        $user = AuthMiddleware::requireUser();

        return Response::json($this->requests->detail($this->idFromArgs($args), $user));
    }

    public function store(Request $request): Response
    {
        $user = AuthMiddleware::requireUser();
        AuthMiddleware::requireCsrf($request);

        $data = [
            'type' => $request->string('type'),
            'requestType' => $request->string('requestType'),
            'system' => $request->string('system'),
            'app' => $request->string('app'),
            'version' => $request->string('version'),
            'year' => $request->int('year'),
            'title' => $request->string('title'),
            'description' => $request->string('description'),
            'reason' => $request->string('reason'),
            'priority' => $request->string('priority'),
            'notificationChannel' => $request->string('notificationChannel', 'ambos'),
        ];

        (new Validator($data))
            ->required('type', 'El tipo de documento')
            ->in('type', 'El tipo de documento', ['Manual', 'Comunicado'])
            ->required('requestType', 'El tipo de solicitud')
            ->in('requestType', 'El tipo de solicitud', ['Documento nuevo', 'Actualización', 'Corrección'])
            ->required('system', 'El sistema')
            ->required('app', 'El aplicativo')
            ->required('year', 'El año')
            ->integer('year', 'El año')
            ->required('title', 'El título')
            ->maxLength('title', 'El título', 255)
            ->required('description', 'La descripción')
            ->minLength('description', 'La descripción', 20)
            ->required('reason', 'La justificación')
            ->minLength('reason', 'La justificación', 20)
            ->required('priority', 'La prioridad')
            ->in('priority', 'La prioridad', ['Baja', 'Media', 'Alta'])
            ->in('notificationChannel', 'El canal de notificación', ['aplicación', 'correo', 'ambos'])
            ->fail();

        $detail = $this->requests->create($data, $request->files, $user);

        return Response::json($detail, [], 201);
    }

    public function addComment(Request $request, array $args): Response
    {
        $user = AuthMiddleware::requireUser();
        AuthMiddleware::requireCsrf($request);

        $text = $request->string('text');

        (new Validator(['text' => $text]))
            ->required('text', 'El comentario')
            ->minLength('text', 'El comentario', 2)
            ->maxLength('text', 'El comentario', 2000)
            ->fail();

        $detail = $this->requests->addComment($this->idFromArgs($args), $user, $text, $request->bool('internal'));

        return Response::json($detail, [], 201);
    }

    public function updateStatus(Request $request, array $args): Response
    {
        $user = AuthMiddleware::requireAgent();
        AuthMiddleware::requireCsrf($request);

        $status = $request->string('status');

        (new Validator(['status' => $status]))
            ->required('status', 'El estado')
            ->in('status', 'El estado', RequestStatusService::ALL)
            ->fail();

        $detail = $this->requests->transition(
            $this->idFromArgs($args),
            $user,
            $status,
            $request->string('comment') !== '' ? $request->string('comment') : null,
            $request->bool('internal'),
        );

        return Response::json($detail);
    }

    public function cancel(Request $request, array $args): Response
    {
        $user = AuthMiddleware::requireUser();
        AuthMiddleware::requireCsrf($request);

        return Response::json($this->requests->cancelByClient($this->idFromArgs($args), $user));
    }

    public function updateAssignment(Request $request, array $args): Response
    {
        $user = AuthMiddleware::requireAgent();
        AuthMiddleware::requireCsrf($request);

        $assignee = $request->string('assignedTo');
        $estimatedDate = $request->string('estimatedDate');

        (new Validator(['assignedTo' => $assignee, 'estimatedDate' => $estimatedDate]))
            ->required('assignedTo', 'El responsable')
            ->digitsOnly('assignedTo', 'El responsable')
            ->fail();

        $detail = $this->requests->assign(
            $this->idFromArgs($args),
            $user,
            (int) $assignee,
            $estimatedDate !== '' ? $estimatedDate . ' 18:00:00' : null,
        );

        return Response::json($detail);
    }

    public function sendToProduction(Request $request, array $args): Response
    {
        $user = AuthMiddleware::requireAgent();
        AuthMiddleware::requireCsrf($request);

        $data = [
            'assignedTo' => $request->string('assignedTo'),
            'estimatedDate' => $request->string('estimatedDate'),
            'instructions' => $request->string('instructions'),
        ];

        (new Validator($data))
            ->required('assignedTo', 'El responsable de producción')
            ->digitsOnly('assignedTo', 'El responsable de producción')
            ->required('estimatedDate', 'La fecha estimada')
            ->required('instructions', 'Las instrucciones de producción')
            ->minLength('instructions', 'Las instrucciones de producción', 10)
            ->fail();

        $comment = $request->string('comment');

        $detail = $this->requests->sendToProduction(
            $this->idFromArgs($args),
            $user,
            (int) $data['assignedTo'],
            (string) $data['estimatedDate'],
            (string) $data['instructions'],
            $comment !== '' ? $comment : null,
        );

        return Response::json($detail);
    }

    public function linkDocument(Request $request, array $args): Response
    {
        $user = AuthMiddleware::requireAgent();
        AuthMiddleware::requireCsrf($request);

        $documentId = $request->string('documentId');

        (new Validator(['documentId' => $documentId]))
            ->required('documentId', 'El documento')
            ->digitsOnly('documentId', 'El documento')
            ->fail();

        $comment = $request->string('comment');
        $id = $this->idFromArgs($args);

        $detail = $request->bool('publish')
            ? $this->requests->publishDocument($id, $user, (int) $documentId, $comment !== '' ? $comment : null)
            : $this->requests->linkDocument($id, $user, (int) $documentId, $comment !== '' ? $comment : null);

        return Response::json($detail);
    }

    /** @param array<string, mixed> $args */
    private function idFromArgs(array $args): int
    {
        $id = (int) ($args['id'] ?? 0);

        if ($id <= 0) {
            throw HttpException::notFound('La solicitud indicada no existe.');
        }

        return $id;
    }
}
