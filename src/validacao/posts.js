const joi = require('joi');

const postSchema = joi.object({
    titulo: joi.string().min(3).required().messages({
        "string.empty": "O título é obrigatório",
        "string.min": "O título deve ter pelo menos 3 carcteres",
        "any.required": "O título é obrigatório",
    }),
    conteudo: joi.string().min(5).required().messages({
        "string.empty": "O conteudo é obrigatório",
        "string.min": "O conteudo deve ter pelo menos 3 carcteres",
        "any.required": "O conteudo é obrigatório",
    }),   
});

function validarPost(req, res, next) {
    const {error} = postSchema.validate(req.body, {abortEarly:false});
    if (error){
        console.log(error);
        return res.status(400).json({
            erro: error.details.map(e => e.message)
        });
    }
    next()
}

module.exports = validarPost;