import fastify from "fastify";

const app = fastify();

app.get('/teste', () => {
    return 'Hello Will'
})

app.listen({ port: 3333 }).then(() => {
    console.log('Server running!')
})