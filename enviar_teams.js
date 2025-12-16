const puppeteer = require('puppeteer');

// --- CONFIGURACIÓN ---
// Recibimos el mensaje como argumento.
const messageToSend = process.argv[2]; 

// CAMBIAR ACÁ: El nombre EXACTO de la persona o grupo a buscar
const chatName = "Ezequiel Mazzarello"; 

// Ruta del volumen persistente (para guardar sesión y screenshots)
const SESSION_DIR = '/home/pptruser/teams_session'; 

// Mensaje por defecto si no se pasa argumento
const finalMessage = messageToSend || "🤖 Prueba de conexión con script V3 Bilingüe.";

(async () => {
  console.log("========================================");
  console.log(`🚀 Iniciando Bot Teams V3`);
  console.log(`🎯 Objetivo: ${chatName}`);
  console.log(`📂 Sesión: ${SESSION_DIR}`);
  console.log("========================================");
  
  const browser = await puppeteer.launch({
    headless: "new",
    userDataDir: SESSION_DIR, 
    args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--window-size=1920,1080', // Tamaño real para que no oculte elementos
        '--disable-blink-features=AutomationControlled' // Camuflaje extra
    ]
  });

  const page = await browser.newPage();

  // 1. EL CAMUFLAJE (User-Agent de Windows 10 Real)
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // 2. INYECCIÓN DE COOKIES
  const sessionCookies = [
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
    {
        "domain": ".live.com",
        "expirationDate": 1765934190,
        "hostOnly": false,
        "httpOnly": false,
        "name": "_clsk",
        "path": "/",
        "sameSite": "unspecified",
        "secure": false,
        "session": false,
        "storeId": "0",
        "value": "1h4m1t3%7C1765847790652%7C1%7C1%7Cs.clarity.ms%2Fcollect",
        "id": 2
    },
    {
        "domain": ".live.com",
        "hostOnly": false,
        "httpOnly": true,
        "name": "amsc",
        "path": "/",
        "sameSite": "no_restriction",
        "secure": true,
        "session": true,
        "storeId": "0",
        "value": "U3/9BF8KXxjG9KZIK3QZTSu2ve4FhNm7g2wGkhH9SRpw6622BYQhDs8WNnCt+DU20yEDubG67ZcT7K70fn/6pp+BHTguSoNKWpPY3lbi3NK20usLtBEsqcfuLptZejYTVTXZIIi20ld1+e+MBarxkXX+sjl96xf2QCv4KOaZ8Voi7Osr6bndo6RX+N4fUJuDWRj5BYiu0ctHEstpQ3HAMU8wmFE6onU5x6aT5okf1bQBeIrBG2zeI93Xm+96Mj9plpNofQoiE1DH9eNubQ/LoQGXP1EM6S9pMcdvTYrVaROjUywV91LRMxveqUzCXuGy:2:3c",
        "id": 3
    },
    {
        "domain": ".live.com",
        "expirationDate": 1783153138,
        "hostOnly": false,
        "httpOnly": true,
        "name": "ANON",
        "path": "/",
        "sameSite": "no_restriction",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "A=BD786D78F3114351CDE6FDE8FFFFFFFF&E=2008&W=1",
        "id": 4
    },
    {
        "domain": ".live.com",
        "hostOnly": false,
        "httpOnly": true,
        "name": "fptctx2",
        "path": "/",
        "sameSite": "unspecified",
        "secure": true,
        "session": true,
        "storeId": "0",
        "value": "taBcrIH61PuCVH7eNCyH0FC0izOzUpX5wN2Z%252b5egc%252f5uQpJgg34ab%252fgutEStB62hmpD%252f1r003p0vwFJ8ZgvXrw7SwwWMDt3tt%252fV63PApEIiXIIBbfDCeBM0GKM2rWEYDihJWjBpCcW6dUOknuNAv5vzkAeZn0R3HBf9yySzbD3FcTiiIkdZWBGLdPIMHDj9LxXx9ROZrZ2q6UOVi6P8K%252fKBSKbSOawpX5xsi389cUaJSYq0DPrRH2MMfqevNZGgrnD4ls9sHawLFUBnKUJRFIczWevRRP%252bm4KMf2aFupy1KLJZQbyQ9pVAOdn3tCKelxyjI1sWftxQl5tiQMNVEibA%253d%253d",
        "id": 5
    },
    {
        "domain": ".live.com",
        "expirationDate": 1797379198,
        "hostOnly": false,
        "httpOnly": true,
        "name": "mkt",
        "path": "/",
        "sameSite": "unspecified",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "es-ES",
        "id": 6
    },
    {
        "domain": ".live.com",
        "hostOnly": false,
        "httpOnly": true,
        "name": "mkt1",
        "path": "/",
        "sameSite": "no_restriction",
        "secure": true,
        "session": true,
        "storeId": "0",
        "value": "es-ES",
        "id": 7
    },
    {
        "domain": ".live.com",
        "expirationDate": 1765934189,
        "hostOnly": false,
        "httpOnly": false,
        "name": "MSCC",
        "path": "/",
        "sameSite": "no_restriction",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "NR",
        "id": 8
    },
    {
        "domain": ".live.com",
        "expirationDate": 1799543938,
        "hostOnly": false,
        "httpOnly": true,
        "name": "MSPAuth",
        "path": "/",
        "sameSite": "no_restriction",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "Disabled",
        "id": 9
    },
    {
        "domain": ".live.com",
        "expirationDate": 1799543938,
        "hostOnly": false,
        "httpOnly": true,
        "name": "MSPProf",
        "path": "/",
        "sameSite": "no_restriction",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "Disabled",
        "id": 10
    },
    {
        "domain": ".live.com",
        "expirationDate": 1776203984,
        "hostOnly": false,
        "httpOnly": true,
        "name": "MUID",
        "path": "/",
        "sameSite": "unspecified",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "16aac8d72e1b4d90b7310bc5ede10f8d",
        "id": 11
    },
    {
        "domain": ".live.com",
        "expirationDate": 1774513138,
        "hostOnly": false,
        "httpOnly": true,
        "name": "NAP",
        "path": "/",
        "sameSite": "no_restriction",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "V=1.9&E=1fae&C=BckiOxHEoBuKPavaYd8pI9KZnQkHt88eOJvcNuvLIQGs6ainrE4bhw&W=1",
        "id": 12
    },
    {
        "domain": ".live.com",
        "expirationDate": 1799543938,
        "hostOnly": false,
        "httpOnly": false,
        "name": "PPLState",
        "path": "/",
        "sameSite": "no_restriction",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "1",
        "id": 13
    },
    {
        "domain": ".live.com",
        "expirationDate": 1799543938,
        "hostOnly": false,
        "httpOnly": true,
        "name": "WLSSC",
        "path": "/",
        "sameSite": "no_restriction",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "EgBQAgMAAAAMgAAAtgAB19JZDg5DcctttMNBcb172PKW73KsMOIvLOogo4jmgn9T6SjcPX6/MCWeprR6YJA3kWvDLYS8IGKNrBg8J85FNeQ6HowNh0TyO+Q/gamaDqUq7P8cF4tbcixyspgTCJ8SU7hieTsCU7Jvqbf7ScCQxZ3AnEIGc1u3l5syxv2OYqLPPshDuR0G7ZWF7uKq2ON2SkNngy/6Gncn+KM/I7rcsJYDpk/Jali3FLdjX0cmOq6LR4QTPTy54oZ1Z9vAtOZZKLnx4dReTVo4op4B5QcU/YdwiptSMTli9sbOoOwfuVukyjDlhj8ROt4TANcKzl7JlNeq35TafjkSDtYdjEN2hT8BgQA/Af5/AwC3S+ZrhLNAaSmzQGkQJwAAChCggAAiAGV6ZXF1aWVsLm1henphcmVsbG9AcHJheGlzZW1yLmNvbQB1AAAuZXplcXVpZWwubWF6emFyZWxsbyVwcmF4aXNlbXIuY29tQHBhc3Nwb3J0LmNvbQAAAAVBUgAAAAAAAAgKAgAAfi5VQAAGQQAIRXplcXVpZWwAEU1henphcmVsbG8gQmFuZWdhAAAAAAAAAAAAAAAAAAAAAAAAaJo4QrTy1ckAAISzQGl8WrdpAAAAAAAAAAAAAAAADgAxNzkuMzguNjkuMTcyAAQBAAAAAAAAAAAAAAAAAQQAAAAAAAAAAAAAAAAAAABV5XwuaZfIVQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAA==",
        "id": 14
    },
    {
        "domain": "teams.live.com",
        "expirationDate": 1797383961,
        "hostOnly": true,
        "httpOnly": false,
        "name": "MicrosoftApplicationsTelemetryDeviceId",
        "path": "/",
        "sameSite": "no_restriction",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "258290bb-deea-4db8-a523-a318c26bec0a",
        "id": 15
    },
    {
        "domain": "teams.live.com",
        "expirationDate": 1797383943,
        "hostOnly": true,
        "httpOnly": false,
        "name": "platformId",
        "path": "/v2",
        "sameSite": "unspecified",
        "secure": false,
        "session": false,
        "storeId": "0",
        "value": "1415",
        "id": 16
    }
  ];

  console.log("🍪 Inyectando cookies...");
  await page.setCookie(...sessionCookies);

  try {
    console.log("🌐 Navegando a teams.live.com...");
    await page.goto('https://teams.live.com/', { waitUntil: 'networkidle2', timeout: 60000 });

    // 3. DETECCIÓN DE PORTADA DE MARKETING (Versión Bilingüe)
    try {
        console.log("🔎 Verificando si estamos atrapados en la portada...");
        // Buscamos "Sign in" (Inglés) O "Iniciar" (Español)
        const signInXpath = "//a[contains(., 'Sign in') or contains(., 'Iniciar')]";
        
        const signInButton = await page.waitForXPath(signInXpath, { timeout: 8000 });
        
        if (signInButton) {
            console.log("⚠️ ¡Portada detectada! Hacemos clic en 'Iniciar sesión'...");
            await signInButton.click();
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
        }
    } catch (e) {
        console.log("✅ No se detectó botón de Login en portada (o ya estamos logueados).");
    }

    // 4. VERIFICACIÓN DE LOGIN INTERRUMPIDO ("Mantener sesión iniciada")
    try {
        console.log("🔎 Verificando popup de 'Mantener sesión'...");
        const btnStaySignedIn = await page.waitForSelector('input[type="submit"][value="Sí"], input[type="submit"][value="Yes"]', { timeout: 5000 });
        if (btnStaySignedIn) {
            console.log("👀 Detectado aviso. Aceptando...");
            await btnStaySignedIn.click();
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
        }
    } catch (e) {
        console.log("✅ Sin interrupciones de sesión.");
    }

    // 5. BUSCANDO EL CHAT
    console.log("⏳ Esperando que cargue la interfaz de chat...");
    // Esperamos a que cargue la lista lateral
    await page.waitForSelector('[role="list"]', { timeout: 60000 }); 

    const chatXpath = `//span[contains(text(), '${chatName}')]`;
    console.log(`🔎 Buscando contacto: ${chatName}`);
    await page.waitForXPath(chatXpath, { timeout: 30000 });
    
    const chatElements = await page.$x(chatXpath);
    if (chatElements.length > 0) {
      console.log("🖱️ Chat encontrado. Haciendo clic...");
      await chatElements[0].click();
      
      console.log("📝 Esperando editor de texto...");
      await page.waitForSelector('[contenteditable="true"]', { timeout: 30000 });
      
      console.log("⌨️ Escribiendo mensaje...");
      await page.type('[contenteditable="true"]', finalMessage);
      
      console.log("📤 Enviando...");
      await page.keyboard.press('Enter');
      
      console.log("✅ MENSAJE ENVIADO CON ÉXITO");
      await new Promise(r => setTimeout(r, 5000)); // Esperar confirmación visual
    } else {
      throw new Error(`No se encontró el chat: ${chatName}`);
    }

  } catch (error) {
    console.error("❌ ERROR CRÍTICO:", error);
    // Sacamos foto para debug
    try {
        const shotPath = `${SESSION_DIR}/error_debug_v3.png`;
        await page.screenshot({ path: shotPath, fullPage: true });
        console.log(`📸 Foto del error guardada en: ${shotPath}`);
    } catch (e) {
        console.error("No se pudo guardar la foto del error.");
    }
  } finally {
    console.log("👋 Cerrando navegador...");
    await browser.close();
  }
})();
