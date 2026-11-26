export default function roleNavigationItems(role, activeItem, options = {}) {
    const adminItems = [
        { id: 'dashboard', label: 'Ringkasan', sectionTitle: 'Utama', href: route('admin.dashboard') },
        { id: 'tahun-ajaran', label: 'Tahun Ajaran', sectionTitle: 'Data Master', href: route('admin.tahun-ajaran.index') },
        { id: 'kelas', label: 'Kelas', href: route('admin.kelas.index') },
        { id: 'mata-pelajaran', label: 'Mata Pelajaran', href: route('admin.mapel.index') },
        { id: 'guru', label: 'Data Guru', href: route('admin.guru.index') },
        { id: 'siswa', label: 'Data Siswa', href: route('admin.siswa.index') },
        { id: 'jadwal', label: 'Jadwal Pelajaran', sectionTitle: 'Akademik & Ujian', href: route('admin.jadwal.index') },
        { id: 'ujian', label: 'Monitoring Ujian', href: route('admin.ujian.index') },
        { id: 'hasil-ujian', label: 'Hasil Ujian', href: route('admin.hasil-ujian.index') },
        { id: 'spmb', label: 'Pendaftaran SPMB', sectionTitle: 'SPMB & Keuangan', href: route('admin.spmb.index') },
        { id: 'spmb-cms', label: 'Gelombang & Konten SPMB', href: route('admin.spmb-cms.index') },
        { id: 'beasiswa', label: 'Kategori Beasiswa', href: route('admin.beasiswa.index') },
        { id: 'tagihan', label: 'Tagihan', href: route('admin.tagihan.index') },
        { id: 'laporan', label: 'Laporan', href: route('admin.laporan.index') },
        { id: 'pengaturan', label: 'Pengaturan Sekolah', sectionTitle: 'Sistem', href: route('admin.pengaturan.index') },
    ];
    const guruItems = [
        { id: 'dashboard', label: 'Ringkasan', href: route('guru.dashboard') },
        { id: 'jadwal', label: 'Jadwal Mengajar', href: route('guru.jadwal.index') },
        { id: 'nilai', label: 'Input Nilai', href: route('guru.nilai.index') },
        { id: 'ujian', label: 'Ujian & Bank Soal', href: route('guru.ujian.index') },
        { id: 'hasil-ujian', label: 'Hasil Ujian', href: route('guru.hasil-ujian.index') },
        { id: 'rapor-wali', label: 'Rapor Kelas Wali', href: route('guru.rapor-wali.index') },
    ];
    const siswaItems = options.isCandidate
        ? [
              { id: 'dashboard', label: 'Ringkasan', href: route('siswa.dashboard') },
              { id: 'spmb', label: 'Formulir SPMB', href: route('siswa.spmb.index') },
          ]
        : [
              { id: 'dashboard', label: 'Ringkasan', href: route('siswa.dashboard') },
              { id: 'jadwal', label: 'Jadwal Pelajaran', href: route('siswa.jadwal.index') },
              { id: 'presensi', label: 'Riwayat Kehadiran', href: route('siswa.presensi.index') },
              { id: 'tagihan', label: 'Tagihan Sekolah', href: route('siswa.tagihan.index') },
              { id: 'ujian', label: 'Ujian Online', href: route('siswa.ujian.index') },
              { id: 'rapor', label: 'Rapor', href: route('siswa.rapor.index') },
          ];
    const roleItems = {
        admin: adminItems,
        guru: guruItems
            .filter((item) => item.id !== 'rapor-wali' || options.isWaliKelas)
            .map((item) => item.id === 'rapor-wali'
                ? { ...item, badge: options.waliKelasName }
                : item),
        siswa: siswaItems,
    };

    return (roleItems[role] ?? []).map((item) => ({
        ...item,
        isRoute: true,
        active: item.id === activeItem,
    }));
}
