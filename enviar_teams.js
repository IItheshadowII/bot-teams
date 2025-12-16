const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
puppeteer.use(StealthPlugin());

// ==========================================
// ⚙️ VARIABLES DE ENTORNO (EASYPANEL)
// ==========================================
const USER_EMAIL = process.env.TEAMS_EMAIL;
const USER_PASS = process.env.TEAMS_PASSWORD;
// En tu caso, el nombre exacto que se ve en la barra lateral
const GROUP_NAME = process.env.TEAMS_GROUP_NAME || "AnyDesk Management"; 

// Ruta para screenshots (dentro del contenedor, mapeada a host via volumen)
const SCREENSHOT_PATH = '/home/pptruser/screenshots';

// Crear directorio de screenshots si no existe
(async () => {
    try {
        await fs.mkdir(SCREENSHOT_PATH, { recursive: true });
    } catch (e) {
        // Ignorar si ya existe
    }
})();

// Argumentos desde n8n/consola
const args = process.argv.slice(2);
const anydeskID = args[0] || "ID_DESCONOCIDO";
const pcName = args[1] || "SIN_NOMBRE";

const mensaje = `🚨 **Nuevo Anydesk Detectado**\n💻 Equipo: ${pcName}\n🆔 ID: ${anydeskID}\n\n👉 Por favor agregar a la lista.`;

