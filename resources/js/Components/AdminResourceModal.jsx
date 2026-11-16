import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';

export function AdminResourceModal({
    show,
    title,
    description,
    processing,
    submitLabel,
    processingLabel = 'Menyimpan...',
    onClose,
    onSubmit,
    children,
    maxWidth = 'lg',
    panelClassName = '',
}) {
    return (
        <Modal
            show={show}
            onClose={onClose}
            maxWidth={maxWidth}
            labelledBy="admin-resource-modal-title"
            panelClassName={panelClassName}
        >
            <form onSubmit={onSubmit} className="flex max-h-[90vh] flex-col">
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                    <div>
                        <h2
                            id="admin-resource-modal-title"
                            className="text-lg font-bold text-slate-900"
                        >
                            {title}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">{description}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Tutup dialog"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        ×
                    </button>
                </div>

                <div className="flex max-h-[calc(90vh-140px)] flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
                    {children}
                </div>

                <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                    <SecondaryButton
                        onClick={onClose}
                        className="justify-center rounded-xl px-5 py-2.5 text-xs"
                    >
                        Batal
                    </SecondaryButton>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing ? processingLabel : submitLabel}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export function AdminDeleteModal({
    show,
    title,
    description,
    processing,
    confirmLabel = 'Ya, hapus',
    onClose,
    onConfirm,
}) {
    return (
        <Modal
            show={show}
            onClose={onClose}
            maxWidth="md"
            labelledBy="admin-delete-modal-title"
        >
            <div className="p-6">
                <h2 id="admin-delete-modal-title" className="text-lg font-bold text-slate-900">
                    {title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <SecondaryButton
                        onClick={onClose}
                        className="justify-center rounded-xl px-5 py-2.5 text-xs"
                    >
                        Batal
                    </SecondaryButton>
                    <button
                        type="button"
                        disabled={processing}
                        onClick={onConfirm}
                        className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing ? 'Memproses...' : confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
