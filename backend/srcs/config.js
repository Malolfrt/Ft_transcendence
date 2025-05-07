const cors = require("@fastify/cors");
const jwt = require("@fastify/jwt");
const bcrypt = require("fastify-bcrypt");
require("dotenv").config();

async function configureServer(fastify) {
    await fastify.register(require("@fastify/cors"), {
      origin: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS", "PUT"],
      allowedHeaders: ["Content-Type", "Authorization", "Origin", "X-Requested-With", "Accept"],
      credentials: true, 
      preflightContinue: false,
      optionsSuccessStatus: 204
  });

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET,
  });

  await fastify.register(bcrypt, {
    saltWorkFactor: 10,
  });

  return fastify;
}

module.exports = configureServer;
