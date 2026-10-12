<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\HttpException;
use App\Support\Env;

/**
 * Almacenamiento de archivos. Nunca confía en el nombre ni el MIME enviados
 * por el navegador: comprueba firma binaria y usa un nombre aleatorio.
 * El directorio queda fuera de public/, así que toda descarga pasa por el API.
 */
final class StorageService
{
    private const MAX_ATTACHMENT_MB = 10;

    private const ALLOWED_ATTACHMENT_MIMES = [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/webp',
    ];

    public static function documentsDirectory(): string
    {
        return BASE_PATH . '/' . trim((string) Env::get('STORAGE_DOCUMENTS_PATH', 'storage/documents'), '/');
    }

    public static function attachmentsDirectory(): string
    {
        return BASE_PATH . '/storage/attachments';
    }

    /**
     * @param array<string, mixed> $file entrada de $_FILES
     * @return array{pdfPath: string, originalName: string, detectedMime: string, detectedSize: int}
     */
    public static function storePdf(array $file): array
    {
        $maxMb = Env::int('MAX_UPLOAD_MB', 20);

        self::assertUploadOk($file, $maxMb, 'El documento');

        $tmpName = (string) $file['tmp_name'];
        $size = (int) $file['size'];

        if ($size <= 0) {
            throw HttpException::unprocessable('El archivo está vacío.', ['file' => ['El archivo está vacío.']]);
        }

        self::assertPdfSignature($tmpName);

        $mime = self::detectMime($tmpName);

        if ($mime !== 'application/pdf') {
            throw HttpException::unprocessable(
                'El archivo no es un PDF válido.',
                ['file' => ['El contenido del archivo no corresponde a un PDF.']],
            );
        }

        $directory = self::documentsDirectory();
        self::ensureDirectory($directory);

        $storedName = bin2hex(random_bytes(16)) . '.pdf';

        if (!move_uploaded_file($tmpName, $directory . '/' . $storedName)) {
            throw new HttpException(500, 'No fue posible guardar el documento en el servidor.');
        }

        return [
            'pdfPath' => 'documents/' . $storedName,
            'originalName' => self::sanitizeName((string) ($file['name'] ?? 'documento.pdf')),
            'detectedMime' => $mime,
            'detectedSize' => $size,
        ];
    }

    /**
     * @param array<string, mixed> $file entrada de $_FILES
     * @return array{storedPath: string, originalName: string, detectedMime: string, detectedSize: int}
     */
    public static function storeAttachment(array $file): array
    {
        self::assertUploadOk($file, self::MAX_ATTACHMENT_MB, 'El archivo adjunto');

        $tmpName = (string) $file['tmp_name'];
        $mime = self::detectMime($tmpName);

        if (!in_array($mime, self::ALLOWED_ATTACHMENT_MIMES, true)) {
            throw HttpException::unprocessable(
                'Solo se permiten adjuntos PDF, PNG, JPG o WEBP.',
                ['file' => ['Formato de archivo no permitido.']],
            );
        }

        $directory = self::attachmentsDirectory();
        self::ensureDirectory($directory);

        $extension = match ($mime) {
            'application/pdf' => 'pdf',
            'image/png' => 'png',
            'image/jpeg' => 'jpg',
            default => 'webp',
        };

        $storedName = bin2hex(random_bytes(16)) . '.' . $extension;

        if (!move_uploaded_file($tmpName, $directory . '/' . $storedName)) {
            throw new HttpException(500, 'No fue posible guardar el adjunto.');
        }

        return [
            'storedPath' => 'attachments/' . $storedName,
            'originalName' => self::sanitizeName((string) ($file['name'] ?? 'adjunto')),
            'detectedMime' => $mime,
            'detectedSize' => (int) $file['size'],
        ];
    }

    /** @return array<string, mixed>|null */
    public static function locate(string $relativePath): ?array
    {
        $relativePath = ltrim($relativePath, '/');

        if (str_contains($relativePath, '..')) {
            return null;
        }

        $base = str_starts_with($relativePath, 'attachments/') ? BASE_PATH . '/storage/' : BASE_PATH . '/storage/';
        $absolute = $base . $relativePath;

        if (!is_file($absolute)) {
            return null;
        }

        return [
            'absolutePath' => $absolute,
            'size' => (int) filesize($absolute),
            'mime' => self::detectMime($absolute),
        ];
    }

    public static function delete(string $relativePath): void
    {
        $file = self::locate($relativePath);

        if ($file !== null) {
            @unlink($file['absolutePath']);
        }
    }

    /** @param array<string, mixed> $file */
    private static function assertUploadOk(array $file, int $maxMb, string $label): void
    {
        $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);

        if ($error !== UPLOAD_ERR_OK) {
            $message = match ($error) {
                UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => $label . ' supera el tamaño máximo permitido.',
                UPLOAD_ERR_PARTIAL => $label . ' se subió de forma incompleta. Intenta de nuevo.',
                UPLOAD_ERR_NO_FILE, UPLOAD_ERR_NO_TMP_DIR, UPLOAD_ERR_CANT_WRITE => 'No recibimos ningún archivo válido.',
                default => 'No fue posible procesar el archivo.',
            };

            throw HttpException::unprocessable($message, ['file' => [$message]]);
        }

        if ((int) ($file['size'] ?? 0) > $maxMb * 1024 * 1024) {
            $message = sprintf('%s supera el límite de %d MB.', $label, $maxMb);

            throw HttpException::unprocessable($message, ['file' => [$message]]);
        }
    }

    private static function assertPdfSignature(string $path): void
    {
        $handle = @fopen($path, 'rb');

        if ($handle === false) {
            throw new HttpException(500, 'No fue posible leer el archivo recibido.');
        }

        $header = (string) fread($handle, 5);
        fclose($handle);

        // Todo PDF real empieza con la firma %PDF-
        if ($header !== '%PDF-') {
            throw HttpException::unprocessable(
                'El archivo no es un PDF válido.',
                ['file' => ['El archivo no contiene la firma %PDF.']],
            );
        }
    }

    private static function detectMime(string $path): string
    {
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($path);

        return is_string($mime) ? $mime : 'application/octet-stream';
    }

    private static function sanitizeName(string $name): string
    {
        $name = basename($name);
        $name = (string) preg_replace('/[^\p{L}\p{N}._\- ]+/u', '', $name);

        return mb_substr(trim($name) === '' ? 'archivo' : trim($name), 0, 180);
    }

    private static function ensureDirectory(string $directory): void
    {
        if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
            throw new HttpException(500, 'No fue posible preparar el directorio de almacenamiento.');
        }
    }
}
