const puppeteer = require('puppeteer');

// --- CONFIGURACIÓN ---
const messageToSend = process.argv[2]; 
const chatName = "Ezequiel Mazzarello"; // Tu usuario
const SESSION_DIR = '/home/pptruser/teams_session'; 
const finalMessage = messageToSend || "🤖 SmartBot v4.1: Prueba de conexión.";

const delay = (time) => new Promise(resolve => setTimeout(resolve, time));

(async () => {
    console.log("========================================");
    console.log("🤖 INICIANDO SMART-BOT TEAMS v4.1 (Fix Puppeteer)");
    console.log("========================================");

    const browser = await puppeteer.launch({
        headless: "new",
        userDataDir: SESSION_DIR,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1920,1080',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=site-per-process'
        ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // --- ZONA DE COOKIES ---
    const sessionCookies = [
        // ... PEGÁ ACÁ TU ARRAY DE COOKIES SI QUERÉS REFORZAR ...
    ];

    if (sessionCookies.length > 0) {
        try {
            if (sessionCookies[0].name) {
                console.log("🍪 Inyectando cookies...");
                await page.setCookie(...sessionCookies);
            }
        } catch (e) { console.error("⚠️ Error cookies:", e.message); }
    }

    try {
        console.log("🌐 Navegando a teams.live.com...");
        await page.goto('https://teams.live.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // --- CEREBRO (Loop de Análisis) ---
        let isLoggedIn = false;
        let attempts = 0;
        const maxAttempts = 15; // Damos más tiempo (75 segs) porque vimos que carga lento

        while (attempts < maxAttempts && !isLoggedIn) {
            attempts++;
            console.log(`🧠 Análisis de estado (Intento ${attempts}/${maxAttempts})...`);
            
            // 1. ¿ESTAMOS ADENTRO? (Lista de chats)
            const chatList = await page.$('[role="list"], .chat-list-item, [data-tid="chat-list-item"]');
            if (chatList) {
                console.log("✅ ¡ESTAMOS ADENTRO!");
                isLoggedIn = true;
                break;
            }

            // 2. ¿PORTADA DE MARKETING? (Usando sintaxis nueva xpath/)
            // Buscamos botones que digan "Sign in" o "Iniciar"
            const signInXpath = "xpath///a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'sign in')] | //a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'iniciar')]";
            const signInBtn = await page.$$(signInXpath);
            
            if (signInBtn.length > 0) {
                console.log("⚠️ Detectada Portada. Clickeando 'Sign in'...");
                try {
                    await signInBtn[0].click();
                    await delay(5000); // Esperar a que reaccione
                    continue;
                } catch (e) {}
            }

            // 3. ¿PASSWORD?
            const passwordInput = await page.$('input[name="passwd"], input[type="password"]');
            if (passwordInput) {
                throw new Error("LOGIN_REQUIRED: Pide contraseña manual.");
            }

            // 4. ¿SELECTOR DE CUENTAS?
            const accountTile = await page.$('.table-row, [data-test-id="tile_container"]');
            if (accountTile) {
                console.log("👀 Eligiendo cuenta...");
                await accountTile.click();
                await delay(3000);
                continue;
            }

            // 5. ¿POPUP MANTENER SESIÓN?
            const staySignedIn = await page.$('input[type="submit"][value="Sí"], input[type="submit"][value="Yes"], #idSIButton9');
            if (staySignedIn) {
                console.log("👀 Aceptando 'Mantener sesión'...");
                await staySignedIn.click();
                await delay(3000);
                continue;
            }
            
            // Si llegamos acá y no pasó nada, es que está cargando (Spinner violeta)
            console.log("⏳ Esperando carga (o spinner)...");
            await delay(5000);
        }

        if (!isLoggedIn) throw new Error("Timeout: No se pudo entrar al chat.");

        // --- ENVÍO DE MENSAJE ---
        console.log("🔎 Buscando contacto:", chatName);
        await delay(3000); 

        // Usamos la sintaxis nueva para buscar el chat por texto
        const targetSelector = `xpath///span[contains(text(), '${chatName}')]`;
        
        try {
            // Esperar a que aparezca
            await page.waitForSelector(targetSelector, { timeout: 20000 });
            const chatElements = await page.$$(targetSelector);
            
            if (chatElements.length > 0) {
                console.log("🖱️ Abriendo chat...");
                await chatElements[0].click();
                
                console.log("📝 Buscando caja de texto...");
                await page.waitForSelector('[contenteditable="true"], .ck-editor__editable', { timeout: 20000 });
                
                console.log("⌨️ Escribiendo...");
                await page.click('[contenteditable="true"], .ck-editor__editable');
                await page.keyboard.type(finalMessage);
                await delay(500);
                await page.keyboard.press('Enter');
                
                console.log("🚀 MENSAJE ENVIADO.");
                await delay(5000);
            } else {
                throw new Error("Chat no encontrado en la lista visual.");
            }
        } catch (e) {
            throw new Error(`Error buscando chat: ${e.message}`);
        }

    } catch (error) {
        console.error("❌ ERROR FATAL:", error.message);
        try {
            await page.screenshot({ path: `${SESSION_DIR}/error_debug_v4.png`, fullPage: true });
            console.log("📸 Foto guardada: error_debug_v4.png");
        } catch (e) {}
    } finally {
        await browser.close();
    }
})();
