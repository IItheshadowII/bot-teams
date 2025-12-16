const puppeteer = require('puppeteer');
const fs = require('fs'); // Necesario para borrar el candado
const path = require('path');

// --- CONFIGURACIÓN ---
const messageToSend = process.argv[2]; 
const chatName = "Ezequiel Mazzarello"; 
const SESSION_DIR = '/home/pptruser/teams_session'; 
const finalMessage = messageToSend || "🤖 SmartBot v4.3: Prueba con Auto-Unlock.";

const delay = (time) => new Promise(resolve => setTimeout(resolve, time));

(async () => {
    console.log("========================================");
    console.log("🤖 INICIANDO SMART-BOT TEAMS v4.3 (Cerrajero)");
    console.log("========================================");

    // 🧹 LIMPIEZA DE CANDADOS VIEJOS (El Fix del Error Actual)
    try {
        const lockFile = path.join(SESSION_DIR, 'SingletonLock');
        if (fs.existsSync(lockFile)) {
            console.log("🔐 Detectado archivo de bloqueo (SingletonLock). Eliminando para liberar sesión...");
            fs.unlinkSync(lockFile);
            console.log("🔓 Sesión liberada con éxito.");
        }
    } catch (e) {
        console.error("⚠️ No se pudo limpiar el lockfile (quizás no existía o falta permiso):", e.message);
    }

    const browser = await puppeteer.launch({
        headless: "new",
        userDataDir: SESSION_DIR,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Mantiene la memoria estable
            '--disable-gpu',
            '--disable-accelerated-2d-canvas',
            '--window-size=1920,1080',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // --- ZONA DE COOKIES ---
    // Si ya lograste loguearte antes, esto puede estar vacío.
    // Si borraste todo, ponelas de nuevo.
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
        console.log("🌐 Navegando a teams.live.com...");
        await page.goto('https://teams.live.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // --- CEREBRO ---
        let isLoggedIn = false;
        let attempts = 0;
        const maxAttempts = 20; 

        while (attempts < maxAttempts && !isLoggedIn) {
            attempts++;
            console.log(`🧠 Estado (Intento ${attempts}/${maxAttempts})...`);
            
            // 0. AVISO DE DESCARGA
            const useWebXpath = "xpath///a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'web')]";
            const useWebBtn = await page.$$(useWebXpath);
            if (useWebBtn.length > 0) {
                console.log("⚠️ Detectado aviso de descarga. Clickeando 'Usar Web App'...");
                try { await useWebBtn[0].click(); await delay(5000); } catch(e){}
            }

            // 1. ESTAMOS ADENTRO
            const chatList = await page.$('[role="list"], .chat-list-item, [data-tid="chat-list-item"]');
            if (chatList) {
                console.log("✅ ¡ESTAMOS ADENTRO!");
                isLoggedIn = true;
                break;
            }

            // 2. PORTADA
            const signInXpath = "xpath///a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'sign in')] | //a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'iniciar')]";
            const signInBtn = await page.$$(signInXpath);
            if (signInBtn.length > 0) {
                console.log("⚠️ Portada detectada. Clickeando 'Sign in'...");
                try { await signInBtn[0].click(); await delay(5000); continue; } catch (e) {}
            }

            // 3. PASSWORD (ERROR)
            const passwordInput = await page.$('input[name="passwd"], input[type="password"]');
            if (passwordInput) throw new Error("LOGIN_REQUIRED: Pide contraseña.");

            // 4. SELECTOR CUENTA
            const accountTile = await page.$('.table-row, [data-test-id="tile_container"]');
            if (accountTile) {
                console.log("👀 Eligiendo cuenta...");
                await accountTile.click();
                await delay(3000); continue;
            }

            // 5. MANTENER SESIÓN
            const staySignedIn = await page.$('input[type="submit"][value="Sí"], input[type="submit"][value="Yes"], #idSIButton9');
            if (staySignedIn) {
                console.log("👀 Aceptando 'Mantener sesión'...");
                await staySignedIn.click();
                await delay(3000); continue;
            }

            // ANTI-SPINNER
            if (attempts === 8) {
                console.log("🔄 REFRESH FORZADO (F5)...");
                await page.reload({ waitUntil: "domcontentloaded" });
                await delay(5000);
            }
            
            console.log("⏳ Esperando carga...");
            await delay(5000);
        }

        if (!isLoggedIn) throw new Error("Timeout Login.");

        // --- ENVÍO ---
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
        console.error("❌ ERROR FATAL:", error.message);
        try {
            await page.screenshot({ path: `${SESSION_DIR}/error_debug_v4_3.png`, fullPage: true });
            console.log("📸 Foto error guardada: error_debug_v4_3.png");
        } catch (e) {}
    } finally {
        await browser.close();
    }
})();
