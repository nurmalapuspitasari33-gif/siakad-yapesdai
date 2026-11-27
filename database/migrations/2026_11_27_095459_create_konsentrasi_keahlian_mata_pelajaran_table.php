<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const TABLE = 'konsentrasi_keahlian_mata_pelajaran';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable(self::TABLE)) {
            $this->repairExistingTable();

            return;
        }

        Schema::create(self::TABLE, function (Blueprint $table) {
            $table->id();
            $table->foreignId('konsentrasi_keahlian_id');
            $table->foreignId('mata_pelajaran_id');
            $table->unsignedSmallInteger('urutan');
            $table->timestamps();

            $table->foreign('konsentrasi_keahlian_id', 'kons_mapel_konsentrasi_fk')
                ->references('id')
                ->on('konsentrasi_keahlians')
                ->cascadeOnDelete();
            $table->foreign('mata_pelajaran_id', 'kons_mapel_mapel_fk')
                ->references('id')
                ->on('mata_pelajarans')
                ->cascadeOnDelete();
            $table->unique(
                ['konsentrasi_keahlian_id', 'mata_pelajaran_id'],
                'konsentrasi_mapel_unique',
            );
            $table->index(
                ['konsentrasi_keahlian_id', 'urutan'],
                'konsentrasi_mapel_order_idx',
            );
        });
    }

    private function repairExistingTable(): void
    {
        $columns = [
            'id',
            'konsentrasi_keahlian_id',
            'mata_pelajaran_id',
            'urutan',
            'created_at',
            'updated_at',
        ];

        if (! Schema::hasColumns(self::TABLE, $columns)) {
            throw new RuntimeException(
                'The existing concentration-subject table has an unexpected schema; no data was changed.',
            );
        }

        $indexes = collect(Schema::getIndexes(self::TABLE));
        $foreignKeys = collect(Schema::getForeignKeys(self::TABLE));
        $hasUniqueIndex = $indexes->contains(
            fn (array $index): bool => $index['unique']
                && $index['columns'] === ['konsentrasi_keahlian_id', 'mata_pelajaran_id'],
        );
        $hasOrderIndex = $indexes->contains(
            fn (array $index): bool => ! $index['unique']
                && $index['columns'] === ['konsentrasi_keahlian_id', 'urutan'],
        );
        $hasConcentrationForeignKey = $foreignKeys->contains(
            fn (array $foreignKey): bool => $foreignKey['columns'] === ['konsentrasi_keahlian_id']
                && $foreignKey['foreign_table'] === 'konsentrasi_keahlians'
                && $foreignKey['foreign_columns'] === ['id']
                && strtolower($foreignKey['on_delete'] ?? '') === 'cascade',
        );
        $hasSubjectForeignKey = $foreignKeys->contains(
            fn (array $foreignKey): bool => $foreignKey['columns'] === ['mata_pelajaran_id']
                && $foreignKey['foreign_table'] === 'mata_pelajarans'
                && $foreignKey['foreign_columns'] === ['id']
                && strtolower($foreignKey['on_delete'] ?? '') === 'cascade',
        );

        if (! $hasUniqueIndex && DB::table(self::TABLE)
            ->select('konsentrasi_keahlian_id', 'mata_pelajaran_id')
            ->groupBy('konsentrasi_keahlian_id', 'mata_pelajaran_id')
            ->havingRaw('COUNT(*) > 1')
            ->exists()) {
            throw new RuntimeException(
                'The existing concentration-subject table contains duplicate mappings; no data was changed.',
            );
        }

        if (
            (! $hasConcentrationForeignKey && DB::table(self::TABLE.' as pivot')
                ->leftJoin(
                    'konsentrasi_keahlians as concentration',
                    'concentration.id',
                    '=',
                    'pivot.konsentrasi_keahlian_id',
                )
                ->whereNull('concentration.id')
                ->exists())
            || (! $hasSubjectForeignKey && DB::table(self::TABLE.' as pivot')
                ->leftJoin('mata_pelajarans as subject', 'subject.id', '=', 'pivot.mata_pelajaran_id')
                ->whereNull('subject.id')
                ->exists())
        ) {
            throw new RuntimeException(
                'The existing concentration-subject table contains orphaned mappings; no data was changed.',
            );
        }

        Schema::table(self::TABLE, function (Blueprint $table) use (
            $hasUniqueIndex,
            $hasOrderIndex,
            $hasConcentrationForeignKey,
            $hasSubjectForeignKey,
        ): void {
            if (! $hasUniqueIndex) {
                $table->unique(
                    ['konsentrasi_keahlian_id', 'mata_pelajaran_id'],
                    'konsentrasi_mapel_unique',
                );
            }

            if (! $hasOrderIndex) {
                $table->index(
                    ['konsentrasi_keahlian_id', 'urutan'],
                    'konsentrasi_mapel_order_idx',
                );
            }

            if (! $hasConcentrationForeignKey) {
                $table->foreign('konsentrasi_keahlian_id', 'kons_mapel_konsentrasi_fk')
                    ->references('id')
                    ->on('konsentrasi_keahlians')
                    ->cascadeOnDelete();
            }

            if (! $hasSubjectForeignKey) {
                $table->foreign('mata_pelajaran_id', 'kons_mapel_mapel_fk')
                    ->references('id')
                    ->on('mata_pelajarans')
                    ->cascadeOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists(self::TABLE);
    }
};
