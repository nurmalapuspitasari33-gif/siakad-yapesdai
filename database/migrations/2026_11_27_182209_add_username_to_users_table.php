<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable();
        });

        $usedUsernames = [];

        foreach (DB::table('users')->where('role', 'guru')->orderBy('id')->get(['id', 'name', 'password']) as $user) {
            $baseUsername = rtrim(substr(Str::slug($user->name, '.'), 0, 240), '.');
            $baseUsername = $baseUsername === '' ? 'guru' : $baseUsername;

            if (preg_match('/^\d{16}$/D', $baseUsername) === 1) {
                $baseUsername = 'guru.'.$baseUsername;
            }

            $username = $baseUsername;
            $suffix = 2;

            while (isset($usedUsernames[$username])) {
                $suffixText = (string) $suffix++;
                $username = substr($baseUsername, 0, 254 - strlen($suffixText)).'.'.$suffixText;
            }

            $userData = ['username' => $username];

            if (Hash::check('password', $user->password)) {
                $userData['must_change_password'] = true;
            }

            DB::table('users')->where('id', $user->id)->update($userData);
            $usedUsernames[$username] = true;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->unique('username');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropColumn('username');
        });
    }
};
