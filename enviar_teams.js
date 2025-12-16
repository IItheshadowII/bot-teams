const puppeteer = require('puppeteer');

// --- CONFIGURACIÓN ---
const messageToSend = process.argv[2]; 
const chatName = "Ezequiel Mazzarello"; // Tu usuario
const SESSION_DIR = '/home/pptruser/teams_session'; 
const finalMessage = messageToSend || "🤖 SmartBot: Prueba de conexión.";

// Función de espera (Sleep)
const delay = (time) => new Promise(resolve => setTimeout(resolve, time));

(async () => {
    console.log("========================================");
    console.log("🤖 INICIANDO SMART-BOT TEAMS v4.0");
    console.log("========================================");

    const browser = await puppeteer.launch({
        headless: "new",
        userDataDir: SESSION_DIR,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1920,1080',
            '--disable-blink-features=AutomationControlled', // Oculta que es robot
            '--disable-features=site-per-process'
        ]
    });

    const page = await browser.newPage();
    
    // User-Agent de Windows 10 Real (Importante para que no te tiren captcha)
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // --- ZONA DE COOKIES (Opcional si ya tenés persistencia, pero dejalo por seguridad) ---
    // PEGÁ ACÁ TU ARRAY DE COOKIES ACTUALIZADO SI TENÉS UNO NUEVO
    const sessionCookies = [
        // ... (Tus cookies van acá) ...
        // Asegurate de que el JSON esté bien formado
    ];

    if (sessionCookies.length > 0) {
        try {
            // Checkeo rápido para no romper si el JSON está vacío
            if (sessionCookies[0].name) {
                console.log("🍪 Inyectando cookies de respaldo...");
                await page.setCookie(...sessionCookies);
            }
        } catch (e) {
            console.error("⚠️ Error inyectando cookies (formato incorrecto?):", e.message);
        }
    }

    try {
        console.log("🌐 Navegando a teams.live.com...");
        await page.goto('https://teams.live.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // --- EL CEREBRO (Bucle de Análisis) ---
        // Intentaremos entender dónde estamos durante 60 segundos
        let isLoggedIn = false;
        let attempts = 0;
        const maxAttempts = 12; // 12 intentos de 5 segundos = 60 segs max

        while (attempts < maxAttempts && !isLoggedIn) {
            attempts++;
            console.log(`🧠 Análisis de estado (Intento ${attempts}/${maxAttempts})...`);
            
            // 1. ¿ESTAMOS ADENTRO? (Buscamos la lista de chats)
            const chatList = await page.$('[role="list"], .chat-list-item, [data-tid="chat-list-item"]');
            if (chatList) {
                console.log("✅ ¡ESTAMOS ADENTRO! Interfaz de chat detectada.");
                isLoggedIn = true;
                break;
            }

            // 2. ¿ESTAMOS EN LA PORTADA DE MARKETING? (Tu foto error_debug_v2.jpg)
            // Buscamos botones de "Sign in"
            const signInBtn = await page.$x("//a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'sign in')] | //a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'iniciar')]");
            
            if (signInBtn.length > 0) {
                console.log("⚠️ Detectada Portada de Marketing. Intentando clic en 'Sign in'...");
                
                // A veces hay varios, clickeamos el primero que sea visible
                try {
                    await signInBtn[0].click();
                    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => console.log("Navegación lenta, esperando..."));
                    continue; // Reiniciamos el loop para ver a dónde nos llevó
                } catch (e) {
                    console.log("Error al clickear Sign in, reintentando...");
                }
            }

            // 3. ¿NOS PIDEN PASSWORD? (Si llegamos acá, las cookies murieron)
            const passwordInput = await page.$('input[name="passwd"], input[type="password"]');
            if (passwordInput) {
                console.error("⛔ ALERTA: Microsoft pide contraseña. Las cookies expiraron o son inválidas para esta IP.");
                throw new Error("LOGIN_REQUIRED: Se requiere contraseña manual.");
            }

            // 4. ¿NOS PIDEN ELEGIR CUENTA? (Pick an account)
            const accountTile = await page.$('.table-row, [data-test-id="tile_container"]');
            if (accountTile) {
                console.log("👀 Selector de cuentas detectado. Eligiendo la primera...");
                await accountTile.click();
                await delay(3000);
                continue;
            }

            // 5. ¿POPUP DE 'MANTENER SESIÓN'?
            const staySignedIn = await page.$('input[type="submit"][value="Sí"], input[type="submit"][value="Yes"], #idSIButton9');
            if (staySignedIn) {
                console.log("👀 Popup 'Mantener sesión' detectado. Aceptando...");
                await staySignedIn.click();
                await delay(3000);
                continue;
            }

            console.log("⏳ Esperando carga...");
            await delay(5000);
        }

        if (!isLoggedIn) {
            throw new Error("No se pudo iniciar sesión después de varios intentos.");
        }

        // --- FASE DE ENVÍO ---
        console.log("🔎 Buscando contacto:", chatName);
        
        // Espera de seguridad para que renderice la lista
        await delay(3000); 

        // XPath robusto para buscar texto en spans, divs o h3
        const targetXpath = `//*[contains(text(), '${chatName}')]`;
        try {
            await page.waitForXPath(targetXpath, { timeout: 20000 });
            const chatElements = await page.$x(targetXpath);
            
            if (chatElements.length > 0) {
                console.log("🖱️ Contacto encontrado. Abriendo chat...");
                await chatElements[0].click();
                
                console.log("📝 Buscando caja de texto...");
                // Selector más genérico para el editor
                await page.waitForSelector('[contenteditable="true"], .ck-editor__editable', { timeout: 20000 });
                
                console.log("⌨️ Escribiendo mensaje...");
                // Focus y Type
                await page.click('[contenteditable="true"], .ck-editor__editable');
                await page.keyboard.type(finalMessage);
                await delay(500);
                await page.keyboard.press('Enter');
                
                console.log("🚀 MENSAJE ENVIADO.");
                await delay(3000); // Dar tiempo a que salga
            } else {
                throw new Error(`Contacto '${chatName}' no visible en la lista.`);
            }
        } catch (e) {
            throw new Error(`Error en el flujo de chat: ${e.message}`);
        }

    } catch (error) {
        console.error("❌ ERROR FATAL:", error.message);
        
        // FOTO DE DIAGNÓSTICO
        try {
            const shotPath = `${SESSION_DIR}/error_debug_final.png`;
            await page.screenshot({ path: shotPath, fullPage: true });
            console.log(`📸 Foto del error guardada en: ${shotPath} (Bajala con docker cp)`);
        } catch (e) { console.error("No se pudo sacar foto."); }
        
    } finally {
        console.log("👋 Cerrando navegador.");
        await browser.close();
    }
})();
