<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'kicker',
    'judul',
    'subjudul',
    'gambar_path',
    'cta_label',
    'cta_url',
    'urutan',
    'is_active',
])]
class SpmbBanner extends Model
{
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
}
