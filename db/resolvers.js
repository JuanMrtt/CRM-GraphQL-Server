const Usuario = require('../models/Usuario')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config({ path: '.env' })

const crearToken = (usuario, secreta, expiresIn) => {

    const { id, email, nombre, apellido } = usuario

    return jwt.sign({ id }, secreta, { expiresIn })
}

// Resolvers
const resolvers = {
    Query: {
        obtenerUsuario: async (_, { token }) => {
            const usuarioId = await jwt.verify(token, process.env.SECRETA)

            return usuarioId
        }
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
                console.log(error)
            }
        },
        autenticarUsuario: async (_, { input }) => {

            // Si el usuario existe
            const { email, password } = input

            const existeUsuario = await Usuario.findOne({ email })
            if (!existeUsuario) {
                throw new Error('El usuario no existe')
            }

            // Revisar si el password es correcto
            const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password)
            if (!passwordCorrecto) {
                throw new Error('El password es incorrecto')
            }
            // Crear el token
            return {
                token: crearToken(existeUsuario, process.env.SECRETA, '24h')
            }


        }
    }
}

module.exports = resolvers