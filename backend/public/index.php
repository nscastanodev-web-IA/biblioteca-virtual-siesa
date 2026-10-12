<?php

declare(strict_types=1);

/**
 * Único punto de entrada del API.
 *
 * Desarrollo:  php -S 127.0.0.1:8000 -t backend/public backend/public/index.php
 * Producción:  el servidor web debe apuntar su DocumentRoot a backend/public.
 */

require __DIR__ . '/../bootstrap.php';

App\Kernel::boot()->run();
