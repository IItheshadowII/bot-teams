const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// Ruta donde se guardará la sesión (en tu PC Windows)
const SESSION_DIR = './teams_session_local';

console.log('='.repeat(60));
console.log('🔐 LOGIN MANUAL EN TEAMS - SESIÓN LOCAL');
console.log('='.repeat(60));
console.log('\n📌 INSTRUCCIONES:');
console.log('1. Se abrirá Chrome con Teams');
console.log('2. Inicia sesión manualmente con tu método preferido (PIN/Face/etc)');
console.log('3. Espera a que cargue completamente Teams');
console.log('4. Verifica que veas tus chats');
console.log('5. Cierra la ventana de Chrome cuando termines');
console.log('6. La sesión se guardará en:', SESSION_DIR);
console.log('='.repeat(60));
console.log('\nPresiona CTRL+C para cancelar o espera 5 segundos...\n');

setTimeout(async () => {
    try {
        console.log('🚀 Iniciando navegador...\n');
        
        const browser = await puppeteer.launch({
            headless: false, // Ventana visible para login manual
            userDataDir: SESSION_DIR,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--window-size=1280,900'
            ]
        });

        const page = await browser.newPage();
        
        // Ir a Teams
        console.log('🌐 Navegando a Teams...');
        await page.goto('https://teams.live.com/v2/', { 
            waitUntil: 'networkidle2', 
            timeout: 90000 
        });

        console.log('\n✅ Ventana abierta.');
        console.log('👤 Por favor, inicia sesión manualmente en la ventana de Chrome.');
        console.log('⏳ El script esperará hasta que cierres el navegador...\n');

        // Esperar a que el usuario cierre el navegador manualmente
        await new Promise((resolve) => {
            browser.on('disconnected', () => {
                console.log('\n✅ Navegador cerrado.');
                resolve();
            });
        });

        console.log('💾 Sesión guardada en:', SESSION_DIR);
        console.log('\n📦 Siguiente paso: Comprimir y subir al servidor');
        console.log('   Ejecuta en PowerShell:');
        console.log('   Compress-Archive -Path ".\\teams_session_local" -DestinationPath ".\\teams_session.zip"');
        console.log('\n✅ ¡LISTO! Ahora sube teams_session.zip al servidor.');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        process.exit(1);
    }
}, 5000);
