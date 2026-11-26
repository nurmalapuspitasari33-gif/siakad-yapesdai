<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['pendaftaran_spmb_id', 'path', 'caption', 'sort_order'])]
class PendaftaranSpmbBerkas extends Model
{
    public function pendaftaranSpmb(): BelongsTo
    {
        return $this->belongsTo(PendaftaranSpmb::class);
    }
}
