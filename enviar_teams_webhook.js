// ==========================================
// Bot Teams con Incoming Webhook
// ==========================================

// Variable de entorno con la URL del webhook
const WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;

// Argumentos desde n8n/consola
const args = process.argv.slice(2);
const anydeskID = args[0] || "ID_DESCONOCIDO";
const pcName = args[1] || "SIN_NOMBRE";

if (!WEBHOOK_URL) {
    console.error("❌ ERROR: Falta variable TEAMS_WEBHOOK_URL");
    console.log("Configura la variable de entorno TEAMS_WEBHOOK_URL con la URL del webhook de Teams");
    process.exit(1);
}

if (!anydeskID || anydeskID === "ID_DESCONOCIDO") {
    console.error("❌ ERROR: No se recibió el ID de AnyDesk");
    console.log("Uso: node enviar_teams_webhook.js <ANYDESK_ID> [NOMBRE_PC]");
    process.exit(1);
}

(async () => {
    try {
        console.log(`🤖 ENVIANDO MENSAJE A TEAMS...`);
        console.log(`   💻 Equipo: ${pcName}`);
        console.log(`   🆔 ID: ${anydeskID}`);

        // Crear mensaje con formato Markdown
        const mensaje = {
            "@type": "MessageCard",
            "@context": "https://schema.org/extensions",
            "summary": "Nuevo AnyDesk Detectado",
            "themeColor": "FF6B6B",
            "title": "🚨 Nuevo AnyDesk Detectado",
            "sections": [
                {
                    "activityTitle": "Detalles del equipo",
                    "facts": [
                        {
                            "name": "💻 Equipo:",
                            "value": pcName
                        },
                        {
                            "name": "🆔 ID AnyDesk:",
                            "value": anydeskID
                        },
                        {
                            "name": "📅 Fecha:",
                            "value": new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
                        }
                    ],
                    "text": "👉 Por favor agregar a la lista de equipos autorizados."
                }
            ]
        };

        // Enviar POST al webhook
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(mensaje)
        });

        if (response.ok) {
            console.log('✅ MENSAJE ENVIADO EXITOSAMENTE');
        } else {
            const errorText = await response.text();
            console.error('❌ ERROR AL ENVIAR:', response.status, errorText);
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        process.exit(1);
    }
})();
