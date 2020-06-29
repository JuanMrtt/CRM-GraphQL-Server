const Usuario = require('../models/Usuario')
const bcryptjs = require('bcryptjs')

// Resolvers
const resolvers = {
    Query: {
        obtenerCurso: () => "Algo"
    },
    Mutation: {
        nuevoUsuario: async (_, { input }) => {
            // Revisar si el usuario ya está registrado
            const { email, password } = input
            const existeUsuario = await Usuario.findOne({ email })

            if (existeUsuario) {
                throw new Error('El usuario ya está registrado')
            }
            // Hashear el password
            const salt = await bcryptjs.genSalt(10)
            input.password = await bcryptjs.hash(password, salt)


            try {
                // Guardarlo en BD
                const usuario = new Usuario(input)
                usuario.save()
                return usuario

            } catch (error) {

            }
        }
    }
}

module.exports = resolvers