# Integración con n8n

## 📌 Configuración del Bot como Servidor HTTP

El bot ahora funciona como un **servidor Express** que escucha en el puerto **3000** y recibe peticiones HTTP desde n8n.

### Endpoints Disponibles

#### 1. POST `/send` - Enviar mensaje a Teams
Envía un mensaje al grupo de Teams con el ID y nombre de la PC detectada.

**Request Body (JSON):**
```json
{
  "anydeskID": "123456789",
  "pcName": "LAPTOP-DEL-CLIENTE"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Mensaje enviado correctamente",
  "data": {
    "anydeskID": "123456789",
    "pcName": "LAPTOP-DEL-CLIENTE"
  }
}
```

**Response (Error):**
```json
{
  "error": "Error al enviar mensaje",
  "details": "Descripción del error"
}
```

#### 2. GET `/health` - Health Check
Verifica que el servidor esté funcionando.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-16T10:30:00.000Z"
}
```

---

## 🔧 Configuración en EasyPanel

### 1. Variables de Entorno
```bash
TEAMS_EMAIL=ezequiel.mazzarello@praxisemr.com
TEAMS_PASSWORD=tu_password_aqui
TEAMS_GROUP_NAME=AnyDesk Management
PORT=3000  # Opcional, por defecto usa 3000
```

### 2. Puerto Expuesto
- **Puerto interno:** 3000
- **Configurar en EasyPanel:** Exponer puerto 3000 → Recibirás una URL pública (ej: `https://bot-teams-xxxxx.easypanel.host`)

### 3. Volumen Persistente
- **Ruta en contenedor:** `/home/pptruser/teams_session`
- **Nombre del volumen:** `teams_data` (o el que hayas configurado)

### 4. Copiar Sesión (una sola vez después del primer deploy)
```bash
# SSH al servidor
ssh ebanega@n8n.praxisclouds.com

# Copiar sesión desde Windows (ejecutar en PowerShell)
scp -r C:\Users\Kratos\teams_session_local\* ebanega@n8n.praxisclouds.com:/tmp/teams_session/

# Copiar al contenedor
docker ps  # Obtener CONTAINER_ID
docker cp /tmp/teams_session/. CONTAINER_ID:/home/pptruser/teams_session/
```

---

## 🎯 Configuración en n8n

### Workflow de Ejemplo

```
[Trigger: AnyDesk Detected] 
    ↓
[HTTP Request Node] → POST a Bot Teams
    ↓
[Si exitoso] → Log/Notification
```

### HTTP Request Node - Configuración

**Node Type:** HTTP Request

**Settings:**
- **Authentication:** None
- **Request Method:** POST
- **URL:** `http://bot-teams:3000/send` (si está en la misma red Docker) o `https://bot-teams-xxxxx.easypanel.host/send` (URL pública)
- **Body Content Type:** JSON
- **Specify Body:** Using JSON

**JSON Body:**
```json
{
  "anydeskID": "{{ $json.anydesk_id }}",
  "pcName": "{{ $json.pc_name }}"
}
```

**Ejemplo con valores fijos (para testing):**
```json
{
  "anydeskID": "987654321",
  "pcName": "TEST-PC"
}
```

**Headers:**
```
Content-Type: application/json
```

---

## 🧪 Testing

### Desde línea de comandos (curl):
```bash
# Desde el servidor
curl -X POST http://localhost:3000/send \
  -H "Content-Type: application/json" \
  -d '{"anydeskID": "123456789", "pcName": "TEST-LAPTOP"}'

# Health check
curl http://localhost:3000/health
```

### Desde n8n (Test Workflow):
1. Crear un workflow nuevo
2. Agregar nodo "HTTP Request"
3. Configurar como se muestra arriba
4. Hacer clic en "Execute Node"
5. Verificar respuesta y que el mensaje llegó a Teams

---

## 📝 Notas Importantes

1. **Primera vez:** Después de deployar, copiar la sesión de Teams al contenedor (ver sección "Copiar Sesión")
2. **Variables de entorno:** Asegúrate de configurar `TEAMS_GROUP_NAME` con el nombre exacto del grupo en Teams
3. **Red Docker:** Si n8n y el bot están en la misma red Docker de EasyPanel, usa `http://bot-teams:3000/send`
4. **URL pública:** Si n8n está en otro servidor, configura el puerto público en EasyPanel y usa la URL HTTPS generada
5. **Logs:** Monitorea los logs del contenedor para verificar que recibe las peticiones: `docker logs -f CONTAINER_ID`

---

## 🚨 Troubleshooting

### El bot no recibe peticiones:
- Verificar que el puerto 3000 esté expuesto en EasyPanel
- Verificar que el contenedor esté corriendo: `docker ps`
- Ver logs: `docker logs CONTAINER_ID`

### Error "Chat no encontrado":
- Verificar que `TEAMS_GROUP_NAME` coincida exactamente con el nombre en Teams
- Verificar que la sesión esté copiada correctamente en `/home/pptruser/teams_session`

### Error de autenticación:
- La sesión puede haber expirado, ejecutar nuevamente `login_manual_local.js` en Windows
- Copiar la nueva sesión al contenedor
