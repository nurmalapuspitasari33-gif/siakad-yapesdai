<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ekstrakurikuler;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EkstrakurikulerController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->rules());

        Ekstrakurikuler::create($validated);

        return to_route('admin.mapel.index', ['tab' => 'ekstrakurikuler'])
            ->with('success', 'Ekstrakurikuler berhasil ditambahkan.');
    }

    public function update(Request $request, Ekstrakurikuler $ekstrakurikuler): RedirectResponse
    {
        $validated = $request->validate($this->rules($ekstrakurikuler));

        $ekstrakurikuler->update($validated);

        return to_route('admin.mapel.index', ['tab' => 'ekstrakurikuler'])
            ->with('success', 'Ekstrakurikuler berhasil diperbarui.');
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function rules(?Ekstrakurikuler $ekstrakurikuler = null): array
    {
        return [
            'nama_ekstra' => [
                'required',
                'string',
                'max:255',
                Rule::unique('ekstrakurikulers', 'nama_ekstra')->ignore($ekstrakurikuler),
            ],
            'is_aktif' => ['required', 'boolean'],
        ];
    }
}
