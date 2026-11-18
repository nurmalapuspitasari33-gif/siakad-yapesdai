import DashboardLayout from '@/Layouts/DashboardLayout';
import roleNavigationItems from '@/Components/RoleNavigationItems';
import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

function readStoredAttempt(attemptId, serverAnswers, questionIds) {
    const validIds = new Set(questionIds.map(String));
    const serverAnswerMap = serverAnswers && typeof serverAnswers === 'object' && !Array.isArray(serverAnswers)
        ? Object.fromEntries(Object.entries(serverAnswers).filter(([id, answer]) => validIds.has(String(id)) && isValidAnswer(answer)))
        : {};
    const stored = { answers: serverAnswerMap, order: questionIds };
    const storageKey = `siakad-ujian-${attemptId}`;
    let value;

    try {
        value = localStorage.getItem(storageKey);
    } catch {
        return stored;
    }

    if (!value) {
        return stored;
    }

    let parsed;

    try {
        parsed = JSON.parse(value);
    } catch {
        try {
            localStorage.removeItem(storageKey);
        } catch {
            return stored;
        }

        return stored;
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return stored;
    }

    const order = Array.isArray(parsed.order)
        ? parsed.order.filter((id) => validIds.has(String(id))).map(String)
        : [];
    const orderWithNewQuestions = [
        ...order,
        ...questionIds.map(String).filter((id) => !order.includes(id)),
    ];
    const storedAnswers = parsed.answers && typeof parsed.answers === 'object' && !Array.isArray(parsed.answers)
        ? parsed.answers
        : {};
    const answers = Object.fromEntries(
        Object.entries(storedAnswers).filter(([id, answer]) =>
            validIds.has(String(id)) && isValidAnswer(answer),
        ),
    );

    return {
        answers: { ...serverAnswerMap, ...answers },
        order: orderWithNewQuestions,
    };
}

function isValidAnswer(answer) {
    return typeof answer === 'string'
        || (Array.isArray(answer) && answer.every((value) => typeof value === 'string' || typeof value === 'number'))
        || (answer && typeof answer === 'object' && !Array.isArray(answer)
            && Object.values(answer).every((value) => typeof value === 'string' || typeof value === 'number'));
}

function formatRemaining(seconds) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remainingSeconds = (seconds % 60).toString().padStart(2, '0');

    return `${minutes}:${remainingSeconds}`;
}

