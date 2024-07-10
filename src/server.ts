import fastify from "fastify";
import { createTrip } from "./routes/create-trip";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { confirmTrip } from "./routes/confirm-trip";
 
const app = fastify();

app.setValidatorCompiler(validatorCompiler) // exemplo do github do plugin
app.setSerializerCompiler(serializerCompiler) // exemplo do github do plugin

app.register(createTrip)
app.register(confirmTrip)

app.listen({ port: 3333 }).then(() => {
    console.log('Server running!')
})