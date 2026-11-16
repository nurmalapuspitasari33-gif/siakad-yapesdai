import InputError from '@/Components/InputError';
import { useForm } from '@inertiajs/react';

export default function ExcelImportPanel({
    templateUrl,
    importUrl,
    title = 'Template dan Impor Excel',
    description = 'Gunakan template .xlsx agar urutan kolom sesuai.',
    locked = false,
}) {
    const form = useForm({ file: null });

    const submit = (event) => {
        event.preventDefault();

        if (!form.data.file) {
            form.setError('file', 'Pilih file .xlsx terlebih dahulu.');

            return;
        }

        form.post(importUrl, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                <a
                    href={templateUrl}
                    className="mt-2 inline-flex text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                >
                    Download Template Excel (.xlsx)
                </a>
            </div>
            <form onSubmit={submit} className="flex w-full flex-col gap-2 sm:max-w-md">
                <input
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={(event) => {
                        form.clearErrors('file');
                        form.setData('file', event.target.files?.[0] ?? null);
                    }}
                    disabled={locked || form.processing}
                    className="block w-full rounded-lg border border-slate-300 bg-white text-xs text-slate-600 file:mr-3 file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-indigo-700"
                />
                <InputError message={form.errors.file} />
                <button
                    type="submit"
                    disabled={locked || form.processing}
                    className="self-end rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {form.processing ? 'Mengimpor...' : 'Import Excel'}
                </button>
            </form>
        </section>
    );
}
