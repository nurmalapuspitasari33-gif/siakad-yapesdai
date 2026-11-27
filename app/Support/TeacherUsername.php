<?php

namespace App\Support;

use Illuminate\Support\Str;

class TeacherUsername
{
    /**
     * @var array<int, string>
     */
    private const PREFIX_TITLES = [
        'dr',
        'drs',
        'dra',
        'ir',
        'prof',
        'kh',
        'ust',
        'ustadz',
        'ustaz',
        'h',
        'hj',
    ];

    /**
     * @var array<int, string>
     */
    private const SUFFIX_TITLES = [
        'spd',
        'spdi',
        'st',
        'skom',
        'se',
        'sh',
        'sag',
        'ssi',
        'ssos',
        'sp',
        'spt',
        'sfarm',
        'skep',
        'skm',
        'spsi',
        'sfil',
        'mpd',
        'mpdi',
        'mt',
        'mkom',
        'msi',
        'me',
        'mh',
        'mag',
        'mm',
        'mp',
        'mpt',
        'mkes',
        'msos',
        'mpsi',
        'mhum',
        'mba',
        'phd',
        'dr',
    ];

    public static function baseFromName(string $name): string
    {
        $nameParts = preg_split('/[\s,]+/u', trim($name), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        while ($nameParts !== [] && in_array(self::normalizeTitle($nameParts[0]), self::PREFIX_TITLES, true)) {
            array_shift($nameParts);
        }

        while ($nameParts !== [] && in_array(self::normalizeTitle($nameParts[array_key_last($nameParts)]), self::SUFFIX_TITLES, true)) {
            array_pop($nameParts);
        }

        $baseUsername = rtrim(substr(Str::slug(implode(' ', $nameParts), '.'), 0, 240), '.');
        $baseUsername = $baseUsername === '' ? 'guru' : $baseUsername;

        if (preg_match('/^\d{16}$/D', $baseUsername) === 1) {
            $baseUsername = 'guru.'.$baseUsername;
        }

        return $baseUsername;
    }

    private static function normalizeTitle(string $title): string
    {
        return preg_replace('/[^\p{L}\p{N}]+/u', '', mb_strtolower($title)) ?? '';
    }
}
