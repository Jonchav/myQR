from flask import Flask, request, send_file, render_template_string, jsonify
import qrcode
import io
import requests
from PIL import Image
from urllib.parse import urlparse
import base64
import json
import os

app = Flask(__name__)

# Diccionario para almacenar el historial de QRs por usuario
user_qr_history = {}

HTML = '''
<!DOCTYPE html>
<html>
<head>
    <title>🎨 Generador y Escáner de QR Super Divertido</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            padding: 20px;
        }
        .container {
            background: rgba(255, 255, 255, 0.95);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 500px;
            width: 90%;
        }
        h2 {
            color: #4a5568;
            margin-bottom: 30px;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        .emoji {
            font-size: 3em;
            margin-bottom: 20px;
            display: block;
        }
        .tabs {
            display: flex;
            margin-bottom: 30px;
            border-radius: 15px;
            overflow: hidden;
            background: #f7fafc;
        }
        .tab {
            flex: 1;
            padding: 15px;
            cursor: pointer;
            background: #e2e8f0;
            border: none;
            font-size: 16px;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        .tab.active {
            background: linear-gradient(45deg, #43e97b 0%, #38f9d7 100%);
            color: white;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
        input {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 25px;
            font-size: 16px;
            margin-bottom: 20px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%);
            color: white;
            text-align: center;
            box-sizing: border-box;
        }
        input::placeholder {
            color: rgba(255, 255, 255, 0.8);
        }
        button {
            background: linear-gradient(45deg, #43e97b 0%, #38f9d7 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 18px;
            border-radius: 25px;
            cursor: pointer;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            transition: transform 0.3s ease;
            font-weight: bold;
            margin: 5px;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 7px 20px rgba(0, 0, 0, 0.3);
        }
        .scanner-container {
            position: relative;
            margin: 20px 0;
        }
        #video {
            width: 100%;
            max-width: 400px;
            border-radius: 15px;
            display: none;
        }
        .scanner-overlay {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 200px;
            height: 200px;
            border: 3px solid #43e97b;
            border-radius: 15px;
            display: none;
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            background: #e6fffa;
            border-radius: 15px;
            border-left: 5px solid #43e97b;
            display: none;
        }
        .sparkle {
            animation: sparkle 2s infinite;
        }
        @keyframes sparkle {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .history-item {
            background: #f7fafc;
            margin: 10px 0;
            padding: 15px;
            border-radius: 10px;
            text-align: left;
            border-left: 4px solid #43e97b;
        }
        .history-container {
            max-height: 400px;
            overflow-y: auto;
        }
        .auth-container {
            background: rgba(255, 255, 255, 0.9);
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 20px;
            border: 2px solid #43e97b;
        }
        .user-info {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 15px;
        }
        .welcome-text {
            color: #4a5568;
            font-weight: bold;
        }
        .logout-btn {
            background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%);
            padding: 8px 16px;
            font-size: 14px;
            margin: 0;
        }
        .auth-button {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.9);
            padding: 10px;
            border-radius: 50px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        }
        .auth-button:hover {
            background: rgba(255, 255, 255, 1);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        .login-minimal {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        }
        .modal-content {
            background: white;
            padding: 30px;
            border-radius: 20px;
            max-width: 400px;
            margin: 20px;
            text-align: center;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
        }
        .modal-buttons {
            margin-top: 20px;
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        .secondary-btn {
            background: #e2e8f0;
            color: #4a5568;
        }
        .user-pill {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: linear-gradient(45deg, #43e97b 0%, #38f9d7 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .user-pill button {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 12px;
            cursor: pointer;
            transition: background 0.3s ease;
        }
        .user-pill button:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        .customization-section {
            background: rgba(255, 255, 255, 0.7);
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
            text-align: left;
            border: 2px dashed #e2e8f0;
        }
        .color-group, .style-group, .size-group, .logo-group {
            margin: 15px 0;
        }
        .color-group label, .style-group label, .size-group label {
            display: block;
            font-weight: bold;
            color: #4a5568;
            margin-bottom: 8px;
        }
        .color-options {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .color-options input[type="radio"] {
            display: none;
        }
        .color-option {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            border: 3px solid transparent;
            transition: all 0.3s ease;
            display: inline-block;
        }
        .color-options input[type="radio"]:checked + .color-option {
            border-color: #43e97b;
            transform: scale(1.1);
            box-shadow: 0 0 10px rgba(67, 233, 123, 0.5);
        }
        .style-options {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        .style-options input[type="radio"] {
            display: none;
        }
        .style-option {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 10px;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            background: white;
        }
        .style-options input[type="radio"]:checked + .style-option {
            border-color: #43e97b;
            background: #e6fffa;
        }
        .style-preview {
            width: 30px;
            height: 30px;
            background: #4a5568;
            margin-bottom: 5px;
        }
        .square-preview {
            /* Ya es cuadrado por defecto */
        }
        .rounded-preview {
            border-radius: 6px;
        }
        .circle-preview {
            border-radius: 50%;
        }
        .size-options {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .size-options input[type="radio"] {
            display: none;
        }
        .size-option {
            padding: 8px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            background: white;
            font-size: 14px;
        }
        .size-options input[type="radio"]:checked + .size-option {
            border-color: #43e97b;
            background: #e6fffa;
            color: #38a169;
        }
        .checkbox-container {
            display: flex;
            align-items: center;
            cursor: pointer;
            font-weight: bold;
            color: #4a5568;
        }
        .checkbox-container input {
            margin-right: 10px;
            width: auto;
            padding: 0;
            background: none;
            box-shadow: none;
        }
        .checkmark {
            margin-left: 5px;
        }
        .pro-banner {
            background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .pro-banner::before {
            content: "✨";
            position: absolute;
            top: 10px;
            right: 15px;
            font-size: 24px;
            animation: sparkle 2s infinite;
        }
        .pro-features {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 10px;
            margin: 15px 0;
            backdrop-filter: blur(10px);
        }
        .upgrade-btn {
            background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 25px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(240, 147, 251, 0.4);
        }
        .upgrade-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(240, 147, 251, 0.6);
        }
        .coming-soon {
                    opacity: 0.7;
                    font-size: 12px;
                    color: #a0aec0;
                    margin-top: 5px;
                }
                .pattern-group, .frame-group, .gradient-group {
                    margin: 20px 0;
                }
                .pattern-group label, .frame-group label, .gradient-group label {
                    display: block;
                    font-weight: bold;
                    color: #4a5568;
                    margin-bottom: 12px;
                    font-size: 16px;
                }
                .pattern-options, .frame-options, .gradient-options {
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                    margin-bottom: 15px;
                }
                .pattern-options input[type="radio"], 
                .frame-options input[type="radio"], 
                .gradient-options input[type="radio"] {
                    display: none;
                }
                .pattern-option, .frame-option, .gradient-option {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 15px;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: white;
                    min-width: 80px;
                }
                .pattern-options input[type="radio"]:checked + .pattern-option,
                .frame-options input[type="radio"]:checked + .frame-option,
                .gradient-options input[type="radio"]:checked + .gradient-option {
                    border-color: #43e97b;
                    background: #e6fffa;
                    transform: scale(1.05);
                    box-shadow: 0 0 10px rgba(67, 233, 123, 0.3);
                }
                .pattern-preview, .frame-preview, .gradient-preview {
                    width: 35px;
                    height: 35px;
                    margin-bottom: 8px;
                    border-radius: 4px;
                }
                .standard-pattern {
                    background: #4a5568;
                    background-image: repeating-conic-gradient(from 0deg, #4a5568 0deg 90deg, transparent 90deg 180deg);
                }
                .dots-pattern {
                    background: #4a5568;
                    background-image: radial-gradient(circle, #4a5568 2px, transparent 3px);
                    background-size: 8px 8px;
                }
                .rounded-pattern {
                    background: #4a5568;
                    border-radius: 8px;
                }
                .heart-pattern {
                    background: #f56565;
                    clip-path: polygon(50% 85%, 15% 45%, 15% 25%, 35% 5%, 50% 20%, 65% 5%, 85% 25%, 85% 45%);
                }
                .none-frame {
                    background: #e2e8f0;
                    border: 2px solid #4a5568;
                }
                .simple-frame {
                    background: #e2e8f0;
                    border: 3px solid #43e97b;
                    border-radius: 4px;
                }
                .decorative-frame {
                    background: #e2e8f0;
                    border: 3px solid #667eea;
                    border-radius: 8px;
                    box-shadow: inset 0 0 0 2px #f093fb;
                }
                .floral-frame {
                    background: #e2e8f0;
                    border: 3px solid #38a169;
                    border-radius: 50%;
                    position: relative;
                }
                .floral-frame::before {
                    content: "🌸";
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    font-size: 12px;
                }
                .solid-effect {
                    background: #4a5568;
                }
                .gradient-effect {
                    background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
                }
                .rainbow-effect {
                    background: linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080);
                }
                .neon-effect {
                    background: #43e97b;
                    box-shadow: 0 0 10px #43e97b, 0 0 20px #43e97b, 0 0 30px #43e97b;
                }
    </style>
</head>
<body>
    <div class="container">
        <span class="emoji sparkle">✨</span>
        <h2>🎨 QR Master</h2>

        <!-- Sistema de Autenticación Minimalista -->
        <div id="authButton" class="auth-button">
            <div class="login-minimal">
                <script
                    authed="location.reload()"
                    src="https://auth.util.repl.co/script.js"
                ></script>
            </div>
        </div>

        <!-- Contenido principal -->
        <div id="mainContent"></div>

        <!-- Modal de bienvenida para usuarios no autenticados -->
        <div id="welcomeModal" class="modal" style="display: none;">
            <div class="modal-content">
                <h3>👋 ¡Bienvenido a QR Master!</h3>
                <p>Para guardar tu historial de códigos QR, inicia sesión con tu cuenta de Replit.</p>
                <p style="font-size: 14px; color: #718096;">Puedes usar la aplicación sin iniciar sesión, pero no se guardará tu historial.</p>
                <div class="modal-buttons">
                    <button onclick="closeWelcomeModal()" class="secondary-btn">Continuar sin cuenta</button>
                </div>
            </div>
        </div>

        <div class="tabs">
            <button class="tab active" onclick="showTab('generate')">🚀 Generar</button>
            <button class="tab" onclick="showTab('scan')">📱 Escanear</button>
            <button class="tab" onclick="showTab('history')">📚 Historial</button>
        </div>

        <!-- Tab Generar -->
        <div id="generate" class="tab-content active">
            <p style="color: #718096; margin-bottom: 30px;">¡Crea códigos QR súper rápido!</p>
            <form action="/" method="post">
                <input name="data" placeholder="🔗 Pega tu enlace o texto aquí" required>
                <button type="submit">🚀 ¡Generar QR!</button>
            </form>
        </div>

        <!-- Tab Escanear -->
        <div id="scan" class="tab-content">
            <p style="color: #718096; margin-bottom: 30px;">📸 Escanea códigos QR con tu cámara</p>
            <div class="scanner-container">
                <video id="video" autoplay playsinline></video>
                <div class="scanner-overlay" id="overlay"></div>
            </div>
            <button onclick="startScanner()">📷 Iniciar Escáner</button>
            <button onclick="stopScanner()">⏹️ Detener</button>
            <div id="scanResult" class="result">
                <strong>📋 Resultado:</strong>
                <p id="scannedText"></p>
                <button onclick="copyToClipboard()">📋 Copiar</button>
            </div>
        </div>

        <!-- Tab Historial -->
        <div id="history" class="tab-content">
            <p style="color: #718096; margin-bottom: 30px;">📚 Tus códigos QR generados</p>
            <div class="history-container" id="historyContainer">
                <p style="color: #a0aec0;">No hay códigos QR en el historial aún.</p>
            </div>
            <button onclick="clearHistory()">🗑️ Limpiar Historial</button>
        </div>
        </div> <!-- Fin de mainContent -->
    </div>

    <script src="https://unpkg.com/jsqr@1.4.0/dist/jsQR.js"></script>
    <script>
        let video, canvas, context, scanning = false;
        let scannedData = '';
        let currentUser = null;

        // Verificar autenticación al cargar la página
        window.onload = function() {
            checkAuthentication();
        };

        function checkAuthentication() {
            fetch('/auth_status')
                .then(response => response.json())
                .then(data => {
                    if (data.authenticated) {
                        currentUser = data.user;
                        showMainContent();
                    } else {
                        showLoginScreen();
                    }
                })
                .catch(err => {
                    console.error('Error checking auth:', err);
                    showLoginScreen();
                });
        }

        function showMainContent() {
            document.getElementById('authButton').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';

            // Mostrar pill del usuario en la esquina
            const userPill = document.createElement('div');
            userPill.className = 'user-pill';
            userPill.innerHTML = `
                <span>👋 ${currentUser.name}</span>
                <button onclick="logout()">Salir</button>
            `;
            document.body.appendChild(userPill);
        }

        function showLoginScreen() {
            document.getElementById('authButton').style.display = 'block';
            document.getElementById('mainContent').style.display = 'block';

            // Mostrar modal de bienvenida una sola vez
            if (!localStorage.getItem('welcomeShown')) {
                document.getElementById('welcomeModal').style.display = 'flex';
                localStorage.setItem('welcomeShown', 'true');
            }
        }

        function closeWelcomeModal() {
            document.getElementById('welcomeModal').style.display = 'none';
        }

        function logout() {
            fetch('/logout', { method: 'POST' })
                .then(() => {
                    location.reload();
                });
        }

        function showTab(tabName) {
            // Ocultar todas las tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab').forEach(btn => {
                btn.classList.remove('active');
            });

            // Mostrar la tab seleccionada
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');

            // Detener escáner si cambiamos de tab
            if (tabName !== 'scan') {
                stopScanner();
            }

            // Cargar historial si vamos a esa tab
            if (tabName === 'history') {
                loadHistory();
            }
        }

        function startScanner() {
            const video = document.getElementById('video');
            const overlay = document.getElementById('overlay');

            navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment' // Usar cámara trasera en móviles
                } 
            })
            .then(stream => {
                video.srcObject = stream;
                video.style.display = 'block';
                overlay.style.display = 'block';
                scanning = true;
                scanQR();
            })
            .catch(err => {
                alert('❌ No se pudo acceder a la cámara. Verifica los permisos.');
                console.error(err);
            });
        }

        function stopScanner() {
            const video = document.getElementById('video');
            const overlay = document.getElementById('overlay');

            if (video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
                video.style.display = 'none';
                overlay.style.display = 'none';
                scanning = false;
            }
        }

        function scanQR() {
            if (!scanning) return;

            const video = document.getElementById('video');

            if (!canvas) {
                canvas = document.createElement('canvas');
                context = canvas.getContext('2d');
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0);

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code) {
                scannedData = code.data;
                document.getElementById('scannedText').textContent = code.data;
                document.getElementById('scanResult').style.display = 'block';
                stopScanner();

                // Vibrar si está disponible
                if (navigator.vibrate) {
                    navigator.vibrate([200, 100, 200]);
                }
            } else {
                requestAnimationFrame(scanQR);
            }
        }

        function copyToClipboard() {
            navigator.clipboard.writeText(scannedData).then(() => {
                alert('📋 ¡Copiado al portapapeles!');
            }).catch(err => {
                // Fallback para navegadores sin soporte de clipboard API
                const textArea = document.createElement('textarea');
                textArea.value = scannedData;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('📋 ¡Copiado al portapapeles!');
            });
        }

        function loadHistory() {
            fetch('/history')
                .then(response => response.json())
                .then(data => {
                    const container = document.getElementById('historyContainer');
                    if (data.length === 0) {
                        container.innerHTML = '<p style="color: #a0aec0;">No hay códigos QR en el historial aún.</p>';
                    } else {
                        container.innerHTML = data.map(item => `
                            <div class="history-item">
                                <strong>📅 ${item.timestamp}</strong><br>
                                <span style="color: #4a5568;">📝 ${item.data}</span><br>
                                <small style="color: #718096;">🏷️ Tipo: ${item.type}</small><br>
                                ${item.style ? `<small style="color: #718096;">✨ Estilo: ${item.style}</small><br>` : ''}
                                ${item.colors ? `<small style="color: #718096;">🎨 Colores: ${item.colors}</small>` : ''}
                            </div>
                        `).join('');
                    }
                });
        }

        function clearHistory() {
            if (confirm('¿Estás seguro de que quieres limpiar el historial?')) {
                fetch('/clear_history', { method: 'POST' })
                    .then(() => {
                        loadHistory();
                        alert('🗑️ Historial limpiado');
                    });
            }
        }
    </script>
</body>
</html>
'''

