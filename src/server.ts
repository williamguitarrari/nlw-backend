import fastify from "fastify";
import cors from '@fastify/cors'
import { createTrip } from "./routes/create-trip";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { confirmTrip } from "./routes/confirm-trip";
import { confirmParticipants } from "./routes/confirm-participant";
import { createActivity } from "./routes/create-activity";
 
const app = fastify();

app.register(cors, {
    origin: '*', //qualquer aplicativo pode acessar a aplicacão, não utilizar em PROD!!!!
})

app.setValidatorCompiler(validatorCompiler) // exemplo do github do plugin
app.setSerializerCompiler(serializerCompiler) // exemplo do github do plugin

app.register(createTrip)
app.register(confirmTrip)
app.register(confirmParticipants)
app.register(createActivity)

app.listen({ port: 3333 }).then(() => {
    console.log('Server running!')
})