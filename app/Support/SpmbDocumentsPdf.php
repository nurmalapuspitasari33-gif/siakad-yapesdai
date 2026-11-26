<?php

namespace App\Support;

use App\Models\PendaftaranSpmb;
use App\Models\PendaftaranSpmbBerkas;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class SpmbDocumentsPdf
{
    private const PAGE_WIDTH = 595.28;

    private const PAGE_HEIGHT = 841.89;

    /**
     * @param  array<int, PendaftaranSpmbBerkas>  $documents
     */
    public function generate(PendaftaranSpmb $pendaftaran, array $documents): string
    {
        if ($documents === []) {
            throw new RuntimeException('Tidak ada foto berkas SPMB yang dapat dikompilasi.');
        }

        $identity = [
            "SMK Al Mu'allim Kesugihan - YAPESDAI",
            'Kompilasi Foto Berkas Persyaratan SPMB',
            'Nomor pendaftaran: '.$pendaftaran->no_pendaftaran,
            'Nama: '.($pendaftaran->user?->siswa?->nama_lengkap ?? $pendaftaran->user?->name ?? '—'),
            'NIK: '.$pendaftaran->user?->nik,
        ];
        $objects = [
            1 => '<< /Type /Catalog /Pages 2 0 R >>',
            3 => '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        ];
        $pageReferences = [];

        foreach ($documents as $index => $document) {
            $imageContents = Storage::disk('public')->get($document->path);
            $imageSize = is_string($imageContents) ? getimagesizefromstring($imageContents) : false;

            if (
                ! is_string($imageContents)
                || ! is_array($imageSize)
                || ($imageSize['mime'] ?? null) !== 'image/jpeg'
            ) {
                throw new RuntimeException('Foto berkas SPMB tidak dapat dibaca sebagai JPEG.');
            }

            $pageObject = 4 + ($index * 3);
            $imageObject = $pageObject + 1;
            $contentObject = $pageObject + 2;
            $pageReferences[] = "{$pageObject} 0 R";

            $width = (int) $imageSize[0];
            $height = (int) $imageSize[1];
            $scale = min(495 / $width, 600 / $height);
            $imageWidth = $width * $scale;
            $imageHeight = $height * $scale;
            $imageX = (self::PAGE_WIDTH - $imageWidth) / 2;
            $imageY = 92 + ((600 - $imageHeight) / 2);
            $caption = $document->caption ?: 'Berkas persyaratan';
            $pageNumber = $index + 1;

            $content = implode("\n", [
                'BT /F1 14 Tf 50 800 Td ('.$this->escapeText($identity[0]).') Tj ET',
                'BT /F1 10 Tf 50 780 Td ('.$this->escapeText($identity[1]).') Tj ET',
                'BT /F1 10 Tf 50 760 Td ('.$this->escapeText($identity[2]).') Tj ET',
                'BT /F1 10 Tf 50 744 Td ('.$this->escapeText($identity[3]).') Tj ET',
                'BT /F1 10 Tf 50 728 Td ('.$this->escapeText($identity[4]).') Tj ET',
                '0.5 w 50 714 m 545 714 l S',
                sprintf('%.2F 0 0 %.2F %.2F %.2F cm /Im0 Do', $imageWidth, $imageHeight, $imageX, $imageY),
                'BT /F1 10 Tf 50 68 Td ('.$this->escapeText($caption).') Tj ET',
                'BT /F1 9 Tf 50 42 Td (Halaman '.$pageNumber.' dari '.count($documents).') Tj ET',
            ]);

            $objects[$pageObject] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '
                .self::PAGE_WIDTH.' '.self::PAGE_HEIGHT.'] /Resources << /Font << /F1 3 0 R >> '
                .'/XObject << /Im0 '.$imageObject.' 0 R >> >> /Contents '.$contentObject.' 0 R >>';
            $objects[$imageObject] = '<< /Type /XObject /Subtype /Image /Width '.$width
                .' /Height '.$height.' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '
                .strlen($imageContents)." >>\nstream\n".$imageContents."\nendstream";
            $objects[$contentObject] = '<< /Length '.strlen($content)." >>\nstream\n".$content."\nendstream";
        }

        $objects[2] = '<< /Type /Pages /Kids ['.implode(' ', $pageReferences).'] /Count '.count($documents).' >>';
        $objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
        ksort($objects);

        $pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
        $offsets = [0];

        foreach ($objects as $objectNumber => $objectContents) {
            $offsets[$objectNumber] = strlen($pdf);
            $pdf .= "{$objectNumber} 0 obj\n{$objectContents}\nendobj\n";
        }

        $crossReferenceOffset = strlen($pdf);
        $objectCount = count($objects) + 1;
        $pdf .= "xref\n0 {$objectCount}\n0000000000 65535 f \n";

        for ($objectNumber = 1; $objectNumber < $objectCount; $objectNumber++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$objectNumber]);
        }

        return $pdf
            ."trailer\n<< /Size {$objectCount} /Root 1 0 R >>\n"
            ."startxref\n{$crossReferenceOffset}\n%%EOF";
    }

    private function escapeText(string $value): string
    {
        $plainText = preg_replace('/[\r\n\t]+/', ' ', $value) ?? $value;
        $encoded = function_exists('iconv')
            ? iconv('UTF-8', 'Windows-1252//TRANSLIT//IGNORE', $plainText)
            : false;
        $plainText = is_string($encoded)
            ? $encoded
            : preg_replace('/[^\x20-\x7E]/', '?', $plainText);

        return str_replace(
            ['\\', '(', ')'],
            ['\\\\', '\\(', '\\)'],
            $plainText,
        );
    }
}
