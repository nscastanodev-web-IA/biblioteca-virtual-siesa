<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Database\Connection;
use App\Http\Request;
use App\Http\Response;
use Throwable;

final class HealthController
{
    public function index(): Response
    {
        $database = true;
        $detail = 'ok';

        try {
            Connection::get()->query('SELECT 1')->fetchColumn();
        } catch (Throwable $exception) {
            $database = false;
            $detail = 'sin conexión';
        }

        return Response::json([
            'status' => $database ? 'ok' : 'degraded',
            'database' => $database,
            'detail' => $detail,
            'time' => date('c'),
        ], [], $database ? 200 : 503);
    }
}