# IA muy simple para detectar el tipo de enlace por el dominio
def detectar_tipo_enlace(url):
    dominio = urlparse(url).netloc.lower()
    if "youtube" in dominio:
        return "YouTube"
    elif "spotify" in dominio:
        return "Spotify"
    elif "instagram" in dominio:
        return "Instagram"
    elif "tiktok" in dominio:
        return "TikTok"
    else:
        return "Web"

# Descargar logo desde internet (usando PNG/JPG para evitar problemas con SVG)
def obtener_logo(tipo):
    logos = {
        "YouTube": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/159px-YouTube_full-color_icon_%282017%29.svg.png",
        "Spotify": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/168px-Spotify_logo_without_text.svg.png",
        "Instagram": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png",
        "TikTok": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Ionicons_logo-tiktok.svg/512px-Ionicons_logo-tiktok.svg.png",
        "Web": "https://upload.wikimedia.org/wikipedia/commons/6/6b/Internet_Web_Browser_Icon.png"
    }
    return logos.get(tipo)

# Convertir color hexadecimal a RGB
def hex_to_rgb(hex_color):
    try:
        # Asegurar que el color empiece con #
        if not hex_color or not isinstance(hex_color, str):
            return (0, 0, 0)

        if not hex_color.startswith('#'):
            hex_color = '#' + hex_color

        # Remover el # y convertir a RGB
        hex_color = hex_color.lstrip('#')

        # Validar que tenga 6 caracteres y sea hexadecimal válido
        if len(hex_color) != 6:
            return (0, 0, 0)  # Negro por defecto

        # Verificar que todos los caracteres sean hexadecimales
        for char in hex_color:
            if char not in '0123456789ABCDEFabcdef':
                return (0, 0, 0)

        # Convertir a RGB
        r = int(hex_color[0:2], 16)
        g = int(hex_color[2:4], 16)
        b = int(hex_color[4:6], 16)

        # Validar que los valores estén en el rango correcto
        if not (0 <= r <= 255 and 0 <= g <= 255 and 0 <= b <= 255):
            return (0, 0, 0)

        return (r, g, b)
    except (ValueError, TypeError, AttributeError) as e:
        print(f"Error en hex_to_rgb con color '{hex_color}': {e}")
        # Color por defecto en caso de error
        return (0, 0, 0)

