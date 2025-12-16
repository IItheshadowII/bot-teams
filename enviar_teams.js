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
        
        // 5. Buscar input de mensaje usando evaluación del DOM
        console.log('📝 Buscando campo de texto...');
        
        // Screenshot de debug
        try {
            const timestamp = Date.now();
            await page.screenshot({ path: `${SCREENSHOT_PATH}/debug_before_input_${timestamp}.png`, fullPage: true });
            console.log(`📸 Debug screenshot: debug_before_input_${timestamp}.png`);
        } catch (e) {}
        
        // Intentar encontrar y hacer clic en el input usando page.evaluate
        const inputFound = await page.evaluate(() => {
            // Buscar todos los elementos contenteditable
            const editables = document.querySelectorAll('[contenteditable="true"]');
            
            for (let elem of editables) {
                const rect = elem.getBoundingClientRect();
                
                // Verificar que sea visible y tenga tamaño
                if (rect.width > 0 && rect.height > 0) {
                    // Hacer clic para enfocar
                    elem.click();
                    elem.focus();
                    return true;
                }
            }
            
            return false;
        });
        
        if (!inputFound) {
            // Listar todos los contenteditable para debug
            const debugInfo = await page.evaluate(() => {
                const editables = Array.from(document.querySelectorAll('[contenteditable="true"]'));
                return editables.map(el => ({
                    tag: el.tagName,
                    role: el.getAttribute('role'),
                    class: el.className,
                    visible: el.offsetWidth > 0 && el.offsetHeight > 0
                }));
            });
            console.log('📋 Elementos contenteditable encontrados:', JSON.stringify(debugInfo, null, 2));
            throw new Error('❌ No se encontró el campo de texto con ningún selector');
        }
        
        console.log('✅ Input encontrado y enfocado');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 6. Escribir mensaje usando keyboard
        console.log('✍️ Escribiendo mensaje...');
        await page.keyboard.type(mensaje, { delay: 20 });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 7. Enviar usando Enter o buscando el botón
        console.log('🚀 Enviando mensaje...');
        
        // Intentar con Enter primero
        try {
            await page.keyboard.press('Enter');
            console.log('✅ Mensaje enviado con Enter');
        } catch (e) {
            console.log('⚠️ Enter no funcionó, buscando botón de enviar...');
            
            // Buscar botón de enviar
            const sendClicked = await page.evaluate(() => {
                const buttons = document.querySelectorAll('button');
                
                for (let btn of buttons) {
                    const text = btn.textContent?.toLowerCase() || '';
                    const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
                    const title = btn.getAttribute('title')?.toLowerCase() || '';
                    
                    if (text.includes('send') || text.includes('enviar') || 
                        ariaLabel.includes('send') || ariaLabel.includes('enviar') ||
                        title.includes('send') || title.includes('enviar')) {
                        btn.click();
                        return true;
                    }
                }
                
                return false;
            });
            
            if (!sendClicked) {
                throw new Error('❌ No se encontró el botón de enviar');
            }
            
            console.log('✅ Mensaje enviado con botón');
        }
        
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
