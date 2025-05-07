const db = require("../database/db");

async function userRoutes(fastify) {
  fastify.get("/users", async (request, reply) => {
    const users = db.prepare("SELECT id, username, email, avatar, status, created_at FROM users").all();
    return users;
  });

  fastify.get("/user/stats", async (request, reply) => {
    const { userId } = request.query;
  
    if (!userId) {
        return reply.status(400).send({ error: "Missing userId parameter" });
    }
  
    try {
        const stats = db.prepare(`
            SELECT 
                (SELECT COUNT(*) FROM matches WHERE player1_id = ? OR player2_id = ?) AS totalGames,
                (SELECT COUNT(*) FROM matches WHERE winner_id = ?) AS wins,
                ((SELECT COUNT(*) FROM matches WHERE player1_id = ? OR player2_id = ?) - 
                (SELECT COUNT(*) FROM matches WHERE winner_id = ?)) AS losses
        `).get(userId, userId, userId, userId, userId, userId);
  
        if (!stats) {
            return reply.status(404).send({ error: "No stats found for this user" });
        }
  
        reply.send(stats);
    } catch (error) {
        reply.status(500).send({ error: "Internal server error" });
    }
  
  });

  fastify.get("/users/all", async (request, reply) => {
    try {
      const users = db.prepare(`
        SELECT 
          u.id, 
          u.username, 
          u.status, 
          u.anonymize,
          u.avatar,
          (SELECT COUNT(*) FROM matches WHERE winner_id = u.id) as wins
        FROM users u
        ORDER BY status DESC
      `).all();
      return users;
    } catch (error) {
      return reply.status(500).send({ error: "Erreur serveur." });
    }
  });

  fastify.patch("/users/:id/status", async (request, reply) => {
    const { id } = request.params;
    const { status } = request.body;

    const validStatus = ["online", "offline", "in-game"];
    if (!validStatus.includes(status)) {
      return reply.status(400).send({ error: "Statut invalide." });
    }

    try {
      db.prepare("UPDATE users SET status = ? WHERE id = ?").run(status, id);
      return { message: "Statut mis à jour!" };
    } catch (error) {
      return reply.status(400).send({ error: "Erreur lors de la mise à jour du statut." });
    }
  });

  fastify.patch("/users/username/:username/update", async (request, reply) => {
    const { username } = request.params;
    const inputUsername = request.body.inputUsername;
    const inputEmail = request.body.inputEmail;
    try
    {
      const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
      if (!user)
        return reply.status(404).send({ error: "Utilisateur non trouvé." });
      if (user.anonymize === 0)
      {
        const updateUser = db.prepare("UPDATE users SET username = ?, email = ? WHERE username = ?").run(inputUsername, inputEmail, username);
        if (!updateUser)
            return reply.status(400).send({ error: "User already exist" });
          user.username = inputUsername;
          user.email = inputEmail;
          return { message: "Utilisateur mis a jour avec succès!", user };
      }
      else
        return reply.status(400).send({ error: "User is private, you don't update your profile" });
    }
    catch (error)
    {
      return reply.status(500).send({ error: "Erreur serveur." });
    }
  });


  fastify.patch("/users/username/:username/updatephoto", async (request, reply) => {
    const { username, file } = request.body;
    try
    {
      const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
      if (!user)
        return reply.status(404).send({ error: "Utilisateur non trouvé." });
      if (user.anonymize === 0)
      {
        const updateUser = db.prepare("UPDATE users SET avatar = ? WHERE username = ?").run(file, username);
        user.avatar = file;
        return { message: "Utilisateur mis a jour avec succès!", user };
      }
      else
        return reply.status(400).send({ error: "User is private, you don't update your profile" });
    }
    catch (error)
    {
      return reply.status(500).send({ error: "Erreur serveur." });
    }
  });

  fastify.delete("/users/username/:username", async (request, reply) => {
    const { username } = request.params;
    try
    {
      const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
      if (!user)
        return reply.status(404).send({ error: "Utilisateur non trouvé." });
      db.prepare("DELETE FROM friends WHERE user_id = ? OR friend_id = ?").run(user.id, user.id);
      db.prepare("DELETE FROM matches WHERE player1_id = ? OR player2_id = ?").run(user.id, user.id);
      db.prepare("DELETE FROM users WHERE username = ?").run(username);
      return { message: "Utilisateur supprimé avec succès!" };
    }
    catch (error)
    {
      return reply.status(500).send({ error: "Erreur serveur." });
    }
  });

  fastify.patch('/users/username/:username/anonymize', async (request, reply) => {
    const { username } = request.params;
    try
    {
      const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
      if (!user)
        return reply.status(404).send({ error: "Utilisateur non trouver" });
      
      if (user.anonymize === 1)
      {
          db.prepare("UPDATE users SET anonymize = 0, username = ?, email = ? WHERE username = ?")
          .run(username.split("_")[1], user.email.split("_")[1], username);
          user.username = username.split("_")[1];
          user.email = user.email.split("_")[1];
      }
      else
      {
        db.prepare("UPDATE users SET anonymize = 1 WHERE username = ?")
        .run(username);
        const anonymizeUsername = "anonymize_" + username;
        const anonymizeEmail = "anonymize_" + user.email;
        db.prepare("UPDATE users SET username = ?, email = ?, avatar = ? WHERE username = ?")
        .run(anonymizeUsername, anonymizeEmail, "default.jpg", username);
        user.username = anonymizeUsername;
        user.email = anonymizeEmail;
        user.avatar = "default.jpg";
      }
      const newAnonymize = user.anonymize === 1 ? 0 : 1;
      user.anonymize = newAnonymize;
      reply.send({ message: "Utilisateur anonymiser avec succes", user });
    }
    catch (error)
    {
      reply.status(500).send({ error: "Erreur serveur" });
    }
  });

  fastify.post("/users/:userId/friends/:friendId", async (request, reply) => {
    const { userId, friendId } = request.params;
    
    try {
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
      if (!user) {
        return reply.status(404).send({ error: "Utilisateur non trouvé" });
      }

      const friend = db.prepare("SELECT * FROM users WHERE id = ?").get(friendId);
      if (!friend) {
        return reply.status(404).send({ error: "Ami non trouvé" });
      }

      const existingRelation = db.prepare(`
        SELECT * FROM friends 
        WHERE (user_id = ? AND friend_id = ?) 
        OR (user_id = ? AND friend_id = ?)
      `).get(userId, friendId, friendId, userId);

      if (existingRelation) {
        return reply.status(400).send({ error: "Cette relation d'amitié existe déjà" });
      }

      db.prepare(`
        INSERT INTO friends (user_id, friend_id, status)
        VALUES (?, ?, 'pending')
      `).run(userId, friendId);

      return { message: "Demande d'amitié envoyée" };
    } catch (error) {
      return reply.status(500).send({ error: "Erreur serveur" });
    }
  });

  fastify.patch("/users/:userId/friends/:friendId/accept", async (request, reply) => {
    const { userId, friendId } = request.params;
    
    try {
      const result = db.prepare(`
        UPDATE friends 
        SET status = 'accepted'
        WHERE user_id = ? AND friend_id = ? AND status = 'pending'
      `).run(friendId, userId);

      if (result.changes === 0) {
        return reply.status(404).send({ error: "Demande d'amitié non trouvée" });
      }

      return { message: "Demande d'amitié acceptée" };
    } catch (error) {
      return reply.status(500).send({ error: "Erreur serveur" });
    }
  });

  fastify.patch("/users/:userId/friends/:friendId/reject", async (request, reply) => {
    const { userId, friendId } = request.params;
    
    try {
      const result = db.prepare(`
        UPDATE friends 
        SET status = 'rejected'
        WHERE user_id = ? AND friend_id = ? AND status = 'pending'
      `).run(friendId, userId);

      if (result.changes === 0)
        return reply.status(404).send({ error: "Demande d'amitié non trouvée" });

      return { message: "Demande d'amitié rejetée" };
    } catch (error) {
      return reply.status(500).send({ error: "Erreur serveur" });
    }
  });

  fastify.delete("/users/:userId/friends/:friendId", async (request, reply) => {
    const { userId, friendId } = request.params;
    
    try {
      const result = db.prepare(`
        DELETE FROM friends 
        WHERE (user_id = ? AND friend_id = ?) 
        OR (user_id = ? AND friend_id = ?)
      `).run(userId, friendId, friendId, userId);

      if (result.changes === 0) {
        return reply.status(404).send({ error: "Relation d'amitié non trouvée" });
      }

      return { message: "Ami supprimé" };
    }
    catch (error)
    {
      return reply.status(500).send({ error: "Erreur serveur" });
    }
  });

  fastify.get("/users/:userId/friends", async (request, reply) => {
    const { userId } = request.params;
    
    try {
      const friends = db.prepare(`
        SELECT u.id, u.username, u.avatar, u.status, f.status as friendship_status
        FROM friends f
        JOIN users u ON (f.friend_id = u.id AND f.user_id = ?) 
          OR (f.user_id = u.id AND f.friend_id = ?)
        WHERE f.status = 'accepted'
      `).all(userId, userId);

      return friends;
    } catch (error) {
      return reply.status(500).send({ error: "Erreur serveur" });
    }
  });

  fastify.get("/users/:userId/friend-requests", async (request, reply) => {
    const { userId } = request.params;
    
    try {
      const requests = db.prepare(`
        SELECT u.id, u.username, u.avatar, f.created_at
        FROM friends f
        JOIN users u ON f.user_id = u.id
        WHERE f.friend_id = ? AND f.status = 'pending'
        ORDER BY f.created_at DESC
      `).all(userId);

      return requests;
    }
    catch (error)
    {
      return reply.status(500).send({ error: "Erreur serveur" });
    }
  });

  fastify.post("/users/language", async (request, reply) => {
    const  userID = request.body.userId;
    const  language = request.body.language;

    try {
        const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userID);
        db.prepare("UPDATE users SET language = ? WHERE id = ?").run(language, userID);
        return reply.status(200).send({msg: "l'update de la langue c'est bien passer.", user});
    }
    catch(error) {
      return reply.status(500).send({ error: "Erreur serveur" });
    }
  });

}
module.exports = userRoutes;
