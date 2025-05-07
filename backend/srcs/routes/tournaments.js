const db = require("../database/db");

/**
 * @param {import('fastify').FastifyInstance} fastify 
 */
async function tournamentRoutes(fastify) {
    fastify.post("/tournaments", async (req, res) => {
        const { players, ranking } = req.body;
    
        if (!players || !ranking) {
            return res.status(400).send({ error: "Champs manquants." });
        }
    
        const stmt = db.prepare("INSERT INTO tournaments (players, ranking) VALUES (?, ?)");
        const info = stmt.run(JSON.stringify(players), JSON.stringify(ranking));
    
        return { success: true, tournamentId: info.lastInsertRowid };
    });
    
    fastify.get("/tournaments/user/:username", async (request, reply) => {
        const username = request.params.username;

        try {
            const stmt = db.prepare("SELECT * FROM tournaments");
            const tournaments = stmt.all();

            const filtered = tournaments.filter(t => {
                const players = JSON.parse(t.players);
                return players.includes(username);
            });

            return filtered;
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: "Erreur serveur lors de la récupération." });
        }
    });

    fastify.get("/tournaments", async (request, reply) => {
        try {
            const stmt = db.prepare("SELECT * FROM tournaments");
            const tournaments = stmt.all();
            return tournaments;
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: "Erreur serveur lors de la récupération des tournois." });
        }
    });
}

module.exports = tournamentRoutes;
