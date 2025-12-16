const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
puppeteer.use(StealthPlugin());

// ==========================================
// ⚙️ SERVIDOR EXPRESS PARA N8N
// ==========================================
const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// ==========================================
// ⚙️ VARIABLES DE ENTORNO (EASYPANEL)
// ==========================================
const USER_EMAIL = process.env.TEAMS_EMAIL;
const USER_PASS = process.env.TEAMS_PASSWORD;
const GROUP_NAME = process.env.TEAMS_GROUP_NAME || "AnyDesk Management"; 
const SCREENSHOT_PATH = '/home/pptruser/screenshots';

// Crear directorio de screenshots si no existe
(async () => {
    try {
        await fs.mkdir(SCREENSHOT_PATH, { recursive: true });
    } catch (e) {}
})();

// ==========================================
// 📨 FUNCIÓN PARA ENVIAR MENSAJE A TEAMS
// ==========================================
async function enviarMensajeTeams(anydeskID, pcName) {
    const mensaje = `🚨 **Nuevo Anydesk Detectado**\n💻 Equipo: ${pcName}\n🆔 ID: ${anydeskID}\n\n👉 Por favor agregar a la lista.`;
    
    console.log(`🤖 INICIANDO BOT (Grupo: "${GROUP_NAME}")...`);
    
    const browser = await puppeteer.launch({
        headless: "new",
        userDataDir: '/home/pptruser/teams_session',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    try {
        // 1. Ir a Teams Personal
        console.log('🌐 Entrando a Teams (Live)...');
        await page.goto('https://teams.live.com/v2/', { waitUntil: 'networkidle2', timeout: 90000 });
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 2. Verificar autenticación
        const currentUrl = page.url();
        console.log(`📍 URL Actual: ${currentUrl}`);
        
        if (currentUrl.includes('teams.live.com/v2/')) {
            console.log('✅ Ya estaba autenticado, continuando...');
        } else if (currentUrl.includes('login.live.com') || currentUrl.includes('login.microsoftonline.com')) {
            console.log('🔑 Detectada página de login...');
            
            // Verificar FIDO
            if (currentUrl.includes('fido/get')) {
                console.log('⚠️ Página de FIDO detectada. Haciendo clic en "Volver"...');
                await page.waitForSelector('#idBtn_Back', { timeout: 10000 });
                await page.click('#idBtn_Back');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // Email
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });
            await page.type('input[type="email"]', USER_EMAIL, { delay: 50 });
            await new Promise(resolve => setTimeout(resolve, 500));
            await page.click('input[type="submit"]');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Password
            try {
                await page.waitForSelector('input[type="password"]', { timeout: 10000 });
                await page.type('input[type="password"]', USER_PASS, { delay: 50 });
                await new Promise(resolve => setTimeout(resolve, 500));
                await page.click('input[type="submit"]');
            } catch (error) {
                console.log('⚠️ No se encontró campo de password');
            }
            
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // "Mantener sesión"
            try {
                await page.waitForSelector('#idBtn_Back', { timeout: 5000 });
                await page.click('#idBtn_Back');
                console.log('✅ Clic en "No" para mantener sesión');
            } catch (e) {
                console.log('⚠️ No apareció prompt de mantener sesión');
            }
            
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
        }
        
        // 3. Navegar a interfaz de chats
        console.log('📍 Navegando a la interfaz de chats...');
        await page.goto('https://teams.live.com/v2/', { waitUntil: 'networkidle2', timeout: 90000 });
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 4. Buscar el chat usando page.evaluate()
        console.log(`🔍 Buscando chat: "${GROUP_NAME}"...`);
        
        const chatClicked = await page.evaluate((groupName) => {
            const allElements = document.querySelectorAll('*');
            
            for (let elem of allElements) {
                const text = elem.textContent?.trim() || '';
                
                if (text === groupName) {
                    let clickable = elem;
                    
                    while (clickable && clickable !== document.body) {
                        const tagName = clickable.tagName.toLowerCase();
                        const role = clickable.getAttribute('role');
                        
                        if (tagName === 'button' || 
                            tagName === 'a' || 
                            role === 'button' ||
                            clickable.onclick ||
                            window.getComputedStyle(clickable).cursor === 'pointer') {
                            
                            clickable.click();
                            return true;
                        }
                        
                        clickable = clickable.parentElement;
                    }
                }
            }
            
            return false;
        }, GROUP_NAME);
        
        if (!chatClicked) {
            throw new Error(`❌ No se encontró el chat/grupo: "${GROUP_NAME}"`);
        }
        
        console.log('✅ Chat encontrado y clickeado');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 5. Buscar input de mensaje (intentar múltiples selectores)
        console.log('📝 Buscando campo de texto...');
        
        // Screenshot de debug
        try {
            const timestamp = Date.now();
            await page.screenshot({ path: `${SCREENSHOT_PATH}/debug_before_input_${timestamp}.png`, fullPage: true });
            console.log(`📸 Debug screenshot: debug_before_input_${timestamp}.png`);
        } catch (e) {}
        
        let inputSelector = null;
        const possibleSelectors = [
            'div[contenteditable="true"][role="textbox"]',
            'div[contenteditable="true"]',
            '[data-tid="ckeditor-input"]',
            '[role="textbox"][contenteditable="true"]',
            'div.ck-editor__editable',
            'div[data-track-module-name="messageInput"]'
        ];
        
        for (const selector of possibleSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 3000 });
                inputSelector = selector;
                console.log(`✅ Input encontrado con selector: ${selector}`);
                break;
            } catch (e) {
                console.log(`⚠️ Selector no encontrado: ${selector}`);
            }
        }
        
        if (!inputSelector) {
            throw new Error('❌ No se encontró el campo de texto con ningún selector');
        }
        
        // 6. Escribir mensaje
        console.log('✍️ Escribiendo mensaje...');
        await page.click(inputSelector);
        await new Promise(resolve => setTimeout(resolve, 500));
        await page.type(inputSelector, mensaje, { delay: 20 });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 7. Enviar
        console.log('🚀 Enviando mensaje...');
        const sendButtonSelector = 'button[aria-label*="Send"], button[title*="Send"], button[data-tid="newMessageCommands-send"]';
        await page.waitForSelector(sendButtonSelector, { timeout: 10000 });
        await page.click(sendButtonSelector);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ ¡Mensaje enviado exitosamente!');
        
        return { success: true, message: 'Mensaje enviado correctamente' };
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        
        try {
            const timestamp = Date.now();
            await page.screenshot({ path: `${SCREENSHOT_PATH}/error_${timestamp}.png`, fullPage: true });
            console.log(`📸 Screenshot guardado: error_${timestamp}.png`);
        } catch (screenshotError) {
            console.error('No se pudo guardar screenshot:', screenshotError.message);
        }
        
        throw error;
        
    } finally {
        await browser.close();
    }
}

// ==========================================
// 🌐 ENDPOINT PARA N8N
// ==========================================
app.post('/send', async (req, res) => {
    try {
        const { anydeskID, pcName } = req.body;
        
        if (!anydeskID || !pcName) {
            return res.status(400).json({ 
                error: 'Faltan parámetros: anydeskID y pcName son requeridos' 
            });
        }
        
        console.log(`📥 Solicitud recibida - ID: ${anydeskID}, PC: ${pcName}`);
        
        const result = await enviarMensajeTeams(anydeskID, pcName);
        
        res.json({ 
            success: true, 
            message: 'Mensaje enviado correctamente',
            data: { anydeskID, pcName }
        });
        
    } catch (error) {
        console.error('❌ Error procesando solicitud:', error);
        res.status(500).json({ 
            error: 'Error al enviar mensaje', 
            details: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==========================================
// 🚀 INICIAR SERVIDOR
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor escuchando en http://0.0.0.0:${PORT}`);
    console.log(`📨 Endpoint: POST http://0.0.0.0:${PORT}/send`);
    console.log(`💚 Health Check: GET http://0.0.0.0:${PORT}/health`);
});
