<!DOCTYPE html>
<html lang="id">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="@yield('description')">
        <link rel="icon" type="image/png" href="{{ asset('yapesdai.png') }}">
        <title>@yield('title') — YAPESDAI</title>
        <style>
            * {
                box-sizing: border-box;
            }

            body {
                display: flex;
                min-height: 100vh;
                align-items: center;
                justify-content: center;
                margin: 0;
                padding: 24px;
                background: #0B2C59;
                font-family: Arial, sans-serif;
            }

            main {
                width: min(100%, 560px);
                padding: 40px 32px;
                border: 1px solid #E2E8F0;
                border-radius: 24px;
                background: #FFFFFF;
                box-shadow: 0 24px 60px rgb(3 14 35 / 30%);
                text-align: center;
            }

            .error-logo {
                width: 56px;
                height: 56px;
                object-fit: contain;
            }

            .error-brand {
                margin: 16px 0 0;
                color: #004A99;
                font-size: 14px;
                font-weight: 700;
                letter-spacing: 0.16em;
                text-transform: uppercase;
            }

            .error-code {
                margin: 24px 0 0;
                color: #D9A514;
                font-size: 48px;
                font-weight: 800;
            }

            .error-heading {
                margin: 12px 0 0;
                color: #0B2C59;
                font-size: 24px;
            }

            .error-message {
                margin: 12px 0 0;
                color: #475569;
                font-size: 14px;
                line-height: 1.6;
            }

            .error-link {
                display: inline-flex;
                min-height: 44px;
                align-items: center;
                justify-content: center;
                margin-top: 28px;
                padding: 12px 20px;
                border-radius: 12px;
                background: #004A99;
                color: #FFFFFF;
                font-size: 14px;
                font-weight: 600;
                text-decoration: none;
                transition: background-color 150ms ease;
            }

            .error-link:hover {
                background: #0B2C59;
            }

            .error-link:focus-visible {
                outline: 3px solid #FACC15;
                outline-offset: 3px;
            }

            @media (max-width: 480px) {
                main {
                    padding: 32px 22px;
                }
            }
        </style>
    </head>
    <body>
        <main>
            <img src="{{ asset('yapesdai.png') }}" alt="Logo YAPESDAI" class="error-logo">
            <p class="error-brand">YAPESDAI</p>
            <p class="error-code">@yield('code')</p>
            <h1 class="error-heading">@yield('heading')</h1>
            <p class="error-message">@yield('message')</p>
            <a href="{{ url('/') }}" class="error-link">
                Kembali ke Portal Utama
            </a>
        </main>
    </body>
</html>
