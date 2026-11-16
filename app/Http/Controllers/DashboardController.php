<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): RedirectResponse
    {
        $route = match ($request->user()->role) {
            'admin' => 'admin.dashboard',
            'guru' => 'guru.dashboard',
            'siswa' => 'siswa.dashboard',
            default => abort(403),
        };

        return redirect()->route($route);
    }
}
