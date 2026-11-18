<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Exception as SpreadsheetException;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SpreadsheetFile
{
    /**
     * @param  array<int, string>  $headers
     */
    public static function downloadTemplate(string $filename, array $headers): StreamedResponse
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray($headers, null, 'A1');
        $sheet->getStyle('A1:'.$sheet->getHighestColumn().'1')->getFont()->setBold(true);

        foreach (range('A', $sheet->getHighestColumn()) as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        return response()->streamDownload(function () use ($spreadsheet): void {
            try {
                (new Xlsx($spreadsheet))->save('php://output');
            } finally {
                $spreadsheet->disconnectWorksheets();
            }
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * @param  array<int, string>  $expectedHeaders
     * @param  array<string, string>  $headerAliases
     * @param  array<int, string>  $optionalHeaders
     * @return array<int, array{row: int, data: array<string, mixed>}>
     */
    public static function readRows(
        UploadedFile $file,
        array $expectedHeaders,
        array $headerAliases = [],
        array $optionalHeaders = [],
        ?string $sheetName = null,
    ): array {
        try {
            $spreadsheet = IOFactory::load($file->getRealPath());
        } catch (SpreadsheetException) {
            throw ValidationException::withMessages([
                'file' => 'File Excel tidak dapat dibaca. Pastikan formatnya .xlsx dan file tidak rusak.',
            ]);
        }

        try {
            $sheet = $sheetName === null
                ? $spreadsheet->getActiveSheet()
                : ($spreadsheet->getSheetByName($sheetName) ?? $spreadsheet->getActiveSheet());
            $uploadedLastColumn = Coordinate::columnIndexFromString(
                $sheet->getHighestDataColumn(1),
            );
            $lastColumn = Coordinate::stringFromColumnIndex($uploadedLastColumn);
            $uploadedHeaders = $sheet->rangeToArray("A1:{$lastColumn}1", null, true, false)[0] ?? [];
            $uploadedHeaders = array_map(
                static fn (mixed $header): string => mb_strtolower(trim((string) $header)),
                $uploadedHeaders,
            );
            $normalizedAliases = [];

            foreach ($headerAliases as $alias => $canonicalHeader) {
                $normalizedAliases[mb_strtolower(trim($alias))] = mb_strtolower(trim($canonicalHeader));
            }

            $uploadedHeaders = array_map(
                static fn (string $header): string => $normalizedAliases[$header] ?? $header,
                $uploadedHeaders,
            );
            $normalizedHeaders = array_map(
                static fn (string $header): string => mb_strtolower(trim($header)),
                $expectedHeaders,
            );
            $normalizedOptionalHeaders = array_map(
                static fn (string $header): string => mb_strtolower(trim($header)),
                $optionalHeaders,
            );
            $requiredHeaders = array_values(array_diff($normalizedHeaders, $normalizedOptionalHeaders));

            $headersAreKnown = array_diff($uploadedHeaders, $normalizedHeaders) === [];
            $headersAreOrdered = array_values(array_intersect($normalizedHeaders, $uploadedHeaders)) === $uploadedHeaders;
            $headersAreUnique = count($uploadedHeaders) === count(array_unique($uploadedHeaders));
            $hasRequiredHeaders = array_diff($requiredHeaders, $uploadedHeaders) === [];

            if (
                ! $headersAreKnown
                || ! $headersAreOrdered
                || ! $headersAreUnique
                || ! $hasRequiredHeaders
                || $uploadedLastColumn !== count($uploadedHeaders)
            ) {
                throw ValidationException::withMessages([
                    'file' => 'Urutan atau nama kolom tidak sesuai dengan template Excel yang disediakan.',
                ]);
            }

            $rows = [];
            $expectedHeaderNames = array_combine($normalizedHeaders, $expectedHeaders);

            for ($rowNumber = 2; $rowNumber <= $sheet->getHighestDataRow(); $rowNumber++) {
                $cells = [];

                foreach ($uploadedHeaders as $index => $header) {
                    $column = Coordinate::stringFromColumnIndex($index + 1);
                    $cell = $sheet->getCell("{$column}{$rowNumber}");

                    if ($cell->getDataType() === DataType::TYPE_FORMULA) {
                        throw ValidationException::withMessages([
                            'file' => "Baris {$rowNumber} tidak boleh berisi formula Excel.",
                        ]);
                    }

                    $value = $cell->getValue();

                    if (is_numeric($value) && Date::isDateTime($cell)) {
                        $value = Date::excelToDateTimeObject((float) $value)->format('Y-m-d');
                    }

                    $cells[$expectedHeaderNames[$header]] = $value;
                }

                $values = array_map(
                    static function (mixed $value): mixed {
                        if ($value === null) {
                            return null;
                        }

                        if (is_int($value) || is_float($value)) {
                            return (string) $value;
                        }

                        if (is_string($value)) {
                            $trimmed = trim($value);

                            return $trimmed === '' ? null : $trimmed;
                        }

                        return $value;
                    },
                    $cells,
                );

                if (count(array_filter($values, static fn (mixed $value): bool => $value !== null && $value !== '')) === 0) {
                    continue;
                }

                $rows[] = [
                    'row' => $rowNumber,
                    'data' => array_replace(
                        array_fill_keys($expectedHeaders, null),
                        $values,
                    ),
                ];
            }

            if ($rows === []) {
                throw ValidationException::withMessages([
                    'file' => 'Template belum berisi data untuk diimpor.',
                ]);
            }

            return $rows;
        } finally {
            $spreadsheet->disconnectWorksheets();
        }
    }
}