# Inserta el logo en el centro del QR
def generar_qr_personalizado(data, logo_url=None, bg_color="#ffffff", qr_color="#000000", qr_style="square", qr_size="medium", include_logo=True):
    print(f"Generando QR con colores: QR={qr_color}, Fondo={bg_color}")

    # Configurar tamaño según la opción elegida
    size_map = {
        "small": {"version": 1, "box_size": 8, "border": 3},
        "medium": {"version": 1, "box_size": 10, "border": 4},
        "large": {"version": 1, "box_size": 12, "border": 5}
    }

    size_config = size_map.get(qr_size, size_map["medium"])

    # Convertir colores hex a RGB con validación mejorada
    qr_color_rgb = hex_to_rgb(qr_color)
    bg_color_rgb = hex_to_rgb(bg_color)

    print(f"Colores RGB: QR={qr_color_rgb}, Fondo={bg_color_rgb}")

    # Validar que los colores sean tuplas válidas
    if not isinstance(qr_color_rgb, tuple) or len(qr_color_rgb) != 3:
        print(f"Color QR inválido, usando negro por defecto")
        qr_color_rgb = (0, 0, 0)
    if not isinstance(bg_color_rgb, tuple) or len(bg_color_rgb) != 3:
        print(f"Color fondo inválido, usando blanco por defecto")
        bg_color_rgb = (255, 255, 255)

    # Crear QR con colores validados - siempre cuadrado
    qr = qrcode.QRCode(
        version=size_config["version"], 
        box_size=size_config["box_size"], 
        border=size_config["border"]
    )
    qr.add_data(data)
    qr.make(fit=True)

    try:
        img_qr = qr.make_image(fill_color=qr_color_rgb, back_color=bg_color_rgb).convert("RGB")
    except Exception as e:
        print(f"Error al crear imagen QR: {e}")
        # Usar colores por defecto si hay error
        img_qr = qr.make_image(fill_color=(0, 0, 0), back_color=(255, 255, 255)).convert("RGB")

    # Insertar logo si está habilitado y disponible
    if include_logo and logo_url:
        try:
            # Descargar logo con headers para evitar bloqueos
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(logo_url, headers=headers, timeout=10, stream=True)
            response.raise_for_status()

            # Verificar que el contenido sea una imagen válida
            content_type = response.headers.get('content-type', '')

            # Saltar SVGs ya que PIL tiene problemas con ellos
            if 'svg' in content_type.lower():
                print(f"Saltando SVG: {logo_url}")
                return img_qr

            if not content_type.startswith('image/'):
                print(f"URL no contiene una imagen válida: {content_type}")
                return img_qr

            # Intentar abrir la imagen
            try:
                logo = Image.open(io.BytesIO(response.content)).convert("RGBA")
            except Exception as img_error:
                print(f"Error al procesar imagen: {img_error}")
                return img_qr

            # Redimensionar logo según el tamaño del QR
            logo_size_map = {
                "small": 40,
                "medium": 60,
                "large": 80
            }
            basewidth = logo_size_map.get(qr_size, 60)
            wpercent = basewidth / float(logo.size[0])
            hsize = int(float(logo.size[1]) * float(wpercent))
            logo = logo.resize((basewidth, hsize), Image.LANCZOS)

            # Calcular posición y pegar
            pos = ((img_qr.size[0] - logo.size[0]) // 2, (img_qr.size[1] - logo.size[1]) // 2)
            img_qr.paste(logo, pos, mask=logo)

        except Exception as e:
            print(f"Error al insertar logo desde {logo_url}: {e}")
            # Continuar sin logo en caso de error

    return img_qr

def aplicar_estilo_redondeado(img, estilo):
    """Aplica bordes redondeados o circulares al QR"""
    from PIL import ImageDraw

    # Crear una nueva imagen con fondo transparente
    size = max(img.size)  # Usar el tamaño más grande para asegurar que sea cuadrado
    square_img = Image.new('RGB', (size, size), (255, 255, 255))

    # Centrar la imagen original en el cuadrado
    x = (size - img.size[0]) // 2
    y = (size - img.size[1]) // 2
    square_img.paste(img, (x, y))

    # Crear máscara circular
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)

    if estilo in ["rounded", "circle"]:
        # Hacer completamente circular - usar todo el espacio disponible
        margin = 5  # Pequeño margen para que se vea bien
        draw.ellipse([margin, margin, size-margin, size-margin], fill=255)

    # Convertir a RGBA para poder usar la máscara
    square_img = square_img.convert('RGBA')

    # Crear imagen final con fondo transparente
    output = Image.new('RGBA', (size, size), (255, 255, 255, 0))

    # Aplicar máscara
    for x in range(size):
        for y in range(size):
            if mask.getpixel((x, y)) > 0:
                output.putpixel((x, y), square_img.getpixel((x, y)) + (255,))

    # Convertir de vuelta a RGB con fondo blanco
    final = Image.new('RGB', (size, size), (255, 255, 255))
    final.paste(output, mask=output)

    return final

