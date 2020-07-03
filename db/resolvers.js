const Usuario = require('../models/Usuario')
const Cliente = require('../models/Cliente')
const Producto = require('../models/Producto')
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
        },
        obtenerProductos: async () => {
            try {
                const productos = await Producto.find({})
                return productos
            } catch (error) {
                console.log(error)
            }
        },
        obtenerProducto: async (_, { id }) => {
            // Revisar si el producto existe o no
            const producto = await Producto.findById(id)

            if (!producto) {
                throw new Error('Producto no encontrado')
            }

            return producto
        },
        obtenerClientes: async () => {
            try {
                const clientes = await Cliente.find({})
                return clientes
            } catch (error) {
                console.log(error)
            }
        },
        obtenerClientesVendedor: async (_, { }, ctx) => {
            try {
                const clientes = await Cliente.find({ vendedor: ctx.usuario.id.toString() })
                return clientes
            } catch (error) {
                console.log(error)

            }

        },
        obtenerCliente: async (_, { id }, ctx) => {
            // Revisar si el cliente existe o no
            const cliente = await Cliente.findById(id)
            if (!cliente) {
                throw new Error('Cliente no encontrado')
            }

            // Quien lo creo puede verlo
            if (cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales')
            }

            return cliente
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
        },
        nuevoProducto: async (_, { input }) => {
            try {
                const producto = new Producto(input)

                // Guardar en BD
                const resultado = await producto.save()

                return resultado

            } catch (error) {
                console.log(error)
            }
        },
        actualizarProducto: async (_, { id, input }) => {
            // Revisar si el producto existe o no
            let producto = await Producto.findById(id)

            if (!producto) {
                throw new Error('Producto no encontrado')
            }

            // Guardar en la base de datos
            producto = await Producto.findOneAndUpdate({ _id: id }, input, { new: true })

            return producto
        },
        eliminarProducto: async (_, { id }) => {
            // Revisar si el producto existe o no
            let producto = await Producto.findById(id)

            if (!producto) {
                throw new Error('Producto no encontrado')
            }

            // Eliminar
            await Producto.findOneAndDelete({ _id: id })
            return "Producto Eliminado Con Exito"
        },
        nuevoCliente: async (_, { input }, ctx) => {
            console.log(ctx)
            // Verificar si el cliente está registrado

            const { email } = input

            const cliente = await Cliente.findOne({ email })
            if (cliente) {
                throw new Error('Cliente ya registrado')
            }

            const nuevoCliente = new Cliente(input)

            // Asignar el vendedor
            nuevoCliente.vendedor = ctx.usuario.id

            // Guardarlo en base de datos
            try {
                const resultado = await nuevoCliente.save()

                return resultado
            } catch (error) {
                console.log(error)
            }
        },
        actualizarCliente: async (_, { id, input }, ctx) => {
            // Verificar si existe o no
            let cliente = await Cliente.findById(id)
            if (!cliente) {
                throw new Error('Cliente no existe')
            }
            // Verificar si el vendedor es quien edita
            if (cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales')
            }
            // Guardar el cliente
            cliente = await Cliente.findOneAndUpdate({ _id: id }, input, { new: true })
            return cliente
        },
        eliminarCliente: async (_, { id }) => {
            // Revisar si el cliente existe o no
            let cliente = await Cliente.findById(id)

            if (!cliente) {
                throw new Error('Cliente no encontrado')
            }
            // Verificar si el vendedor es quien edita
            if (cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales')
            }
            // Eliminar
            await Cliente.findOneAndDelete({ _id: id })
            return "Cliente Eliminado Con Exito"
        },
    }
}

module.exports = resolvers