<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\HttpException;

/**
 * Reglas de transición de estados de las solicitudes.
 * Ningún cambio de estado ocurre fuera de este mapa.
 */
final class RequestStatusService
{
    public const RECIBIDA = 'Recibida';
    public const EN_VALIDACION = 'En validación';
    public const INFO_REQUERIDA = 'Información adicional requerida';
    public const APROBADA = 'Aprobada';
    public const EN_PRODUCCION = 'En producción';
    public const DOCUMENTO_DISPONIBLE = 'Documento disponible';
    public const RECHAZADA = 'Rechazada';
    public const CERRADA = 'Cerrada';

    public const ALL = [
        self::RECIBIDA,
        self::EN_VALIDACION,
        self::INFO_REQUERIDA,
        self::APROBADA,
        self::EN_PRODUCCION,
        self::DOCUMENTO_DISPONIBLE,
        self::RECHAZADA,
        self::CERRADA,
    ];

    /** Estados desde los que el cliente todavía puede cancelar su solicitud. */
    private const CLIENT_CANCELLABLE = [
        self::RECIBIDA,
        self::EN_VALIDACION,
        self::INFO_REQUERIDA,
        self::APROBADA,
    ];

    /** @var array<string, list<string>> */
    private const TRANSITIONS = [
        self::RECIBIDA => [self::EN_VALIDACION, self::RECHAZADA, self::CERRADA],
        self::EN_VALIDACION => [self::INFO_REQUERIDA, self::APROBADA, self::RECHAZADA, self::CERRADA],
        self::INFO_REQUERIDA => [self::EN_VALIDACION, self::RECHAZADA, self::CERRADA],
        self::APROBADA => [self::EN_PRODUCCION, self::RECHAZADA, self::CERRADA],
        self::EN_PRODUCCION => [self::DOCUMENTO_DISPONIBLE, self::CERRADA],
        self::DOCUMENTO_DISPONIBLE => [self::CERRADA],
        self::RECHAZADA => [self::EN_VALIDACION],
        self::CERRADA => [],
    ];

    /** El envío a producción siempre exige responsable, fecha e instrucciones. */
    public const ACTION_BY_STATUS = [
        self::EN_VALIDACION => 'Cambio de estado',
        self::INFO_REQUERIDA => 'Solicitud de información',
        self::APROBADA => 'Cambio de estado',
        self::EN_PRODUCCION => 'Envío a producción',
        self::DOCUMENTO_DISPONIBLE => 'Publicación de documento',
        self::RECHAZADA => 'Rechazo de solicitud',
        self::CERRADA => 'Cierre de solicitud',
        self::RECIBIDA => 'Cambio de estado',
    ];

    public static function assertTransition(string $current, string $next): void
    {
        if ($current === $next) {
            throw HttpException::unprocessable('La solicitud ya se encuentra en ese estado.');
        }

        if (!in_array($next, self::TRANSITIONS[$current] ?? [], true)) {
            throw HttpException::unprocessable(sprintf(
                'No es posible pasar de "%s" a "%s". Revisa el flujo permitido.',
                $current,
                $next,
            ));
        }
    }

    public static function canClientCancel(string $status): bool
    {
        return in_array($status, self::CLIENT_CANCELLABLE, true);
    }

    /** @return list<string> */
    public static function allowedFrom(string $status): array
    {
        return self::TRANSITIONS[$status] ?? [];
    }

    /**
     * Estados que cuentan como "sin gestión del agente" para las alertas internas.
     */
    public static function isPending(string $status): bool
    {
        return in_array($status, [self::RECIBIDA, self::EN_VALIDACION, self::INFO_REQUERIDA], true);
    }
}
