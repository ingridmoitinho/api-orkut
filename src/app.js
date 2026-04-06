require("dotenv").config(); 
const express = require("express");
const pool = require("./config/db")
const validarUsuarios = require("./validacao/usuarios")
const validarPost = require("./validacao/posts")

const jwt = require("jsonwebtoken");  
const auth = require("./auth/authLogin"); 
const bcrypt = require("bcrypt");

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
    res.send("<h1>Rede Social!</h1>")
});

// LOGIN
app.post("/login", async (req, res) => {
    const { email, senha } = req.body;

    const usuario = await pool.query(
        `SELECT * FROM usuarios WHERE email=$1`,
        [email]
    );

    if (usuario.rows.length === 0) {
        return res.status(400).json({ mensagem: "Usuário não encontrado" });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.rows[0].senha);

    if (!senhaValida) {
        return res.status(400).json({ mensagem: "Senha inválida" });
    }

    const token = jwt.sign(
        { id: usuario.rows[0].id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    res.json({ token });
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

//  Rota POST (usuarios)
app.post("/usuarios", validarUsuarios, async (req, res) => {
    try {
        const {nome, email, senha} = req.body;

        const senhaHash = await bcrypt.hash(senha, 10)

        const resultado = await pool.query(`
            INSERT INTO usuarios (nome, email, senha)
            VALUES ($1, $2, $3)
            RETURNING*`,
            [nome, email, senhaHash]);
            res.status(201).json({
                mensagem: "Usuario criado com sucesso",
                usuario: resultado.rows[0],
            });
       } catch (erro) {
         console.log(erro);
        res.status(500).json({
            erro: "Erro ao criar usuario"
        });
       }
    });

// PROTEGIDA COM AUTH
app.post("/posts", auth, validarPost, async (req, res) => {
    try {
        const { titulo, conteudo } = req.body;

        const resultado = await pool.query(
            `
            INSERT INTO post (titulo, conteudo, usuario_id)
            VALUES ($1, $2, $3)
            RETURNING *
            `,
            [titulo, conteudo, req.usuario.id] 
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

// PUT
app.put("/posts/:id", auth, validarPost, async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, conteudo } = req.body;
  
        const post = await pool.query(
            `SELECT * FROM post WHERE id=$1`,
            [id]
        );

        if (post.rows.length === 0) {
            return res.status(404).json({
                erro: "Post não encontrado"
            });
        }
    
        if (post.rows[0].usuario_id !== req.usuario.id) {
            return res.status(403).json({
                erro: "Acesso negado. Sem permissão."
            });
        }
      
        const resultado = await pool.query(
            `UPDATE post SET titulo=$1, conteudo=$2 WHERE id=$3 RETURNING *`,
            [titulo, conteudo, id]
        );

        res.status(200).json({
            mensagem: "Post atualizado com sucesso",
            post: formatarPost(resultado.rows[0]),
        });

    } catch (erro) {
        console.log(erro);
        res.status(500).json({
            erro: "Erro ao atualizar post",
        });
    }
});

// DELETE
app.delete("/posts/:id",  async (req, res) => {
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