<?php

declare(strict_types=1);

/**
 * Genera los archivos PDF de demostración que referencia database/seed.sql y
 * prepara los directorios de almacenamiento.
 *
 * Uso:  php backend/bin/seed-demo.php
 *
 * Es idempotente: solo crea los archivos que falten.
 */

require __DIR__ . '/../bootstrap.php';

use App\Database\Connection;
use App\Services\StorageService;

function ensureDirectory(string $directory): void
{
    if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
        fwrite(STDERR, "No fue posible crear {$directory}\n");
        exit(1);
    }
}

/**
 * Construye un PDF válido de una página con el texto indicado.
 */
function buildPdf(string $title, string $subtitle): string
{
    $escape = static function (string $text): string {
        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $text);
    };

    $content = "BT\n/F1 20 Tf\n70 770 Td\n(" . $escape($title) . ") Tj\n"
        . "/F1 12 Tf\n0 -28 Td\n(" . $escape($subtitle) . ") Tj\n"
        . "/F1 10 Tf\n0 -40 Td\n(Documento de demostracion - Biblioteca Virtual Siesa) Tj\nET";

    $objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
        "<< /Length " . strlen($content) . " >>\nstream\n" . $content . "\nendstream",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ];

    $pdf = "%PDF-1.4\n";
    $offsets = [0];

    foreach ($objects as $index => $body) {
        $offsets[] = strlen($pdf);
        $pdf .= ($index + 1) . " 0 obj\n" . $body . "\nendobj\n";
    }

    $xrefOffset = strlen($pdf);
    $count = count($objects) + 1;

    $pdf .= "xref\n0 {$count}\n";
    $pdf .= "0000000000 65535 f \n";

    for ($i = 1; $i < $count; $i++) {
        $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
    }

    $pdf .= "trailer\n<< /Size {$count} /Root 1 0 R >>\nstartxref\n{$xrefOffset}\n%%EOF\n";

    return $pdf;
}

$documentsDirectory = StorageService::documentsDirectory();
ensureDirectory($documentsDirectory);
ensureDirectory(StorageService::attachmentsDirectory());
ensureDirectory(BASE_PATH . '/storage/logs');

foreach (['documents', 'attachments', 'logs'] as $folder) {
    $keep = BASE_PATH . '/storage/' . $folder . '/.gitkeep';

    if (!is_file($keep)) {
        file_put_contents($keep, '');
    }
}

try {
    $rows = Connection::get()->query(
        "SELECT pdf_path, title FROM documents
         UNION
         SELECT v.pdf_path, CONCAT('Versión ', v.version_number, ' de ', d.title)
         FROM document_versions v INNER JOIN documents d ON d.id = v.document_id"
    )->fetchAll();
} catch (Throwable $exception) {
    fwrite(STDERR, "No fue posible leer la base de datos: {$exception->getMessage()}\n");
    fwrite(STDERR, "Verifica que MariaDB esté activo y que database/schema.sql y seed.sql ya se hayan cargado.\n");
    exit(1);
}

$created = 0;
$skipped = 0;

foreach ($rows as $row) {
    $relative = ltrim((string) $row['pdf_path'], '/');

    if ($relative === '' || str_contains($relative, '..')) {
        continue;
    }

    $absolute = BASE_PATH . '/storage/' . $relative;

    if (is_file($absolute)) {
        $skipped++;

        continue;
    }

    ensureDirectory(dirname($absolute));
    file_put_contents($absolute, buildPdf((string) $row['title'], 'Archivo generado automáticamente para pruebas'));
    $created++;
}

printf("PDF de demostración creados: %d | ya existentes: %d\n", $created, $skipped);
printf("Directorio de documentos: %s\n", $documentsDirectory);
