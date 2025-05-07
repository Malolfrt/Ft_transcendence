const db = require("../database/db");
const usersOnline = new Map();

module.exports = function (fastify, opts, done) {
    fastify.get("/ws", { websocket: true }, (connection, req) => {

        const url = new URL(req.url, `http://${req.headers.host}`);
        const userId = url.searchParams.get("userId");

        if (!userId) {
            connection.close();
            return;
        }

        usersOnline.set(userId, connection);
        
        updateUserStatus(userId, "online");
        broadcastMessage({ type: "user_status", userId, status: "online" });

        const pingInterval = setInterval(() => {
            if (connection.readyState === 1) {
                try {
                    connection.ping();
                } catch (err) {
                    console.error(`Erreur lors du ping de ${userId}:`, err);
                }
            } else {
                clearInterval(pingInterval);
            }
        }, 5000);

        connection.on("pong", () => {
            console.log(`Réponse au ping de ${userId}`);
        });

        connection.on("close", () => {
            usersOnline.delete(userId);
            clearInterval(pingInterval);

            setTimeout(() => {
                if (!usersOnline.has(userId))
                {
                    updateUserStatus(userId, "offline");
                    broadcastMessage({ type: "user_status", userId, status: "offline" });
                }
            }, 2000);
        });

        connection.on("message", (message) => {
            try {
                const data = JSON.parse(message.toString());
                
                if (data.type === "user_status") {
                    updateUserStatus(data.userId, data.status);
                    if (data.isRefresh)
                        console.log(`Message de rafraîchissement, mise à jour du statut sans broadcast`);
                    else
                        broadcastMessage(data);
                }
                
            }
            catch (err)
            {
                console.error(`Erreur lors du traitement du message:`, err);
            }
        });
    });

    done();
};

function updateUserStatus(userId, status) {
    const currentStatus = db.prepare("SELECT status FROM users WHERE id = ?").get(userId)?.status;
    if (currentStatus !== status) {
        db.prepare("UPDATE users SET status = ? WHERE id = ?").run(status, userId);
    }
}

function broadcastMessage(message) {
    for (const [userId, connection] of usersOnline) {
        try {
            connection.send(JSON.stringify(message));
        } catch (err) {
            console.error(`Erreur en envoyant un message à ${userId}:`, err);
        }
    }
}

setInterval(() => {
    for (const [userId, connection] of usersOnline) {
        if (connection.readyState === 1) { 
            try {
                connection.ping();
            } catch (err) {
                console.error(`Erreur lors du ping de ${userId}:`, err);
            }
        } else {
            usersOnline.delete(userId);
            
            setTimeout(() => {
                if (!usersOnline.has(userId)) {
                    updateUserStatus(userId, "offline");
                    broadcastMessage({ type: "user_status", userId, status: "offline" });
                }
            }, 2000);
        }
    }
}, 5000);

