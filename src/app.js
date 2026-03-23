const express = require("express");
const pool = require("./config/db")

const app = express();
app.use(express.json())

app.get("/", (req, res) => {
    res.send("<h1>Rede Social!<h1>")
});

// GET DOS POSTS

app.get("/posts", async (req, res) => {
    try {
    const resultado = await pool.query(`
        SELECT 
        usuarios.nome,
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
})
;

module.exports = app;