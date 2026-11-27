<?php

use App\Support\TeacherUsername;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $teacherAccounts = DB::table('users')
            ->leftJoin('gurus', 'gurus.user_id', '=', 'users.id')
            ->where('users.role', 'guru')
            ->orderBy('users.id')
            ->get(['users.id', 'users.name', 'gurus.nama_lengkap']);
        $teacherUserIds = $teacherAccounts->pluck('id')->all();

        if ($teacherUserIds === []) {
            return;
        }

        $usedUsernames = DB::table('users')
            ->whereNotIn('id', $teacherUserIds)
            ->whereNotNull('username')
            ->pluck('username')
            ->mapWithKeys(fn (string $username): array => [mb_strtolower($username) => true])
            ->all();

        DB::transaction(function () use ($teacherAccounts, $teacherUserIds, $usedUsernames): void {
            DB::table('users')
                ->whereIn('id', $teacherUserIds)
                ->update(['username' => null]);

            foreach ($teacherAccounts as $teacherAccount) {
                $name = trim((string) ($teacherAccount->nama_lengkap ?: $teacherAccount->name));
                $baseUsername = TeacherUsername::baseFromName($name);
                $username = $baseUsername;
                $suffix = 2;

                while (isset($usedUsernames[mb_strtolower($username)])) {
                    $suffixText = (string) $suffix++;
                    $username = substr($baseUsername, 0, 254 - strlen($suffixText)).'.'.$suffixText;
                }

                DB::table('users')
                    ->where('id', $teacherAccount->id)
                    ->update(['username' => $username]);
                $usedUsernames[mb_strtolower($username)] = true;
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        throw new LogicException('Teacher usernames are intentionally retained when rolling this migration back.');
    }
};