(async () => {
    console.log(`🤖 INICIANDO BOT (Modo: Buscar "${GROUP_NAME}")...`);
    
    const browser = await puppeteer.launch({
        headless: "new",
        userDataDir: '/home/pptruser/teams_session', // Ruta del volumen montado en EasyPanel
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    try {
        // 1. Ir a la home de Teams Personal
        console.log('🌐 Entrando a Teams (Live)...');
        await page.goto('https://teams.live.com/v2/', { waitUntil: 'networkidle2', timeout: 90000 });
        
        // Esperar un poco para redirecciones
        await new Promise(r => setTimeout(r, 3000));

        // -----------------------------------------------------
        // 🔐 LOGIN (Soporta Live.com y Microsoft)
        // -----------------------------------------------------
        // Detectar si redirige a /free/ (no autenticado) o a login
        let currentUrl = page.url();
        console.log('📍 URL después de navegar:', currentUrl);
        
        if (currentUrl.includes('/free/') || currentUrl.includes('login.') || currentUrl.includes('signin')) {
            console.log('🔒 No está autenticado. Iniciando login...');
            
            // Si está en /free/, ir directo a login
            if (currentUrl.includes('/free/')) {
                console.log('↪️ Redirigiendo a login...');
                await page.goto('https://login.live.com/login.srf?wa=wsignin1.0&rpsnv=150&ct=1702684800&rver=7.0.6738.0&wp=MBI_SSL&wreply=https://teams.live.com/v2/', { waitUntil: 'networkidle2', timeout: 90000 });
                await new Promise(r => setTimeout(r, 2000));
                console.log('📍 URL después de ir a login:', page.url());
            }
            
            // Email
            console.log('📧 Ingresando email...');
            await page.waitForSelector('input[type="email"]', { timeout: 30000 });
            await page.type('input[type="email"]', USER_EMAIL, { delay: 50 });
            await page.screenshot({ path: `${SCREENSHOT_PATH}/debug_01_email_entered.png` });
            console.log('✅ Email ingresado, presionando Enter...');
            await page.keyboard.press('Enter');
            await new Promise(r => setTimeout(r, 3000));
            console.log('📍 URL después de email:', page.url());

            // Password - Microsoft puede mostrar página FIDO primero
            console.log('🔑 Esperando campo de contraseña...');
            
            // Verificar si estamos en página FIDO (sin contraseña)
            let currentUrlAfterEmail = page.url();
            if (currentUrlAfterEmail.includes('fido/get')) {
                console.log('⚠️ Detectada página de autenticación FIDO (passkey). Haciendo click en Back...');
                
                // Tomar screenshot para debug
                await page.screenshot({ path: `${SCREENSHOT_PATH}/debug_fido_page.png` });
                
                // Hacer click en el botón "Back"
                try {
                    const backButton = await page.waitForSelector('input[value="Back"], button:has-text("Back"), #idBtn_Back', { timeout: 5000 });
                    if (backButton) {
                        console.log('✅ Botón Back encontrado, haciendo click...');
                        await Promise.all([
                            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => console.log('⚠️ No hubo navegación después del click')),
                            backButton.click()
                        ]);
                        await new Promise(r => setTimeout(r, 3000));
                        console.log('📍 URL después de Back:', page.url());
                    }
                } catch (e) {
                    console.log('⚠️ Error con botón Back:', e.message);
                }
                
                // Verificar si ahora hay opciones de login
                currentUrlAfterEmail = page.url();
                if (currentUrlAfterEmail.includes('fido/get')) {
                    console.log('⚠️ Aún en página FIDO después de Back. Buscando opción de contraseña...');
                    // Buscar "Sign-in options" o links de password
                    const signInOptionsLink = await page.$x("//a[contains(., 'Sign-in options') or contains(., 'sign-in options') or contains(., 'Other ways to sign in')]");
                    if (signInOptionsLink.length > 0) {
                        console.log('✅ Encontrado link de opciones, haciendo click...');
                        await signInOptionsLink[0].click();
                        await new Promise(r => setTimeout(r, 3000));
                    }
                }
            }
            
            try {
                await page.waitForSelector('input[type="password"]', { timeout: 30000 });
                console.log('✅ Campo de contraseña encontrado');
                await page.type('input[type="password"]', USER_PASS, { delay: 50 });
                await page.screenshot({ path: `${SCREENSHOT_PATH}/debug_02_password_entered.png` });
                console.log('✅ Contraseña ingresada, presionando Enter...');
                await page.keyboard.press('Enter');
            } catch (e) {
                console.error('❌ No se encontró el campo de contraseña');
                console.log('📍 URL actual:', page.url());
                const html = await page.content();
                console.log('📄 HTML (primeros 1000 chars):', html.substring(0, 1000));
                await page.screenshot({ path: `${SCREENSHOT_PATH}/debug_password_not_found.png` });
                
                // Buscar todos los inputs en la página
                const inputs = await page.evaluate(() => {
                    return Array.from(document.querySelectorAll('input')).map(input => ({
                        type: input.type,
                        name: input.name,
                        id: input.id,
                        placeholder: input.placeholder
                    }));
                });
                console.log('🔍 Inputs encontrados en la página:', JSON.stringify(inputs, null, 2));
                throw e;
            }
            
            // "Mantener sesión"
            console.log('💾 Guardando sesión...');
            try {
                await page.waitForSelector('#idSIButton9', { timeout: 10000 });
                await page.click('#idSIButton9');
            } catch (e) { 
                console.log('ℹ️ No apareció confirmación de sesión (puede ser normal).'); 
            }
            
            // Esperar a que redirija a Teams después del login
            console.log('⏳ Esperando redirección a Teams...');
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {
                console.log('⚠️ Timeout esperando navegación, continuando...');
            });
            
            // Esperar extra para que Teams cargue completamente
            await new Promise(r => setTimeout(r, 5000));
            console.log('✅ Login completado. URL actual:', page.url());
        } else {
            console.log('✅ Ya estaba autenticado.');
        }
        
        // Verificación final: Si aún está en /free/, algo falló
        currentUrl = page.url();
        if (currentUrl.includes('/free/')) {
            await page.screenshot({ path: `${SCREENSHOT_PATH}/stuck_in_free.png` });
            throw new Error('Teams sigue redirigiendo a /free/ después del login. La sesión no persiste o las credenciales son incorrectas. Ver screenshot stuck_in_free.png');
        }

        // -----------------------------------------------------
        // 🔍 BUSCAR Y CLICKEAR EL GRUPO
        // -----------------------------------------------------
        console.log(`👀 Buscando chat: "${GROUP_NAME}"...`);
        
        // Esperar a que Teams cargue completamente (varios selectores posibles)
        console.log('⏳ Esperando que cargue la interfaz de Teams...');
        await Promise.race([
            page.waitForSelector('div[role="listitem"]', { timeout: 60000 }),
            page.waitForSelector('[data-tid="chat-list"]', { timeout: 60000 }),
            page.waitForSelector('div[role="navigation"]', { timeout: 60000 }),
            page.waitForSelector('button[aria-label*="Chat"]', { timeout: 60000 })
        ]).catch(async (err) => {
            console.log('⚠️ No se detectó la interfaz esperada. URL actual:', page.url());
            const html = await page.content();
            console.log('📄 HTML snippet (primeros 500 chars):', html.substring(0, 500));
            await page.screenshot({ path: `${SCREENSHOT_PATH}/debug_no_interface.png` });
            throw new Error('Teams no cargó correctamente. Ver screenshot debug_no_interface.png');
        });

        console.log('✅ Interfaz cargada. Buscando chat por texto...');
        
        // Estrategia 1: Buscar por XPath usando texto exacto
        let target = null;
        try {
            target = await page.waitForSelector(`::-p-xpath(//*[contains(text(), "${GROUP_NAME}")])`, { timeout: 10000 });
        } catch (e) {
            console.log('⚠️ No encontrado con XPath exacto, intentando búsqueda parcial...');
        }

        // Estrategia 2: Si falla, buscar en todos los elementos visibles
        if (!target) {
            const allText = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('*')).map(el => el.textContent?.trim()).filter(Boolean);
            });
            console.log('📋 Textos encontrados en página (primeros 20):', allText.slice(0, 20));
            
            // Intenta con click por coordenadas si encuentras el texto
            const elements = await page.$x(`//*[contains(text(), "${GROUP_NAME}")]`);
            if (elements.length > 0) {
                target = elements[0];
                console.log('✅ Chat encontrado con búsqueda alternativa.');
            }
        }

        if (target) {
            console.log('✅ Chat encontrado. Haciendo click...');
            await target.click();
            await new Promise(r => setTimeout(r, 2000)); // Esperar que abra
        } else {
            await page.screenshot({ path: `${SCREENSHOT_PATH}/debug_chat_not_found.png` });
            throw new Error(`No encontré el chat "${GROUP_NAME}" en la lista. Ver screenshot debug_chat_not_found.png`);
        }

        // -----------------------------------------------------
        // 📝 ENVIAR MENSAJE
        // -----------------------------------------------------
        console.log('⏳ Esperando input de chat...');
        // Selector para Teams Personal (puede variar, buscamos el editor)
        const selectorInput = '[contenteditable="true"], [data-tid="ckeditor-editor"]'; 
        
        await page.waitForSelector(selectorInput, { timeout: 20000 });
        await page.click(selectorInput);
        
        console.log('✍️ Escribiendo...');
        await page.type(selectorInput, mensaje, { delay: 10 });
        await page.keyboard.press('Enter');
        
        await new Promise(r => setTimeout(r, 3000)); // Esperar envío
        console.log('🚀 MENSAJE ENVIADO.');

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        await page.screenshot({ path: `${SCREENSHOT_PATH}/error_debug_teams.png` });
    } finally {
        await browser.close();
    }
})();
