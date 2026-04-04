const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token || !token.startsWith("Bearer ")) {
        return res.status(401).json({ mensagem: "Token não fornecido" });
    }

    try {
        const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);

        req.usuario = decoded;
        console.log(req.usuario);

        next();
    } catch (erro) {
        return res.status(401).json({ mensagem: "Token inválido ou expirado" });
    }
};

module.exports = auth;