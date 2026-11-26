const verifiedStatuses = ['diterima', 'terverifikasi', 'verified', 'valid', 'approved'];
const correctionStatuses = ['perlu_perbaikan', 'revisi', 'revision_requested'];

export default function SpmbVerificationBadge({ status = 'pending' }) {
    const normalizedStatus = String(status).toLowerCase().replace(/[\s-]+/g, '_');
    const isVerified = verifiedStatuses.includes(normalizedStatus);
    const needsCorrection = correctionStatuses.includes(normalizedStatus);
    const label = isVerified
        ? 'Berkas terverifikasi'
        : needsCorrection
            ? 'Perlu perbaikan'
            : normalizedStatus === 'ditolak'
                ? 'Tidak diterima'
                : 'Menunggu verifikasi';
    const colorClasses = isVerified
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
        : needsCorrection || normalizedStatus === 'ditolak'
            ? 'border-rose-200 bg-rose-50 text-rose-800'
            : 'border-amber-200 bg-amber-50 text-amber-800';

    return (
        <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${colorClasses}`}>
            {label}
        </span>
    );
}
