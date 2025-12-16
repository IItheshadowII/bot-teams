const puppeteer = require('puppeteer');

// Recibimos el mensaje como argumento. Si no hay, usamos uno de prueba.
const messageToSend = process.argv[2]; 
// CAMBIO PARA PRUEBAS: Buscamos tu chat personal
const chatName = "Ezequiel Mazzarello"; 

const SESSION_DIR = '/home/pptruser/teams_session'; 

// Mensaje por defecto si corrés el script sin argumentos
const finalMessage = messageToSend || "🤖 Hola Eze, soy el bot probando la inyección de cookies.";

(async () => {
  console.log(`🚀 Iniciando Bot para escribirle a: ${chatName}`);
  
  const browser = await puppeteer.launch({
    headless: "new", // Ya lo dejamos sin ventana porque usamos cookies
    userDataDir: SESSION_DIR, 
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // --- 🍪 ZONA DE COOKIES (Tus credenciales) 🍪 ---
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

  console.log("Inyectando cookies...");
  await page.setCookie(...sessionCookies);
  console.log("Cookies inyectadas.");
  // ------------------------------------

  try {
    // Vamos a Teams Personal
    console.log("Navegando a teams.live.com...");
    await page.goto('https://teams.live.com/', { waitUntil: 'networkidle2', timeout: 90000 });

    console.log("Página cargada. Buscando chat...");
    
    // Esperamos a que cargue la lista (selector genérico de la UI de Teams)
    await page.waitForSelector('[role="list"]', { timeout: 60000 }); 

    // Buscamos el chat por el nombre (usamos XPath que es más flexible)
    const chatXpath = `//span[contains(text(), '${chatName}')]`;
    console.log(`Buscando elemento: ${chatName}`);
    await page.waitForXPath(chatXpath, { timeout: 30000 });
    
    // Hacemos click en el chat
    const chatElements = await page.$x(chatXpath);
    if (chatElements.length > 0) {
      await chatElements[0].click();
      console.log("Chat clickeado. Esperando editor de texto...");
      
      // Esperamos al editor
      await page.waitForSelector('[contenteditable="true"]', { timeout: 30000 });
      
      // Escribir el mensaje
      console.log("Escribiendo mensaje...");
      await page.type('[contenteditable="true"]', finalMessage);
      
      // Enviarlo
      await page.keyboard.press('Enter');
      console.log("✅ MENSAJE ENVIADO CON ÉXITO");
      
      // Esperar un poco para asegurar que salga
      await new Promise(r => setTimeout(r, 5000));
    } else {
      console.error("❌ No encontré el chat en la lista. Chequeá que el nombre sea exacto.");
    }

  } catch (error) {
    console.error("❌ Error:", error);
    
    // --- AGREGAR ESTO PARA VER QUÉ PASÓ ---
    try {
        const screenshotPath = '/home/pptruser/teams_session/error_debug.png';
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`📸 FOTO TOMADA: Bajala de tu servidor para ver qué pasó: ${screenshotPath}`);
    } catch (shotError) {
        console.error("No pude sacar la foto:", shotError);
    }
    // --------------------------------------

  } finally {
    await browser.close();
  }
})();