def hacer_logo_circular(logo):
    """Convierte el logo en circular"""
    from PIL import ImageDraw

    # Crear máscara circular
    mask = Image.new('L', logo.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse([0, 0, logo.size[0], logo.size[1]], fill=255)

    # Aplicar máscara al logo
    output = Image.new('RGBA', logo.size, (255, 255, 255, 0))
    output.paste(logo, mask=mask)

    return output

def get_user_id():
    """Obtener el ID del usuario autenticado desde los headers de Replit"""
    return request.headers.get('X-Replit-User-Id')

def get_user_name():
    """Obtener el nombre del usuario autenticado desde los headers de Replit"""
    return request.headers.get('X-Replit-User-Name')

def is_authenticated():
    """Verificar si el usuario está autenticado"""
    return get_user_id() is not None

@app.route('/auth_status')
def auth_status():
    """Endpoint para verificar el estado de autenticación"""
    if is_authenticated():
        return jsonify({
            'authenticated': True,
            'user': {
                'id': get_user_id(),
                'name': get_user_name()
            }
        })
    else:
        return jsonify({'authenticated': False})

@app.route('/logout', methods=['POST'])
def logout():
    """Endpoint para cerrar sesión (simplemente redirige)"""
    return jsonify({'success': True})

@app.route('/history')
def get_history():
    """Obtener historial del usuario autenticado"""
    if not is_authenticated():
        return jsonify([])

    user_id = get_user_id()
    return jsonify(user_qr_history.get(user_id, []))

@app.route('/clear_history', methods=['POST'])
def clear_history():
    """Limpiar historial del usuario autenticado"""
    if not is_authenticated():
        return jsonify({'error': 'No autenticado'}), 401

    user_id = get_user_id()
    user_qr_history[user_id] = []
    return jsonify({'success': True})

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        # Verificar autenticación
        if not is_authenticated():
            return jsonify({'error': 'No autenticado'}), 401

        data = request.form['data']

        # Usar configuración básica para versión gratuita
        bg_color = '#ffffff'
        qr_color = '#000000'
        qr_style = 'square'
        qr_size = 'medium'
        include_logo = True

        tipo = detectar_tipo_enlace(data)
        logo_url = obtener_logo(tipo) if include_logo else None
        user_id = get_user_id()

        # Inicializar historial del usuario si no existe
        if user_id not in user_qr_history:
            user_qr_history[user_id] = []

        # Agregar al historial del usuario
        from datetime import datetime
        user_qr_history[user_id].append({
            'data': data,
            'type': tipo,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'style': 'Básico',
            'colors': 'Estándar'
        })

        img = generar_qr_personalizado(data, logo_url, bg_color, qr_color, qr_style, qr_size, include_logo)
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)

        # Codificar imagen en base64 para mostrarla en HTML
        buf.seek(0)
        img_base64 = base64.b64encode(buf.read()).decode()

        # Mostrar página con QR y opciones PRO
        qr_result_html = f'''
        <!DOCTYPE html>
        <html>
        <head>
            <title>🎨 Tu Código QR Generado</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{
                    font-family: 'Arial', sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    margin: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                    padding: 20px;
                }}
                .container {{
                    background: rgba(255, 255, 255, 0.95);
                    padding: 40px;
                    border-radius: 20px;
                    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
                    text-align: center;
                    max-width: 600px;
                    width: 90%;
                }}
                h2 {{
                    color: #4a5568;
                    margin-bottom: 30px;
                    font-size: 2.5em;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
                }}
                .qr-image {{
                    max-width: 300px;
                    width: 100%;
                    border-radius: 15px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                    margin: 20px 0;
                }}
                button {{
                    background: linear-gradient(45deg, #43e97b 0%, #38f9d7 100%);
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    font-size: 18px;
                    border-radius: 25px;
                    cursor: pointer;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                    transition: transform 0.3s ease;
                    font-weight: bold;
                    margin: 10px;
                }}
                button:hover {{
                    transform: translateY(-2px);
                    box-shadow: 0 7px 20px rgba(0, 0, 0, 0.3);
                }}
                .download-btn {{
                    background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%);
                }}
                .info {{
                    background: #e6fffa;
                    padding: 15px;
                    border-radius: 15px;
                    margin: 20px 0;
                    border-left: 5px solid #43e97b;
                    word-wrap: break-word;
                    word-break: break-all;
                    overflow-wrap: break-word;
                    max-width: 100%;
                }}
                .content-text {{
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                    line-height: 1.4;
                    color: #2d3748;
                    background: rgba(255, 255, 255, 0.8);
                    padding: 8px;
                    border-radius: 8px;
                    margin-top: 8px;
                    white-space: pre-wrap;
                    overflow-wrap: break-word;
                    word-break: break-all;
                }}
                .pro-customization {{
                    background: rgba(255, 255, 255, 0.9);
                    padding: 25px;
                    border-radius: 15px;
                    margin: 20px 0;
                    text-align: left;
                    border: 2px solid #43e97b;
                    box-shadow: 0 5px 15px rgba(67, 233, 123, 0.2);
                }}
                .pro-customization h3 {{
                    color: #4a5568;
                    margin: 0 0 20px 0;
                    text-align: center;
                    font-size: 1.5em;
                }}
                .pro-badge {{
                    background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 4px 12px;
                    border-radius: 15px;
                    font-size: 12px;
                    font-weight: bold;
                    margin-left: 10px;
                }}
                .color-group, .style-group, .size-group {{
                    margin: 20px 0;
                }}
                .color-group label, .style-group label, .size-group label {{
                    display: block;
                    font-weight: bold;
                    color: #4a5568;
                    margin-bottom: 12px;
                    font-size: 16px;
                }}
                .color-options {{
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                    margin-bottom: 15px;
                }}
                .color-options input[type="radio"] {{
                    display: none;
                }}
                .color-option {{
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 3px solid transparent;
                    transition: all 0.3s ease;
                    display: inline-block;
                    position: relative;
                }}
                .color-option::after {{
                    content: attr(data-name);
                    position: absolute;
                    bottom: -25px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 12px;
                    color: #4a5568;
                    white-space: nowrap;
                }}
                .color-options input[type="radio"]:checked + .color-option {{
                    border-color: #43e97b;
                    transform: scale(1.15);
                    box-shadow: 0 0 15px rgba(67, 233, 123, 0.6);
                }}
                .style-options {{
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                    margin-bottom: 15px;
                }}
                .style-options input[type="radio"] {{
                    display: none;
                }}
                .style-option {{
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 15px;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: white;
                    min-width: 80px;
                }}
                .style-options input[type="radio"]:checked + .style-option {{
                    border-color: #43e97b;
                    background: #e6fffa;
                    transform: scale(1.05);
                    box-shadow: 0 0 10px rgba(67, 233, 123, 0.3);
                }}
                .style-preview {{
                    width: 35px;
                    height: 35px;
                    background: #4a5568;
                    margin-bottom: 8px;
                }}
                .rounded-preview {{
                    border-radius: 8px;
                }}
                .circle-preview {{
                    border-radius: 50%;
                }}
                .size-options {{
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    margin-bottom: 15px;
                }}
                .size-options input[type="radio"] {{
                    display: none;
                }}
                .size-option {{
                    padding: 12px 20px;
                    border: 2px solid #e2e8f0;
                    border-radius: 25px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: white;
                    font-size: 14px;
                    font-weight: 500;
                }}
                .size-options input[type="radio"]:checked + .size-option {{
                    border-color: #43e97b;
                    background: #e6fffa;
                    color: #38a169;
                    transform: scale(1.05);
                }}
                .customize-btn {{
                    background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px 30px;
                    border-radius: 25px;
                    font-size: 16px;
                    font-weight: bold;
                    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
                    margin: 20px auto;
                    display: block;
                }}
                .customize-btn:hover {{
                    transform: translateY(-2px);
                    box-shadow: 0 7px 20px rgba(102, 126, 234, 0.6);
                }}
                .toggle-section {{
                    margin: 15px 0;
                    padding: 15px;
                    background: #f7fafc;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }}
                .toggle-switch {{
                    position: relative;
                    display: inline-block;
                    width: 60px;
                    height: 34px;
                }}
                .toggle-switch input {{
                    opacity: 0;
                    width: 0;
                    height: 0;
                }}
                .slider {{
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                    border-radius: 34px;
                }}
                .slider:before {{
                    position: absolute;
                    content: "";
                    height: 26px;
                    width: 26px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }}
                input:checked + .slider {{
                    background-color: #43e97b;
                }}
                input:checked + .slider:before {{
                    transform: translateX(26px);
                }}
                .sparkle-animation {{
                    animation: sparkle 2s infinite;
                }}
                @keyframes sparkle {{
                    0%, 100% {{ opacity: 1; }}
                    50% {{ opacity: 0.5; }}
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <h2>✨ ¡QR Generado!</h2>
                <div class="info">
                    <strong>📝 Contenido:</strong>
                    <div class="content-text">{data}</div>
                    <strong>🏷️ Tipo:</strong> {tipo}
                </div>
                <img src="data:image/png;base64,{img_base64}" alt="Código QR" class="qr-image" id="qrImage">

                <!-- PRO Customization Section -->
                <div class="pro-customization">
                    <h3>🎨 Personalización PRO <span class="pro-badge sparkle-animation">✨ PRO</span></h3>

                    <form id="customizeForm">
                        <input type="hidden" name="data" value="{data}">
                        <input type="hidden" name="qr_style" value="square">

                        <div class="color-group">
                            <label>🎨 Color del QR:</label>
                            <div class="color-options">
                                <input type="radio" name="qr_color" value="#000000" id="qr_black" checked>
                                <label for="qr_black" class="color-option" style="background: #000000;" data-name="Negro"></label>

                                <input type="radio" name="qr_color" value="#1a202c" id="qr_dark_gray">
                                <label for="qr_dark_gray" class="color-option" style="background: #1a202c;" data-name="Gris Oscuro"></label>

                                <input type="radio" name="qr_color" value="#2d3748" id="qr_slate">
                                <label for="qr_slate" class="color-option" style="background: #2d3748;" data-name="Pizarra"></label>

                                <input type="radio" name="qr_color" value="#667eea" id="qr_blue">
                                <label for="qr_blue" class="color-option" style="background: #667eea;" data-name="Azul"></label>

                                <input type="radio" name="qr_color" value="#3182ce" id="qr_blue_dark">
                                <label for="qr_blue_dark" class="color-option" style="background: #3182ce;" data-name="Azul Oscuro"></label>

                                <input type="radio" name="qr_color" value="#065f46" id="qr_emerald">
                                <label for="qr_emerald" class="color-option" style="background: #065f46;" data-name="Esmeralda"></label>

                                <input type="radio" name="qr_color" value="#43e97b" id="qr_green">
                                <label for="qr_green" class="color-option" style="background: #43e97b;" data-name="Verde"></label>

                                <input type="radio" name="qr_color" value="#38a169" id="qr_green_dark">
                                <label for="qr_green_dark" class="color-option" style="background: #38a169;" data-name="Verde Oscuro"></label>

                                <input type="radio" name="qr_color" value="#f093fb" id="qr_pink">
                                <label for="qr_pink" class="color-option" style="background: #f093fb;" data-name="Rosa"></label>

                                <input type="radio" name="qr_color" value="#d53f8c" id="qr_pink_dark">
                                <label for="qr_pink_dark" class="color-option" style="background: #d53f8c;" data-name="Rosa Oscuro"></label>

                                <input type="radio" name="qr_color" value="#f5576c" id="qr_red">
                                <label for="qr_red" class="color-option" style="background: #f5576c;" data-name="Rojo"></label>

                                <input type="radio" name="qr_color" value="#c53030" id="qr_red_dark">
                                <label for="qr_red_dark" class="color-option" style="background: #c53030;" data-name="Rojo Oscuro"></label>

                                <input type="radio" name="qr_color" value="#764ba2" id="qr_purple">
                                <label for="qr_purple" class="color-option" style="background: #764ba2;" data-name="Morado"></label>

                                <input type="radio" name="qr_color" value="#553c9a" id="qr_purple_dark">
                                <label for="qr_purple_dark" class="color-option" style="background: #553c9a;" data-name="Morado Oscuro"></label>

                                <input type="radio" name="qr_color" value="#ed8936" id="qr_orange">
                                <label for="qr_orange" class="color-option" style="background: #ed8936;" data-name="Naranja"></label>

                                <input type="radio" name="qr_color" value="#d69e2e" id="qr_yellow">
                                <label for="qr_yellow" class="color-option" style="background: #d69e2e;" data-name="Amarillo"></label>
                            </div>
                        </div>

                        <div class="color-group">
                            <label>🎨 Color de Fondo:</label>
                            <div class="color-options">
                                <input type="radio" name="bg_color" value="#ffffff" id="bg_white" checked>
                                <label for="bg_white" class="color-option" style="background: #ffffff; border: 2px solid #e2e8f0;" data-name="Blanco"></label>

                                <input type="radio" name="bg_color" value="#f7fafc" id="bg_light">
                                <label for="bg_light" class="color-option" style="background: #f7fafc;" data-name="Gris Claro"></label>

                                <input type="radio" name="bg_color" value="#edf2f7" id="bg_gray">
                                <label for="bg_gray" class="color-option" style="background: #edf2f7;" data-name="Gris"></label>

                                <input type="radio" name="bg_color" value="#ebf8ff" id="bg_blue_light">
                                <label for="bg_blue_light" class="color-option" style="background: #ebf8ff;" data-name="Azul Claro"></label>

                                <input type="radio" name="bg_color" value="#bee3f8" id="bg_blue_soft">
                                <label for="bg_blue_soft" class="color-option" style="background: #bee3f8;" data-name="Azul Suave"></label>

                                <input type="radio" name="bg_color" value="#e6fffa" id="bg_mint">
                                <label for="bg_mint" class="color-option" style="background: #e6fffa;" data-name="Menta"></label>

                                <input type="radio" name="bg_color" value="#c6f6d5" id="bg_green_light">
                                <label for="bg_green_light" class="color-option" style="background: #c6f6d5;" data-name="Verde Claro"></label>

                                <input type="radio" name="bg_color" value="#fed7d7" id="bg_pink_light">
                                <label for="bg_pink_light" class="color-option" style="background: #fed7d7;" data-name="Rosa Claro"></label>

                                <input type="radio" name="bg_color" value="#fbb6ce" id="bg_pink_soft">
                                <label for="bg_pink_soft" class="color-option" style="background: #fbb6ce;" data-name="Rosa Suave"></label>

                                <input type="radio" name="bg_color" value="#e9d8fd" id="bg_purple_light">
                                <label for="bg_purple_light" class="color-option" style="background: #e9d8fd;" data-name="Morado Claro"></label>

                                <input type="radio" name="bg_color" value="#d6bcfa" id="bg_purple_soft">
                                <label for="bg_purple_soft" class="color-option" style="background: #d6bcfa;" data-name="Morado Suave"></label>

                                <input type="radio" name="bg_color" value="#fef5e7" id="bg_cream">
                                <label for="bg_cream" class="color-option" style="background: #fef5e7;" data-name="Crema"></label>

                                <input type="radio" name="bg_color" value="#fefcbf" id="bg_yellow_light">
                                <label for="bg_yellow_light" class="color-option" style="background: #fefcbf;" data-name="Amarillo Claro"></label>

                                <input type="radio" name="bg_color" value="#fed7cc" id="bg_orange_light">
                                <label for="bg_orange_light" class="color-option" style="background: #fed7cc;" data-name="Naranja Claro"></label>
                            </div>
                        </div>



                        <div class="size-group">
                            <label>📏 Tamaño del QR:</label>
                            <div class="size-options">
                                <input type="radio" name="qr_size" value="small" id="size_small">
                                <label for="size_small" class="size-option">Pequeño</label>

                                <input type="radio" name="qr_size" value="medium" id="size_medium" checked>
                                <label for="size_medium" class="size-option">Mediano</label>

                                <input type="radio" name="qr_size" value="large" id="size_large">
                                <label for="size_large" class="size-option">Grande</label>
                            </div>
                        </div>

                        <div class="toggle-section">
                            <span style="font-weight: bold; color: #4a5568;">🏷️ Incluir Logo Automático</span>
                            <label class="toggle-switch">
                                <input type="checkbox" name="include_logo" id="include_logo" checked>
                                <span class="slider"></span>
                            </label>
                        </div>

                        <button type="button" onclick="customizeQR()">🎨 Personalizar QR</button>
                    </form>
                </div>

                <button onclick="location.href='/'">🔙 Volver al Inicio</button>
                <a href="data:image/png;base64,{img_base64}" download="qr_code.png">
                    <button class="download-btn">📥 Descargar QR</button>
                </a>
            </div>

            <script>
                function customizeQR() {
                    const form = document.getElementById('customizeForm');
                    const formData = new FormData(form);

                    // Crear URL con parámetros
                    const params = new URLSearchParams();
                    for (let [key, value] of formData.entries()) {{
                        params.append(key, value);
                    }}

                    // Enviar como POST
                    const form2 = document.createElement('form');
                    form2.method = 'POST';
                    form2.action = '/';

                    for (let [key, value] of formData.entries()) {{
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = key;
                        input.value = value;
                        form2.appendChild(input);
                    }}

                    document.body.appendChild(form2);
                    form2.submit();
                }}
            </script>
        </body>
        </html>'''
        return render_template_string(qr_result_html)

    return render_template_string(HTML)
# Run the app in debug mode so you can easily iterate.

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
    