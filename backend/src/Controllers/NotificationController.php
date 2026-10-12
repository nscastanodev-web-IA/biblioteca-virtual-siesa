<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\HttpException;
use App\Http\Request;
use App\Http\Response;
use App\Middleware\AuthMiddleware;
use App\Repositories\NotificationRepository;
use App\Support\Presenter;

final class NotificationController
{
    public function __construct(private NotificationRepository $notifications = new NotificationRepository())
    {
    }

    public function index(Request $request): Response
    {
        $user = AuthMiddleware::requireUser();
        $onlyUnread = $request->queryParam('unread', '0') === '1';

        $items = array_map(
            static fn (array $row): array => Presenter::notification($row),
            $this->notifications->forUser((int) $user['id'], $onlyUnread),
        );

        return Response::json($items, [
            'total' => count($items),
            'unread' => $this->notifications->unreadCount((int) $user['id']),
        ]);
    }

    public function markRead(Request $request, array $args): Response
    {
        $user = AuthMiddleware::requireUser();
        AuthMiddleware::requireCsrf($request);

        $id = (int) ($args['id'] ?? 0);

        if ($id <= 0 || !$this->notifications->markRead($id, (int) $user['id'])) {
            throw HttpException::notFound('La notificación indicada no existe.');
        }

        return Response::json([
            'id' => (string) $id,
            'read' => true,
        ]);
    }

    public function readAll(Request $request): Response
    {
        $user = AuthMiddleware::requireUser();
        AuthMiddleware::requireCsrf($request);

        $updated = $this->notifications->markAllRead((int) $user['id']);

        return Response::json([
            'updated' => $updated,
            'unread' => 0,
        ]);
    }
}