export default function SiswaUjianShow({ ujian, attempt, questions = [] }) {
    const storageKey = `siakad-ujian-${attempt.id}`;
    const questionIds = questions.map((question) => String(question.id));
    const [storedAttempt] = useState(() => readStoredAttempt(attempt.id, attempt.jawaban, questionIds));
    const [answers, setAnswers] = useState(storedAttempt.answers);
    const [questionOrder] = useState(storedAttempt.order);
    const [activeQuestionId, setActiveQuestionId] = useState(questionOrder[0] ?? null);
    const [remainingSeconds, setRemainingSeconds] = useState(() =>
        Math.max(0, Math.ceil((new Date(ujian.ends_at).getTime() - Date.now()) / 1000)),
    );
    const [pendingSaves, setPendingSaves] = useState(0);
    const [saveError, setSaveError] = useState('');
    const [isFinishing, setIsFinishing] = useState(false);
    const [violationCount, setViolationCount] = useState(attempt.jumlah_pelanggaran ?? 0);
    const [showViolationWarning, setShowViolationWarning] = useState(false);
    const [violationError, setViolationError] = useState('');
    const [zoomImage, setZoomImage] = useState(null);
    const saveQueues = useRef(new Map());
    const finishStarted = useRef(false);
    const violationInFlight = useRef(false);
    const awayStateReported = useRef(false);
    const serverAutoFinished = useRef(false);
    const wakeLockRef = useRef(null);
    const maxViolations = Math.max(1, Number(ujian.maks_pelanggaran ?? 3));
    const fullscreenSupported = Boolean(
        document.documentElement.requestFullscreen
        || document.documentElement.webkitRequestFullscreen,
    );
    const isFullscreen = () => Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    const questionById = new Map(questions.map((question) => [String(question.id), question]));
    const orderedQuestions = questionOrder
        .map((id) => questionById.get(String(id)))
        .filter(Boolean);
    const activeQuestion = questionById.get(String(activeQuestionId));
    const selectedIndex = orderedQuestions.findIndex((question) => question.id === activeQuestion?.id);

    const saveAnswer = (questionId, answer) => {
        const key = String(questionId);
        const previous = saveQueues.current.get(key) ?? Promise.resolve();
        setPendingSaves((count) => count + 1);
        setSaveError('');

        const next = previous.catch(() => {}).then(async () => {
            const response = await fetch(route('siswa.ujian.save-answer', ujian.id), {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ question_id: questionId, answer }),
            });

            if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
                throw new Error('Jawaban belum tersimpan ke server. Periksa koneksi lalu pilih kembali jawaban.');
            }
        });

        saveQueues.current.set(key, next);
        next.catch((error) => setSaveError(
            error instanceof Error ? error.message : 'Jawaban belum tersimpan ke server. Periksa koneksi.',
        )).finally(() => {
            setPendingSaves((count) => Math.max(0, count - 1));
            if (saveQueues.current.get(key) === next) {
                saveQueues.current.delete(key);
            }
        });

        return next;
    };

    const finishExam = async () => {
        if (finishStarted.current || attempt.status === 'selesai') {
            return;
        }

        finishStarted.current = true;
        setIsFinishing(true);

        try {
            if (!serverAutoFinished.current) {
                try {
                    await Promise.all([...saveQueues.current.values()]);
                } catch (error) {
                    if (remainingSeconds > 0) {
                        throw error;
                    }
                }
            }

            router.post(route('siswa.ujian.finish', ujian.id), { jawaban: answers }, {
                preserveScroll: true,
                onSuccess: () => {
                    if (document.fullscreenElement && document.exitFullscreen) {
                        document.exitFullscreen().catch(() => undefined);
                    } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    }
                    try {
                        localStorage.removeItem(storageKey);
                    } catch {
                        setSaveError('Ujian selesai, tetapi salinan jawaban lokal tidak dapat dihapus.');
                    }
                },
                onError: () => {
                    finishStarted.current = false;
                    setIsFinishing(false);
                },
                onFinish: () => setIsFinishing(false),
            });
        } catch {
            finishStarted.current = false;
            setIsFinishing(false);
            setSaveError('Ada jawaban yang belum tersimpan. Periksa koneksi sebelum menyelesaikan ujian.');
        }
    };

    const finishRef = useRef(finishExam);
    finishRef.current = finishExam;

    const reportViolation = async (reason) => {
        if (attempt.status === 'selesai' || awayStateReported.current || violationInFlight.current) {
            return;
        }

        awayStateReported.current = true;
        violationInFlight.current = true;
        setShowViolationWarning(true);
        setViolationError('');

        try {
            const response = await fetch(route('siswa.ujian.violation', ujian.id), {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ reason }),
            });

            if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
                throw new Error('Pelanggaran belum tercatat. Periksa koneksi sebelum melanjutkan.');
            }

            const result = await response.json();
            setViolationCount(result.jumlah_pelanggaran);

            if (result.finished || result.jumlah_pelanggaran >= result.maks_pelanggaran) {
                serverAutoFinished.current = true;
                finishRef.current();
            }
        } catch (error) {
            setViolationError(error instanceof Error ? error.message : 'Pelanggaran belum tercatat. Periksa koneksi.');
        } finally {
            violationInFlight.current = false;
        }
    };

    const returnToFullscreen = async () => {
        const root = document.documentElement;
        const requestFullscreen = root.requestFullscreen ?? root.webkitRequestFullscreen;

        if (typeof requestFullscreen === 'function') {
            try {
                await requestFullscreen.call(root);
            } catch {
                setViolationError('Mode layar penuh tidak dapat diaktifkan. Gunakan tombol layar penuh browser lalu lanjutkan.');
            }
        }
    };

    const chooseAnswer = (questionId, answer) => {
        const questionKey = String(questionId);
        const nextAnswers = { ...answers };

        if (answer === null || answer === undefined || answer === '') {
            delete nextAnswers[questionKey];
        } else {
            nextAnswers[questionKey] = answer;
        }

        setAnswers(nextAnswers);
        saveAnswer(questionId, answer === '' ? null : answer ?? null);
    };

    useEffect(() => {
        if (attempt.status === 'selesai') {
            return undefined;
        }

        const updateTimer = () => {
            setRemainingSeconds(Math.max(0, Math.ceil((new Date(ujian.ends_at).getTime() - Date.now()) / 1000)));
        };
        updateTimer();
        const interval = window.setInterval(updateTimer, 1000);

        return () => window.clearInterval(interval);
    }, [attempt.status, ujian.ends_at]);

    useEffect(() => {
        if (attempt.status === 'selesai') {
            return;
        }

        try {
            localStorage.setItem(storageKey, JSON.stringify({
                answers,
                order: questionOrder,
            }));
        } catch {
            setSaveError('Penyimpanan lokal tidak tersedia. Pastikan jawaban berstatus tersimpan sebelum menutup halaman.');
        }
    }, [answers, attempt.status, questionOrder, storageKey]);

    useEffect(() => {
        if (attempt.status !== 'selesai') {
            Object.entries(answers).forEach(([questionId, answer]) => {
                saveAnswer(Number(questionId), answer);
            });
        }
    }, []);

    useEffect(() => {
        if (remainingSeconds === 0 && attempt.status !== 'selesai') {
            finishRef.current();
        }
    }, [attempt.status, remainingSeconds]);

    useEffect(() => {
        if (attempt.status === 'selesai') {
            if (document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen().catch(() => undefined);
            } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }

            return undefined;
        }

        const clearAwayWarning = () => {
            if (
                !document.hidden
                && document.hasFocus()
                && (!fullscreenSupported || isFullscreen())
            ) {
                awayStateReported.current = false;
                setShowViolationWarning(false);
                setViolationError('');
            }
        };
        const onFullscreenChange = () => {
            if (fullscreenSupported && !isFullscreen()) {
                reportViolation('fullscreen');
                return;
            }

            clearAwayWarning();
        };
        const onVisibilityChange = () => {
            if (document.hidden) {
                reportViolation('visibility');
                return;
            }

            clearAwayWarning();
        };
        const onWindowBlur = () => reportViolation('blur');
        const onWindowFocus = () => clearAwayWarning();
        const preventContextMenu = (event) => event.preventDefault();
        const preventSelection = (event) => event.preventDefault();
        const preventShortcuts = (event) => {
            const key = event.key.toLowerCase();
            const modifier = event.ctrlKey || event.metaKey;

            if (
                (modifier && ['c', 'v', 'u'].includes(key))
                || key === 'f12'
            ) {
                event.preventDefault();
                event.stopPropagation();
            }
        };

        document.addEventListener('fullscreenchange', onFullscreenChange);
        document.addEventListener('webkitfullscreenchange', onFullscreenChange);
        document.addEventListener('visibilitychange', onVisibilityChange);
        document.addEventListener('contextmenu', preventContextMenu);
        document.addEventListener('selectstart', preventSelection);
        window.addEventListener('blur', onWindowBlur);
        window.addEventListener('focus', onWindowFocus);
        window.addEventListener('keydown', preventShortcuts);

        if (fullscreenSupported && !isFullscreen()) {
            reportViolation('fullscreen');
        }

        return () => {
            document.removeEventListener('fullscreenchange', onFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            document.removeEventListener('contextmenu', preventContextMenu);
            document.removeEventListener('selectstart', preventSelection);
            window.removeEventListener('blur', onWindowBlur);
            window.removeEventListener('focus', onWindowFocus);
            window.removeEventListener('keydown', preventShortcuts);
        };
    }, [attempt.status, fullscreenSupported, ujian.id]);

    useEffect(() => {
        if (attempt.status === 'selesai' || !navigator.wakeLock?.request) {
            return undefined;
        }

        let active = true;
        navigator.wakeLock.request('screen').then((wakeLock) => {
            if (!active) {
                wakeLock.release();
                return;
            }

            wakeLockRef.current = wakeLock;
        }).catch(() => {
            setViolationError('Perangkat tidak mendukung kunci layar aktif; pastikan layar tetap menyala.');
        });

        return () => {
            active = false;
            wakeLockRef.current?.release();
            wakeLockRef.current = null;
        };
    }, [attempt.status]);

    const navigation = roleNavigationItems('siswa', 'ujian');
    const currentQuestionAnswer = activeQuestion ? answers[String(activeQuestion.id)] : null;
    const renderAnswerInput = () => {
        if (!activeQuestion) {
            return null;
        }

        if (activeQuestion.tipe_soal === 'isian_singkat') {
            return (
                <input
                    type="text"
                    value={currentQuestionAnswer ?? ''}
                    onChange={(event) => chooseAnswer(activeQuestion.id, event.target.value)}
                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    aria-label="Jawaban singkat"
                />
            );
        }

        if (activeQuestion.tipe_soal === 'esai') {
            return (
                <textarea
                    rows="8"
                    value={currentQuestionAnswer ?? ''}
                    onChange={(event) => chooseAnswer(activeQuestion.id, event.target.value)}
                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    aria-label="Jawaban esai"
                />
            );
        }

        if (activeQuestion.tipe_soal === 'menjodohkan') {
            const matchingAnswer = currentQuestionAnswer && typeof currentQuestionAnswer === 'object'
                ? currentQuestionAnswer
                : {};
            const left = activeQuestion.opsi_json?.pasangan_kiri ?? [];
            const right = activeQuestion.opsi_json?.pasangan_kanan ?? [];

            return (
                <div className="flex flex-col gap-3">
                    {left.map((label, index) => (
                        <label key={index} className="grid grid-cols-1 items-center gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
                            <span className="text-sm text-slate-700">{label}</span>
                            <select
                                value={matchingAnswer[String(index)] ?? ''}
                                onChange={(event) => chooseAnswer(activeQuestion.id, {
                                    ...matchingAnswer,
                                    [String(index)]: event.target.value,
                                })}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">Pilih pasangan</option>
                                {right.map((option, rightIndex) => (
                                    <option key={rightIndex} value={String(rightIndex)}>{option}</option>
                                ))}
                            </select>
                        </label>
                    ))}
                </div>
            );
        }

        const complex = activeQuestion.tipe_soal === 'pg_kompleks';
        const selected = Array.isArray(currentQuestionAnswer) ? currentQuestionAnswer.map(String) : [];

        return (
            <div className="mt-6 flex flex-col gap-3">
                {Object.entries(activeQuestion.opsi ?? {}).map(([option, label]) => {
                    const selectedOption = complex
                        ? selected.includes(String(option))
                        : currentQuestionAnswer === option;
                    const imageKey = complex
                        ? String.fromCharCode(65 + Number(option))
                        : option;
                    const image = activeQuestion.gambar_opsi?.[imageKey];

                    return (
                        <label
                            key={option}
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                                selectedOption
                                    ? 'border-indigo-300 bg-indigo-50'
                                    : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                            }`}
                        >
                            <input
                                type={complex ? 'checkbox' : 'radio'}
                                name={`jawaban-${activeQuestion.id}`}
                                value={option}
                                checked={selectedOption}
                                onChange={() => {
                                    if (!complex) {
                                        chooseAnswer(activeQuestion.id, option);
                                        return;
                                    }

                                    const next = selectedOption
                                        ? selected.filter((item) => item !== String(option))
                                        : [...selected, String(option)];
                                    chooseAnswer(activeQuestion.id, next);
                                }}
                                className="mt-0.5 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-semibold text-slate-700">
                                {complex ? Number(option) + 1 : `${option}.`}
                            </span>
                            <span className="flex flex-col gap-2 text-sm leading-6 text-slate-700">
                                <span className="whitespace-pre-wrap">{label}</span>
                                {image && (
                                    <img
                                        src={image}
                                        alt={`Gambar opsi ${imageKey}`}
                                        onClick={(event) => {
                                            event.preventDefault();
                                            setZoomImage(image);
                                        }}
                                        className="max-h-36 w-fit cursor-zoom-in rounded-lg object-contain"
                                    />
                                )}
                            </span>
                        </label>
                    );
                })}
            </div>
        );
    };

    return (
        <DashboardLayout
            title={ujian.judul_ujian}
            subtitle={`${ujian.mata_pelajaran} · Durasi ${ujian.durasi_menit} menit`}
            roleLabel="Siswa"
            navigation={navigation}
        >
            <Head title={ujian.judul_ujian} />

            {attempt.status === 'selesai' ? (
                <section className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-white p-7 text-center shadow-sm sm:p-10">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-700" aria-hidden="true">✓</span>
                    <h2 className="mt-5 text-xl font-bold text-slate-900">Ujian selesai</h2>
                    <p className="mt-2 text-sm text-slate-500">Jawaban Anda sudah dinilai secara otomatis.</p>
                    <p className="mt-6 text-4xl font-bold text-emerald-700">{Number(attempt.skor_akhir ?? 0).toFixed(2)}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Nilai akhir</p>
                    <a href={route('siswa.ujian.index')} className="mt-7 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
                        Kembali ke daftar ujian
                    </a>
                </section>
            ) : (
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 sm:flex-row sm:items-center">
                        <div>
                            <p className="text-sm font-semibold text-indigo-950">Waktu tersisa</p>
                            <p className="mt-1 text-xs text-indigo-700">Jawaban tersimpan otomatis saat dipilih.</p>
                            <p className="mt-1 text-xs text-indigo-700">Pelanggaran layar: {violationCount}/{maxViolations}</p>
                        </div>
                        <div className={`font-mono text-2xl font-bold tabular-nums ${remainingSeconds < 300 ? 'text-rose-700' : 'text-indigo-700'}`} aria-live="polite">
                            {formatRemaining(remainingSeconds)}
                        </div>
                    </div>

                    {saveError && (
                        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                            {saveError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_250px]">
                        <section className="min-w-0 select-none rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                            {activeQuestion ? (
                                <>
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                                            Soal {selectedIndex + 1} dari {orderedQuestions.length}
                                        </p>
                                        <span className="text-xs text-slate-500" aria-live="polite">
                                            {pendingSaves > 0 ? 'Menyimpan...' : 'Tersimpan'}
                                        </span>
                                    </div>
                                    <h2 className="mt-4 whitespace-pre-wrap text-base font-semibold leading-7 text-slate-900">
                                        {activeQuestion.pertanyaan}
                                    </h2>
                                    {activeQuestion.gambar_soal && (
                                        <img
                                            src={activeQuestion.gambar_soal}
                                            alt="Gambar soal"
                                            onClick={() => setZoomImage(activeQuestion.gambar_soal)}
                                            className="mt-5 max-h-80 cursor-zoom-in rounded-xl object-contain"
                                        />
                                    )}
                                    {renderAnswerInput()}
                                    <div className="mt-7 flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-5">
                                        <button
                                            type="button"
                                            disabled={selectedIndex <= 0}
                                            onClick={() => setActiveQuestionId(orderedQuestions[selectedIndex - 1]?.id)}
                                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Sebelumnya
                                        </button>
                                        <button
                                            type="button"
                                            disabled={selectedIndex >= orderedQuestions.length - 1}
                                            onClick={() => setActiveQuestionId(orderedQuestions[selectedIndex + 1]?.id)}
                                            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Soal Berikutnya
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <p className="py-12 text-center text-sm text-slate-500">Soal ujian tidak tersedia.</p>
                            )}
                        </section>

                        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
                            <h2 className="font-bold text-slate-900">Navigasi Soal</h2>
                            <p className="mt-1 text-xs text-slate-500">Klik nomor untuk berpindah soal.</p>
                            <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-4">
                                {orderedQuestions.map((question, index) => {
                                    const answer = answers[String(question.id)];
                                    const answered = Array.isArray(answer)
                                        ? answer.length > 0
                                        : answer && typeof answer === 'object'
                                          ? Object.keys(answer).length > 0
                                          : Boolean(answer);
                                    const active = question.id === activeQuestion?.id;

                                    return (
                                        <button
                                            key={question.id}
                                            type="button"
                                            onClick={() => setActiveQuestionId(question.id)}
                                            aria-label={`Buka soal ${index + 1}${answered ? ', sudah dijawab' : ', belum dijawab'}`}
                                            aria-current={active ? 'step' : undefined}
                                            className={`flex h-10 items-center justify-center rounded-lg border text-sm font-semibold transition ${
                                                active
                                                    ? 'border-indigo-600 bg-indigo-600 text-white'
                                                    : answered
                                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
                                            }`}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
                                <span>Terjawab</span>
                                <span className="font-semibold text-slate-800">{Object.keys(answers).length}/{questions.length}</span>
                            </div>
                            <button
                                type="button"
                                onClick={finishExam}
                                disabled={isFinishing || pendingSaves > 0 || remainingSeconds === 0}
                                className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isFinishing ? 'Menyelesaikan...' : 'Selesai Ujian'}
                            </button>
                            <p className="mt-3 text-center text-xs leading-5 text-slate-500">
                                Nilai dihitung otomatis dari jawaban benar.
                            </p>
                        </aside>
                    </div>
                </div>
            )}
            {violationError && (
                <div role="alert" className="fixed bottom-4 left-4 right-4 z-40 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-lg sm:left-auto sm:max-w-md">
                    {violationError}
                </div>
            )}
            {showViolationWarning && (
                <div
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="violation-warning-title"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-5 text-center text-white"
                >
                    <div className="flex w-full max-w-lg flex-col items-center gap-4">
                        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20 text-3xl text-amber-300" aria-hidden="true">!</span>
                        <h2 id="violation-warning-title" className="text-2xl font-bold">Jangan tinggalkan ujian</h2>
                        <p className="text-sm leading-6 text-slate-200">
                            Pelanggaran tercatat {violationCount} dari {maxViolations}. Jika batas tercapai, ujian akan diselesaikan otomatis.
                        </p>
                        {violationError && <p role="alert" className="text-sm text-rose-300">{violationError}</p>}
                        <button
                            type="button"
                            onClick={returnToFullscreen}
                            className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-400"
                        >
                            Kembali ke Layar Penuh
                        </button>
                    </div>
                </div>
            )}
            {zoomImage && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Perbesar gambar"
                    onClick={() => setZoomImage(null)}
                    className="fixed inset-0 z-[60] flex cursor-zoom-out items-center justify-center bg-slate-950/90 p-5"
                >
                    <button type="button" onClick={() => setZoomImage(null)} className="absolute right-5 top-5 rounded-full bg-white px-3 py-1 text-xl font-bold text-slate-900" aria-label="Tutup gambar">×</button>
                    <img src={zoomImage} alt="Gambar soal diperbesar" className="max-h-full max-w-full object-contain" />
                </div>
            )}
        </DashboardLayout>
    );
}
