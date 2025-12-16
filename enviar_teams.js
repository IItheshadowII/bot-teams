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
    const mensaje = `Buenas tardes, por favor podrían agregar el siguiente cloud:\n\nAnyDesk ID: ${anydeskID} **${pcName}\n\nMuchas gracias!`;
    
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
        
        // 4. ESTRATEGIA ALTERNATIVA: Usar el buscador de Teams
        console.log(`🔍 Usando buscador para encontrar chat: "${GROUP_NAME}"...`);
        
        // Hacer clic en el buscador
        const searchClicked = await page.evaluate(() => {
            const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"], input[aria-label*="Search"]');
            if (searchInput) {
                searchInput.click();
                searchInput.focus();
                return true;
            }
            return false;
        });
        
        if (searchClicked) {
            console.log('✅ Buscador encontrado, escribiendo nombre...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await page.keyboard.type(GROUP_NAME, { delay: 100 });
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Screenshot de resultados de búsqueda
            try {
                const timestamp = Date.now();
                await page.screenshot({ path: `${SCREENSHOT_PATH}/debug_search_results_${timestamp}.png`, fullPage: true });
                console.log(`📸 Debug screenshot: debug_search_results_${timestamp}.png`);
            } catch (e) {}
            
            // Presionar Enter o hacer clic en el primer resultado
            console.log('⬇️ Seleccionando primer resultado...');
            await page.keyboard.press('ArrowDown');
            await new Promise(resolve => setTimeout(resolve, 500));
            await page.keyboard.press('Enter');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            console.log('✅ Chat abierto desde búsqueda');
        } else {
            console.log('⚠️ No se encontró el buscador, usando método de clic directo...');
            
            // 4b. Buscar y abrir el chat haciendo clic directo (método original como fallback)
            console.log(`🔍 Buscando chat en lista: "${GROUP_NAME}"...`);
            
            // Primero intentar buscar en elementos de lista de chats (li, listitem, etc.)
            const chatClicked = await page.evaluate((groupName) => {
            // Estrategia 1: Buscar en elementos de lista (más confiable para chats)
            const listItems = document.querySelectorAll('li, [role="listitem"], [role="option"], [data-tid*="chat"], [data-tid*="conversation"]');
            
            for (let item of listItems) {
                const text = item.textContent?.trim() || '';
                
                if (text.includes(groupName)) {
                    const rect = item.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        item.click();
                        console.log('Clic en listitem que contiene:', groupName);
                        return true;
                    }
                }
            }
            
            // Estrategia 2: Buscar texto exacto y hacer clic en el contenedor clickable más cercano
            const allElements = document.querySelectorAll('*');
            
            for (let elem of allElements) {
                const text = elem.textContent?.trim() || '';
                
                if (text === groupName) {
                    let clickable = elem;
                    
                    // Subir hasta encontrar un elemento clickable (máx 10 niveles)
                    let levels = 0;
                    while (clickable && clickable !== document.body && levels < 10) {
                        const tagName = clickable.tagName.toLowerCase();
                        const role = clickable.getAttribute('role');
                        const tabindex = clickable.getAttribute('tabindex');
                        
                        if (tagName === 'button' || 
                            tagName === 'a' ||
                            tagName === 'li' ||
                            role === 'button' ||
                            role === 'listitem' ||
                            role === 'option' ||
                            tabindex === '0' ||
                            clickable.onclick ||
                            window.getComputedStyle(clickable).cursor === 'pointer') {
                            
                            const rect = clickable.getBoundingClientRect();
                            if (rect.width > 0 && rect.height > 0) {
                                clickable.click();
                                console.log('Clic en elemento:', tagName, role);
                                return true;
                            }
                        }
                        
                        clickable = clickable.parentElement;
                        levels++;
                    }
                }
            }
            
            return false;
        }, GROUP_NAME);
        
            if (!chatClicked) {
                throw new Error(`❌ No se encontró el chat/grupo: "${GROUP_NAME}"`);
            }
            
            console.log('✅ Chat encontrado y clickeado (método clic directo)');
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Screenshot después del clic
        try {
            const timestamp = Date.now();
            await page.screenshot({ path: `${SCREENSHOT_PATH}/debug_after_click_${timestamp}.png`, fullPage: true });
            console.log(`📸 Debug screenshot: debug_after_click_${timestamp}.png`);
        } catch (e) {}
        
        // Verificar si la conversación se abrió (buscar indicadores)
        const conversationOpen = await page.evaluate(() => {
            // Buscar si hay elementos que indican que la conversación está abierta
            const hasConversation = document.querySelector('[role="main"]') || 
                                   document.querySelector('[data-tid="messaging-canvas"]') ||
                                   document.querySelectorAll('[contenteditable="true"]').length > 0;
            return !!hasConversation;
        });
        
        if (!conversationOpen) {
            console.log('⚠️ La conversación no parece haberse abierto, intentando clic adicional...');
            
            // Intentar clic en la misma posición del screenshot (centro de pantalla)
            const dimensions = await page.evaluate(() => ({
                width: window.innerWidth,
                height: window.innerHeight
            }));
            
            await page.mouse.click(dimensions.width / 2, dimensions.height / 3);
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // 5. Hacer clic en el área de mensajes para activar el campo de texto
        console.log('🖱️ Haciendo clic en el área de mensajes...');
        await page.evaluate(() => {
            // Buscar el área principal de chat
            const mainAreas = document.querySelectorAll('[role="main"], [role="region"], main, .main-content');
            
            for (let area of mainAreas) {
                const rect = area.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    area.click();
                    break;
                }
            }
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 6. Intentar activar el campo de texto presionando Tab o haciendo clic en el centro
        console.log('⌨️ Intentando activar campo de texto con Tab...');
        await page.keyboard.press('Tab');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Hacer clic en el centro-abajo de la página (donde suele estar el input)
        console.log('🖱️ Haciendo clic en el área del input (centro-abajo)...');
        const dimensions = await page.evaluate(() => ({
            width: window.innerWidth,
            height: window.innerHeight
        }));
        await page.mouse.click(dimensions.width / 2, dimensions.height - 100);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 7. Buscar input de mensaje usando evaluación del DOM
        console.log('📝 Buscando campo de texto...');
        
        // Screenshot de debug
        try {
            const timestamp = Date.now();
            await page.screenshot({ path: `${SCREENSHOT_PATH}/debug_before_input_${timestamp}.png`, fullPage: true });
            console.log(`📸 Debug screenshot: debug_before_input_${timestamp}.png`);
        } catch (e) {}
        
        // Intentar encontrar y hacer clic en el input usando page.evaluate (buscar más agresivamente)
        const inputFound = await page.evaluate(() => {
            // 1. Buscar contenteditable
            let editables = Array.from(document.querySelectorAll('[contenteditable="true"]'));
            console.log('Contenteditable encontrados:', editables.length);
            
            for (let elem of editables) {
                const rect = elem.getBoundingClientRect();
                
                // Verificar que sea visible y tenga tamaño
                if (rect.width > 0 && rect.height > 0) {
                    elem.click();
                    elem.focus();
                    return true;
                }
            }
            
            // 2. Buscar textbox por role
            let textboxes = Array.from(document.querySelectorAll('[role="textbox"]'));
            console.log('Textboxes encontrados:', textboxes.length);
            
            for (let elem of textboxes) {
                const rect = elem.getBoundingClientRect();
                
                if (rect.width > 0 && rect.height > 0) {
                    elem.click();
                    elem.focus();
                    
                    // Si no es contenteditable, hacerlo editable
                    if (!elem.hasAttribute('contenteditable')) {
                        elem.setAttribute('contenteditable', 'true');
                    }
                    
                    return true;
                }
            }
            
            // 3. Buscar por placeholder
            let placeholders = Array.from(document.querySelectorAll('[placeholder*="Type"], [placeholder*="Message"], [placeholder*="Escribe"], [placeholder*="Mensaje"]'));
            console.log('Placeholders encontrados:', placeholders.length);
            
            for (let elem of placeholders) {
                const rect = elem.getBoundingClientRect();
                
                if (rect.width > 0 && rect.height > 0) {
                    elem.click();
                    elem.focus();
                    return true;
                }
            }
            
            return false;
        });
        
        if (!inputFound) {
            // Listar todos los contenteditable para debug y buscar más info
            const debugInfo = await page.evaluate(() => {
                const editables = Array.from(document.querySelectorAll('[contenteditable="true"]'));
                const textboxes = Array.from(document.querySelectorAll('[role="textbox"]'));
                const inputs = Array.from(document.querySelectorAll('input, textarea'));
                const iframes = Array.from(document.querySelectorAll('iframe'));
                
                return {
                    contenteditable: editables.map(el => ({
                        tag: el.tagName,
                        role: el.getAttribute('role'),
                        class: el.className,
                        visible: el.offsetWidth > 0 && el.offsetHeight > 0
                    })),
                    textboxes: textboxes.map(el => ({
                        tag: el.tagName,
                        class: el.className,
                        visible: el.offsetWidth > 0 && el.offsetHeight > 0
                    })),
                    inputs: inputs.map(el => ({
                        tag: el.tagName,
                        type: el.type,
                        placeholder: el.placeholder,
                        visible: el.offsetWidth > 0 && el.offsetHeight > 0
                    })),
                    iframes: iframes.length,
                    url: window.location.href
                };
            });
            console.log('📋 Debug completo:', JSON.stringify(debugInfo, null, 2));
            
            // Intentar en iframe si existe
            const frames = page.frames();
            console.log(`🔍 Frames encontrados: ${frames.length}`);
            
            for (let frame of frames) {
                try {
                    const frameInputFound = await frame.evaluate(() => {
                        const editables = Array.from(document.querySelectorAll('[contenteditable="true"]'));
                        for (let elem of editables) {
                            const rect = elem.getBoundingClientRect();
                            if (rect.width > 0 && rect.height > 0) {
                                elem.click();
                                elem.focus();
                                return true;
                            }
                        }
                        return false;
                    });
                    
                    if (frameInputFound) {
                        console.log('✅ Input encontrado en iframe');
                        break;
                    }
                } catch (e) {
                    // Algunos iframes pueden tener CORS o estar vacíos
                }
            }
            
            throw new Error('❌ No se encontró el campo de texto con ningún selector');
        }
        
        console.log('✅ Input encontrado y enfocado');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 8. Escribir mensaje usando keyboard
        console.log('✍️ Escribiendo mensaje...');
        await page.keyboard.type(mensaje, { delay: 20 });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 9. Enviar usando Enter o buscando el botón
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
