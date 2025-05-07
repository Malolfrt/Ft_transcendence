const path = require('path');
const multer = require('multer');

async function uploadFileRoutes(fastify) {

    fastify.register(require("@fastify/multipart"), {
        limits: {
            fileSize: 50 * 1024 * 1024,
        },
    });

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(__dirname, "../../../images"));
        },
        filename: (req, file, cb) => {
            const extension = path.extname(file.originalname);
            const filename = Date.now() + extension;
            cb(null, filename);
        },
    });

    const upload = multer({
        storage: storage,
        limits: { fileSize: 50 * 1024 * 1024}
    });

    fastify.post('/uploadFile', async (req, reply) => {
        const data = await req.file();
        if (!data)
            return reply.code(400).send({ message: 'Image not uploaded' });
        const filename = Date.now() + data.filename
        const filePath = path.join("/app/images", filename);
        await data.toBuffer().then((buffer) => require("fs").writeFileSync(filePath, buffer));
        reply.code(200).send({ message: "Image uploaded", filename: filename });
    });

}

module.exports = uploadFileRoutes;