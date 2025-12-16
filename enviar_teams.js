const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// --- CONFIGURACIÓN ---
const messageToSend = process.argv[2]; 
const chatName = "Ezequiel Mazzarello"; 
const SESSION_DIR = '/home/pptruser/teams_session'; 
const finalMessage = messageToSend || "🤖 SmartBot v5.0: Prueba de acceso directo.";

const delay = (time) => new Promise(resolve => setTimeout(resolve, time));

(async () => {
    console.log("========================================");
    console.log("🤖 INICIANDO SMART-BOT TEAMS v5.0 (Francotirador)");
    console.log("========================================");

    // 1. AUTO-UNLOCK (Limpieza de candados)
    try {
        const lockFile = path.join(SESSION_DIR, 'SingletonLock');
        try { fs.unlinkSync(lockFile); console.log("🔓 Lock eliminado."); } catch (e) {}
    } catch (e) {}

    const browser = await puppeteer.launch({
        headless: "new",
        userDataDir: SESSION_DIR,
        args: [
            '--no-sandbox', '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', '--disable-gpu',
            '--disable-accelerated-2d-canvas',
            '--window-size=1920,1080',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // 2. INYECCIÓN DE COOKIES
    // --- ¡PEGÁ TUS COOKIES ACÁ O NO VA A FUNCIONAR! ---
    const sessionCookies = [
       // ... TUS COOKIES ...
    ];

    if (sessionCookies.length > 0 && sessionCookies[0].name) {
        try {
            console.log("🍪 Inyectando cookies...");
            await page.setCookie(...sessionCookies);
        } catch (e) { console.error("⚠️ Error cookies:", e.message); }
    }

    try {
        // 3. ESTRATEGIA DE ACCESO DIRECTO
        // Intentamos ir a la versión V2 (WebApp) directo para saltar la portada
        console.log("🌐 Navegando directo a la WebApp (/v2/)...");
        await page.goto('https://teams.live.com/v2/', { waitUntil: 'domcontentloaded', timeout: 60000 });

        let isLoggedIn = false;
        let attempts = 0;
        const maxAttempts = 20; 

        while (attempts < maxAttempts && !isLoggedIn) {
            attempts++;
            console.log(`🧠 Análisis (Intento ${attempts}/${maxAttempts})...`);
            
            // A. ¿YA ESTAMOS ADENTRO?
            const chatList = await page.$('[role="list"], .chat-list-item, [data-tid="chat-list-item"]');
            if (chatList) {
                console.log("✅ ¡ESTAMOS ADENTRO!");
                isLoggedIn = true;
                break;
            }

            // B. ¿ESTAMOS EN LA PORTADA? (NUEVO SELECTOR BASADO EN TU FOTO)
            // Buscamos botones específicos por atributo data-onclick o texto
            const signInSelectors = [
                '[data-onclick="SignIn"]', // El que sale en tu inspector
                'button[data-bi-id="header-sign-in-button"]',
                'xpath///button[contains(., "Iniciar sesión")]',
                'xpath///button[contains(., "Sign in")]'
            ];

            for (const selector of signInSelectors) {
                let btn;
                if (selector.startsWith('xpath')) {
                    const els = await page.$$(selector);
                    if (els.length > 0) btn = els[0];
                } else {
                    btn = await page.$(selector);
                }

                if (btn) {
                    console.log(`⚠️ Botón de Login detectado (${selector}). Clickeando...`);
                    try { 
                        await btn.click(); 
                        await delay(5000); 
                        // Rompemos el loop interno para volver a analizar la pantalla
                        break; 
                    } catch (e) { console.log("Click falló, probando siguiente..."); }
                }
            }

            // C. ¿PASSWORD? (Si aparece esto, LAS COOKIES MURIERON)
            const passwordInput = await page.$('input[name="passwd"], input[type="password"]');
            if (passwordInput) {
                throw new Error("LOGIN_REQUIRED: Las cookies fueron rechazadas. Se requiere contraseña.");
            }

            // D. ¿SELECTOR DE CUENTA?
            const accountTile = await page.$('.table-row, [data-test-id="tile_container"]');
            if (accountTile) {
                console.log("👀 Eligiendo cuenta...");
                await accountTile.click();
                await delay(3000); continue;
            }
            
            // E. ¿POPUP MANTENER SESIÓN?
            const staySignedIn = await page.$('input[type="submit"][value="Sí"], input[type="submit"][value="Yes"], #idSIButton9');
            if (staySignedIn) {
                console.log("👀 Aceptando 'Mantener sesión'...");
                await staySignedIn.click();
                await delay(3000); continue;
            }

            // ANTI-SPINNER (Recarga si se traba)
            if (attempts === 8) {
                console.log("🔄 REFRESH FORZADO...");
                await page.reload({ waitUntil: "domcontentloaded" });
                await delay(5000);
            }
            
            console.log("⏳ Esperando...");
            await delay(4000);
        }

        if (!isLoggedIn) throw new Error("Timeout: No se pudo entrar al chat.");

        // --- ENVÍO DE MENSAJE ---
        console.log("🔎 Buscando contacto:", chatName);
        await delay(3000); 

        const targetSelector = `xpath///span[contains(text(), '${chatName}')]`;
        
        try {
            await page.waitForSelector(targetSelector, { timeout: 20000 });
            const chatElements = await page.$$(targetSelector);
            
            if (chatElements.length > 0) {
                console.log("🖱️ Abriendo chat...");
                await chatElements[0].click();
                
                console.log("📝 Buscando caja de texto...");
                await page.waitForSelector('[contenteditable="true"]', { timeout: 20000 });
                await delay(1000);

                console.log("⌨️ Escribiendo...");
                await page.type('[contenteditable="true"]', finalMessage);
                await delay(500);
                await page.keyboard.press('Enter');
                
                console.log("🚀 MENSAJE ENVIADO.");
                await delay(5000);
            } else {
                throw new Error("Chat no encontrado.");
            }
        } catch (e) {
            throw new Error(`Error envío: ${e.message}`);
        }

    } catch (error) {
        console.error("❌ ERROR:", error.message);
        try {
            await page.screenshot({ path: `${SESSION_DIR}/error_debug_v5.png`, fullPage: true });
            console.log("📸 Foto error: error_debug_v5.png");
        } catch (e) {}
    } finally {
        await browser.close();
    }
})();
