<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'nama_ekstra',
    'is_aktif',
])]
class Ekstrakurikuler extends Model
{
    protected function casts(): array
    {
        return [
            'is_aktif' => 'boolean',
        ];
    }
}
