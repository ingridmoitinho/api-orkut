const express = require("express");
const pool = require("./config/db")

const app = express();
app.use(express.json())

function formatarData(data){
    return new Date(data).toLocaleString("pt-BR", {
        timeZone: "America/Bahia",
    });
}

function formatarPost(post) {
    return {
        ...post,
        criado_em: formatarData(post.criado_em),
    };
}

app.get("/", (req, res) => {
    res.send("<h1>Rede Social!<h1>")
});

// GET USUARIOS

app.get("/usuarios", async(req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT * FROM usuarios;
        `);
        res.json(resultado.rows)
    } catch (erro) {
        res.status(500).json({
            erro:"Erro ao buscar dados de usuarios"
        })
    }
})

// GET DOS POSTS

app.get("/posts", async (req, res) => {
    try {
    const resultado = await pool.query(`
        SELECT 
        post.id AS post_id,
        usuarios.id AS usuario_id, 
        usuarios.nome,
        post.titulo,
        post.conteudo,
        post.criado_em
    FROM post
    JOIN usuarios
    ON post.usuario_id = usuarios.id
    ORDER BY post.criado_em DESC
    `);

    const dados = resultado.rows.map(formatarPost);

    res.json(dados);
    } catch(erro) {
        res.status(500).json({erro: "Erro ao buscar postagens"});
    }
});

// Criando Rota POST

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
            post: formatarPost(resultado.rows[0]),
        });

    } catch (erro) {       
        res.status(500).json({
            erro: "Erro ao criar post"
        });
    }
});

// Criando rota PUT - Atualização

app.put("/posts/:id", async (req, res) => {
    try {
    const {id} = req.params;
    const {titulo, conteudo} = req.body;

    const resultado = await pool.query(
        `UPDATE post SET titulo=$1, conteudo=$2 WHERE id=$3 RETURNING *`,
        [titulo, conteudo, id],
    );

    if (resultado.rows.length === 0) {
        return res.status(404).json({
            erro: "Post não encontrado"
        });
    }

    res.status(200).json({
        mensagem: "Post atualizado com sucesso",
        post: formatarPost(resultado.rows[0]),
    });

} catch (erro) {   
    res.status(500).json({
        erro: "Erro ao atuaalizar post",
    });
}
});

// ROTA DELETE

app.delete("/posts/:id", async (req, res) => {
    try{
    const {id} = req.params;

    const resultado = await pool.query(
        `DELETE FROM post WHERE id=$1 RETURNING *`,
        [id],
    ); 

    if (resultado.rows.length === 0) {
        return res.status(404).json({
            erro: "Post não encontrado"
        });
    }

    res.json({
        mensagem: "Post deletado com sucesso",
        post: formatarPost(resultado.rows[0]),
    })

} catch(erro) {
     res.status(500).json({
        erro: "Erro ao deletar post",
    });
}
});

module.exports = app;