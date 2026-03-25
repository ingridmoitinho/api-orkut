const express = require("express");
const pool = require("./config/db")

const app = express();
app.use(express.json())

app.get("/", (req, res) => {
    res.send("<h1>Rede Social!<h1>")
});

app.get("/usuarios", async(req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT * FROM usuarios;
            `);
            res.json(resultado.rows)
    } catch (erro) {
        res.status(500).json({
            erro:"Erro ao buscar dados de usuarios"})
    }
})

// GET DOS POSTS

app.get("/posts", async (req, res) => {
    try {
    const resultado = await pool.query(`
        SELECT 
        usuarios.id,
        usuarios.nome,
        post.titulo,
        post.conteudo,
        post.criado_em
    FROM post
    JOIN usuarios
    ON post.usuario_id = usuarios.id
    ORDER BY post.criado_em DESC
        `);
        res.json(resultado.rows)
    } catch(erro) {
        res.status(500).json({erro: "Erro ao buscar postagens"});
    }
});

app.post("/posts", async (req, res) => {
    try {
        const { titulo, conteudo, usuario_id } = req.body;

        const resultado = await pool.query(
            `
            INSERT INTO post (titulo, conteudo, usuario_id)
            VALUES ($1, $2, $3)
            RETURNING *
            `,
            [titulo, conteudo, usuario_id]
        );

        res.status(201).json({
            mensagem: "Post criado com sucesso",
            post: resultado.rows[0],
        });

    } catch (erro) {       
        res.status(500).json({
            erro: "Erro ao criar post"
        });
    }
});

module.exports = app;