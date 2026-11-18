<?php
// Ganti token di bawah ini dengan kode rahasia Anda sendiri
$secretToken = 'yapesdai_deploy_2026_rahasia';

if (($_GET['token'] ?? '') !== $secretToken) {
    http_response_code(403);
    exit('Akses ditolak');
}

$commands = [
    'cd /home/yaps5718/repositories/siakad-yapesdai && git pull origin main',
    '/usr/bin/rsync -av --exclude=".git" --exclude=".env" --exclude="vendor" --exclude="storage" /home/yaps5718/repositories/siakad-yapesdai/ /home/yaps5718/repos/siakad-yapesdai/',
    'cd /home/yaps5718/repos/siakad-yapesdai && php artisan optimize:clear'
];

$output = '';
foreach ($commands as $cmd) {
    $output .= "$ $cmd\n" . shell_exec($cmd . ' 2>&1') . "\n";
}

echo "<pre>$output</pre>";