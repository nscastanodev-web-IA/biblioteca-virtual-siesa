<?php

declare(strict_types=1);

use App\Controllers\AuthController;
use App\Controllers\DocumentController;
use App\Controllers\HealthController;
use App\Controllers\NotificationController;
use App\Controllers\ProfileController;
use App\Controllers\RequestController;
use App\Http\Request;
use App\Http\Response;
use App\Http\Router;

/**
 * Registro central de rutas del API. Todas cuelgan de /api/v1.
 *
 * Los manejadores reciben (Request $request, array $args): Response.
 */
return static function (Router $router): void {
    $auth = new AuthController();
    $documents = new DocumentController();
    $requests = new RequestController();
    $notifications = new NotificationController();
    $profile = new ProfileController();
    $health = new HealthController();

    // --- Salud ---------------------------------------------------------
    $router->get('/api/v1/health', [$health, 'index']);

    // --- Autenticación -------------------------------------------------
    $router->post('/api/v1/auth/register', [$auth, 'register']);
    $router->post('/api/v1/auth/login', [$auth, 'login']);
    $router->post('/api/v1/auth/logout', [$auth, 'logout']);
    $router->get('/api/v1/auth/me', [$auth, 'me']);
    $router->post('/api/v1/auth/forgot-password', [$auth, 'forgotPassword']);
    $router->post('/api/v1/auth/reset-password', [$auth, 'resetPassword']);
    $router->post('/api/v1/auth/verify-email', [$auth, 'verifyEmail']);

    // --- Documentos ----------------------------------------------------
    $router->get('/api/v1/documents', [$documents, 'index']);
    $router->get('/api/v1/documents/filters', [$documents, 'filters']);
    $router->post('/api/v1/documents', [$documents, 'store']);
    $router->get('/api/v1/documents/{id}', [$documents, 'show']);
    $router->patch('/api/v1/documents/{id}', [$documents, 'update']);
    $router->get('/api/v1/documents/{id}/preview', [$documents, 'preview']);
    $router->get('/api/v1/documents/{id}/download', [$documents, 'download']);
    $router->post('/api/v1/documents/{id}/feedback', [$documents, 'feedback']);
    $router->post('/api/v1/documents/{id}/versions', [$documents, 'storeVersion']);
    $router->patch('/api/v1/documents/{id}/status', [$documents, 'updateStatus']);

    // --- Solicitudes ---------------------------------------------------
    $router->get('/api/v1/requests', [$requests, 'index']);
    $router->post('/api/v1/requests', [$requests, 'store']);
    $router->get('/api/v1/requests/stats', [$requests, 'stats']);
    $router->get('/api/v1/requests/agents', [$requests, 'agents']);
    $router->get('/api/v1/requests/{id}', [$requests, 'show']);
    $router->post('/api/v1/requests/{id}/comments', [$requests, 'addComment']);
    $router->patch('/api/v1/requests/{id}/status', [$requests, 'updateStatus']);
    $router->patch('/api/v1/requests/{id}/cancel', [$requests, 'cancel']);
    $router->patch('/api/v1/requests/{id}/assignment', [$requests, 'updateAssignment']);
    $router->post('/api/v1/requests/{id}/production', [$requests, 'sendToProduction']);
    $router->patch('/api/v1/requests/{id}/document', [$requests, 'linkDocument']);

    // --- Notificaciones ------------------------------------------------
    $router->get('/api/v1/notifications', [$notifications, 'index']);
    $router->patch('/api/v1/notifications/read-all', [$notifications, 'readAll']);
    $router->patch('/api/v1/notifications/{id}/read', [$notifications, 'markRead']);

    // --- Perfil --------------------------------------------------------
    $router->get('/api/v1/profile', [$profile, 'show']);
    $router->patch('/api/v1/profile', [$profile, 'update']);
    $router->patch('/api/v1/profile/password', [$profile, 'password']);
    $router->patch('/api/v1/profile/preferences', [$profile, 'preferences']);
    $router->patch('/api/v1/profile/onboarding', [$profile, 'onboarding']);
};
