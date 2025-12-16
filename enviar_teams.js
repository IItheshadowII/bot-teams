const puppeteer = require('puppeteer');

// Argumentos
const messageToSend = process.argv[2]; 
const chatName = "Ezequiel Mazzarello"; // OJO: Cambialo cuando quieras ir a producción
const SESSION_DIR = '/home/pptruser/teams_session'; 
const finalMessage = messageToSend || "🤖 Prueba de conexión con User-Agent fix.";

(async () => {
  console.log(`🚀 Iniciando Bot para escribirle a: ${chatName}`);
  
  const browser = await puppeteer.launch({
    headless: "new",
    userDataDir: SESSION_DIR, 
    args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--window-size=1920,1080' // Tamaño de pantalla real
    ]
  });

  const page = await browser.newPage();

  // 1. EL CAMUFLAJE (User-Agent real de Windows 10)
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // 2. INYECCIÓN DE COOKIES (Pegá tu JSON completo acá abajo)
  // Si ya lograste loguearte una vez y tenés persistencia, podés comentar esto.
  // Pero como falló la última vez, DEJAKO PUESTO.
  const sessionCookies = [
      // ... PEGÁ ACÁ TU ARRAY GIGANTE DE COOKIES ...
      // (Usá el mismo que me pasaste antes)
       {
        "domain": ".live.com",
        "expirationDate": 1797383790,
        "hostOnly": false,
        "httpOnly": false,
        "name": "_clck",
        "path": "/",
        "sameSite": "unspecified",
        "secure": false,
        "session": false,
        "storeId": "0",
        "value": "khn7px%7C2%7Cg1w%7C0%7C2176",
        "id": 1
    },
    // ... Asegurate de incluir TODAS las cookies del JSON anterior ...
    // (Por brevedad no las pego todas de nuevo acá, pero vos ponelas)
  ];

  if (sessionCookies.length > 0) {
      console.log("Inyectando cookies...");
      await page.setCookie(...sessionCookies);
  }

  try {
    console.log("Navegando a teams.live.com...");
    await page.goto('https://teams.live.com/', { waitUntil: 'networkidle2', timeout: 60000 });

    // 3. DETECCIÓN DE PORTADA DE MARKETING (El problema de la foto)
    // Buscamos el enlace que dice "Sign in" o "Iniciar sesión"
    // En tu foto se ve "Sign in" arriba a la derecha.
    try {
        const signInButton = await page.waitForXPath("//a[contains(text(), 'Sign in')]", { timeout: 5000 });
        if (signInButton) {
            console.log("⚠️ Detectada portada de marketing. Haciendo clic en 'Sign in'...");
            await signInButton.click();
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
        }
    } catch (e) {
        // Si no encontró el botón, quizás ya entró directo. Seguimos.
        console.log("No se detectó botón de Sign In en portada (o ya estamos dentro).");
    }

    // 4. VERIFICACIÓN DE LOGIN INTERRUMPIDO ("Mantener sesión iniciada")
    try {
        const btnStaySignedIn = await page.waitForSelector('input[type="submit"][value="Sí"], input[type="submit"][value="Yes"]', { timeout: 5000 });
        if (btnStaySignedIn) {
            console.log("👀 Detectado aviso de 'Mantener sesión iniciada'. Aceptando...");
            await btnStaySignedIn.click();
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
        }
    } catch (e) {
        // Ignorar
    }

    console.log("Esperando carga de la interfaz de chat...");
    
    // Esperamos a que cargue la lista (selector genérico de la UI de Teams)
    await page.waitForSelector('[role="list"]', { timeout: 60000 }); 

    // Buscamos el chat
    const chatXpath = `//span[contains(text(), '${chatName}')]`;
    console.log(`Buscando contacto: ${chatName}`);
    await page.waitForXPath(chatXpath, { timeout: 30000 });
    
    const chatElements = await page.$x(chatXpath);
    if (chatElements.length > 0) {
      await chatElements[0].click();
      console.log("Chat abierto. Buscando editor...");
      
      await page.waitForSelector('[contenteditable="true"]', { timeout: 30000 });
      
      console.log("Escribiendo mensaje...");
      await page.type('[contenteditable="true"]', finalMessage);
      await page.keyboard.press('Enter');
      
      console.log("✅ MENSAJE ENVIADO CON ÉXITO");
      await new Promise(r => setTimeout(r, 5000));
    } else {
      console.error("❌ No encontré el chat.");
    }

  } catch (error) {
    console.error("❌ Error:", error);
    // Sacamos foto de nuevo si falla
    try {
        await page.screenshot({ path: '/home/pptruser/teams_session/error_debug_v2.png', fullPage: true });
        console.log("📸 Nueva foto de error guardada: error_debug_v2.png");
    } catch (e) {}
  } finally {
    await browser.close();
  }
})();
