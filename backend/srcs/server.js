const Fastify = require("fastify");
const websocket = require("@fastify/websocket");
const configureServer = require("./config");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const uploadFileRoutes = require("./routes/uploadFile");
const matchRoutes = require("./routes/matches");
const gameWsRoutes = require("./websockets/gameWs");
const tournamentRoutes = require("./routes/tournaments");
const path = require("path");
const fastifyStatic = require("@fastify/static");

const twoFaRoutes = require('./routes/2FA');

async function startServer() {
  const fastify = Fastify({ 
    logger: true,
    trustProxy: true
  });

  await configureServer(fastify);

  await fastify.register(websocket);

  await fastify.register(authRoutes);
  await fastify.register(userRoutes);
  await fastify.register(uploadFileRoutes);
  await fastify.register(matchRoutes);
  await fastify.register(gameWsRoutes);
  await fastify.register(tournamentRoutes);

  fastify.register(fastifyStatic, {
    root: "/app/images",
    prefix: "/images/",
  });
  await fastify.register(twoFaRoutes, { prefix: '/2FA' });

  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    fastify.log.info(`Serveur backend en cours d'exécution sur http://localhost:3000`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

startServer();
















