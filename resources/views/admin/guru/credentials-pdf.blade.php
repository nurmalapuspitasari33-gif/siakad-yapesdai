<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <meta name="referrer" content="no-referrer">
    <title>Kredensial Akun Guru</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 12mm;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            background: #f1f5f9;
            color: #0f172a;
            font-family: Arial, sans-serif;
        }

        .toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            max-width: 1000px;
            margin: 24px auto 16px;
            padding: 0 24px;
        }

        .toolbar p {
            margin: 0;
            color: #475569;
            font-size: 14px;
            line-height: 1.5;
        }

        .toolbar button {
            flex-shrink: 0;
            border: 0;
            border-radius: 8px;
            padding: 11px 16px;
            background: #1e3a8a;
            color: #fff;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
        }

        .sheet {
            max-width: 1000px;
            margin: 0 auto 32px;
            padding: 32px;
            border: 1px solid #cbd5e1;
            background: #fff;
        }

        h1 {
            margin: 0;
            font-size: 22px;
            text-align: center;
        }

        .subtitle {
            margin: 8px 0 20px;
            color: #475569;
            font-size: 13px;
            text-align: center;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 11px;
        }

        thead {
            display: table-header-group;
        }

        th,
        td {
            border: 1px solid #94a3b8;
            padding: 7px 6px;
            text-align: left;
            vertical-align: top;
            overflow-wrap: anywhere;
        }

        th {
            background: #e2e8f0;
            font-weight: 700;
        }

        tr {
            break-inside: avoid;
        }

        .password {
            font-family: Consolas, monospace;
        }

        .notice {
            margin: 18px 0 0;
            color: #334155;
            font-size: 12px;
            line-height: 1.5;
        }

        @media print {
            body {
                background: #fff;
            }

            .toolbar {
                display: none;
            }

            .sheet {
                max-width: none;
                margin: 0;
                padding: 0;
                border: 0;
            }
        }
    </style>
    <script>
        window.addEventListener('load', () => {
            window.setTimeout(() => window.print(), 400);
        });
    </script>
</head>
<body>
    <div class="toolbar">
        <p>Semua kata sandi di bawah ini baru dibuat dan wajib diganti guru saat login pertama.</p>
        <button type="button" onclick="window.print()">Simpan ke PDF / Cetak</button>
    </div>

    <main class="sheet">
        <h1>Daftar Kredensial Akun Guru</h1>
        <p class="subtitle">Dibuat {{ now()->format('d-m-Y H:i') }} · {{ count($credentials) }} akun</p>

        <table>
            <thead>
                <tr>
                    <th style="width: 7%">No.</th>
                    <th style="width: 15%">NIKY</th>
                    <th style="width: 27%">Nama Guru</th>
                    <th style="width: 25%">Username</th>
                    <th style="width: 26%">Password Sementara</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($credentials as $index => $credential)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>{{ $credential['nip'] }}</td>
                        <td>{{ $credential['name'] }}</td>
                        <td>{{ $credential['username'] }}</td>
                        <td class="password">{{ $credential['password'] }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5">Belum ada akun guru untuk dicetak.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <p class="notice">
            Dokumen ini berisi password sementara. Bagikan langsung kepada guru yang bersangkutan dan simpan dengan aman.
            Semua akun diwajibkan mengganti password saat login pertama.
        </p>
    </main>
</body>
</html>
