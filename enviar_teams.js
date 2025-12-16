const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// ==========================================
// ⚙️ VARIABLES DE ENTORNO (EASYPANEL)
// ==========================================
const USER_EMAIL = process.env.TEAMS_EMAIL;
const USER_PASS = process.env.TEAMS_PASSWORD;
// En tu caso, el nombre exacto que se ve en la barra lateral
const GROUP_NAME = process.env.TEAMS_GROUP_NAME || "AnyDesk Management"; 

// Argumentos desde n8n/consola
const args = process.argv.slice(2);
const anydeskID = args[0] || "ID_DESCONOCIDO";
const pcName = args[1] || "SIN_NOMBRE";

const mensaje = `🚨 **Nuevo Anydesk Detectado**\n💻 Equipo: ${pcName}\n🆔 ID: ${anydeskID}\n\n👉 Por favor agregar a la lista.`;

(async () => {
    console.log(`🤖 INICIANDO BOT (Modo: Buscar "${GROUP_NAME}")...`);
    
    const browser = await puppeteer.launch({
        headless: "new",
        userDataDir: './teams_data', // Persistencia activada
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    try {
        // 1. Ir a la home de Teams Personal
        console.log('🌐 Entrando a Teams (Live)...');
        await page.goto('https://teams.live.com/v2/', { waitUntil: 'networkidle2' });

        // -----------------------------------------------------
        // 🔐 LOGIN (Soporta Live.com y Microsoft)
        // -----------------------------------------------------
        if (page.url().includes('login.') || page.url().includes('signin')) {
            console.log('🔒 Detectado Login. Iniciando...');
            
            // Email
            await page.waitForSelector('input[type="email"]');
            await page.type('input[type="email"]', USER_EMAIL, { delay: 50 });
            await page.keyboard.press('Enter');
            await new Promise(r => setTimeout(r, 2000));

            // Password
            await page.waitForSelector('input[type="password"]');
            await page.type('input[type="password"]', USER_PASS, { delay: 50 });
            await page.keyboard.press('Enter');
            
            // "Mantener sesión"
            try {
                await page.waitForSelector('#idSIButton9', { timeout: 5000 });
                await page.click('#idSIButton9');
            } catch (e) { console.log('ℹ️ Saltando confirmación de sesión.'); }
        }

        // -----------------------------------------------------
        // 🔍 BUSCAR Y CLICKEAR EL GRUPO
        // -----------------------------------------------------
        console.log(`👀 Buscando chat: "${GROUP_NAME}"...`);
        
        // Esperamos que cargue la lista lateral
        await page.waitForSelector('div[role="listitem"]', { timeout: 60000 });

        // Usamos XPath para buscar el TEXTO exacto en la pantalla
        const target = await page.waitForSelector(`::-p-xpath(//*[contains(text(), "${GROUP_NAME}")])`, { timeout: 10000 });

        if (target) {
            console.log('✅ Chat encontrado. Haciendo click...');
            await target.click();
        } else {
            throw new Error(`No encontré el chat "${GROUP_NAME}" en la lista.`);
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
        await page.screenshot({ path: '/app/error_debug_teams.png' });
    } finally {
        await browser.close();
    }
})();
