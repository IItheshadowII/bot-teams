const puppeteer = require('puppeteer');

// 1. Obtener el mensaje completo del argumento pasado por n8n/línea de comandos
const messageToSend = process.argv[2]; 
const chatName = "AnyDesk Management"; 
// Ruta al VOLUMEN PERSISTENTE que definiremos en EasyPanel
const SESSION_DIR = '/home/pptruser/teams_session'; 

if (!messageToSend) {
  console.error("Error: No se recibió ningún mensaje para enviar.");
  process.exit(1);
}

(async () => {
  let browser;
  try {
    console.log(`Iniciando navegador con sesión en: ${SESSION_DIR}`);
    browser = await puppeteer.launch({
      headless: "new", 
      userDataDir: SESSION_DIR, // <-- Usa el volumen persistente
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Abrir Teams
    await page.goto('https://teams.live.com/', { waitUntil: 'networkidle0', timeout: 60000 });
    
    // --- VERIFICACIÓN DE LOGIN ---
    // Busca un elemento que solo existe cuando NO está logueado (Ej: botón de "Sign In")
    const loginPrompt = await page.$('button[name="Sign in"]');
    if (loginPrompt) {
      console.warn("ADVERTENCIA: Se requiere inicio de sesión. Inicie sesión manualmente para guardar la sesión.");
      // Podrías poner una pausa grande aquí para loguearte manualmente la primera vez:
      // await new Promise(r => setTimeout(r, 600000)); // 10 minutos
      // El script se ejecutará, se abrirá la página, y tendrás 10 min para loguearte.
      // Luego, matas el script y lo vuelves a ejecutar para que use la sesión guardada.
      await browser.close();
      return; 
    }
    
    // --- ENVÍO DEL MENSAJE ---
    console.log("Sesión activa. Buscando chat...");

    // Esperar al input de texto (Editor de mensaje)
    // El selector del editor de Teams suele ser un div con contenteditable="true"
    await page.waitForSelector('[contenteditable="true"]', { timeout: 30000 });
    
    // Navegación al chat (Método más directo: buscar el elemento por texto)
    const chatElements = await page.$x(`//span[contains(text(), '${chatName}')]`);
    if (chatElements.length > 0) {
      await chatElements[0].click();
      console.log(`Chat "${chatName}" abierto.`);
      
      // Esperar a que el editor de texto esté listo de nuevo
      await page.waitForSelector('[contenteditable="true"]', { timeout: 10000 });
      
      // Escribir el mensaje
      await page.type('[contenteditable="true"]', messageToSend);
      
      // Apretar ENTER para enviar
      await page.keyboard.press('Enter');
      console.log(`Mensaje enviado: ${messageToSend}`);
      
      // Espera final para asegurar el envío
      await new Promise(r => setTimeout(r, 3000));
    } else {
      console.error(`ERROR FATAL: No encontré el chat: ${chatName}`);
    }

  } catch (error) {
    console.error("Error general en la ejecución del bot:", error);
  } finally {
    if (browser) await browser.close();
  }
})();