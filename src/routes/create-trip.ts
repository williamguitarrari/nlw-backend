import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import dayjs from 'dayjs'
import { z } from 'zod'
import nodemailer from 'nodemailer'
import { prisma } from "../lib/prisma";
import { getMailClient } from "../lib/mail";

//zod => Schema validator

// fastify-type-provider-zod => plugin de integração do fastify com o zod

// withTypeProvider<ZodTypeProvider>() => validação retirada do exemplo do plugin https://github.com/turkerdev/fastify-type-provider-zod


export async function createTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips', {
        schema: {
            body: z.object({
                destination: z.string().min(4),
                starts_at: z.coerce.date(), // coerce do zod converte a string em uma data e faz a validação
                ends_at: z.coerce.date(),
                owner_name: z.string(),
                owner_email: z.string().email(),
                emails_to_invite: z.array(z.string().email()),
            })
        },
    } , async (request) => {
        const { destination, starts_at, ends_at, owner_name, owner_email, emails_to_invite } = request.body

        if (dayjs(starts_at).isBefore(new Date())) {  // valida se a data já passou
            throw new Error('Invalid trip start date.')
        }

        if (dayjs(ends_at).isBefore(starts_at)) { // valida a data de término da viagem
            throw new Error('Invalid trip end date.')
        }

        const trip = await prisma.trip.create({
            data: {
                destination,
                starts_at,
                ends_at,
                participants: { // criação considerando as relations do banco de dados
                    createMany: {
                        data: [
                            {
                                name: owner_name,
                                email: owner_email,
                                is_owner: true,
                                is_confirmed: true,
                            },
                            ...emails_to_invite.map(email => {
                                return {email}
                            })
                        ],
                    }
                }
            }
        })

        // Criação de participant substituido pelo modelo acima considerando as relations do banco de dados

        // await prisma.participant.create({
        //     data: {
        //         name: owner_name,
        //         email: owner_email,
        //         trip_id: trip.id,
        //     }
        // })

        const mail = await getMailClient()

        const message = await mail.sendMail({
            from: {
                name: 'Equipe plann.er',
                address: 'oi@plann.er',
            },
            to: {
                name: owner_name,
                address: owner_email
            },
            subject: 'Testando envio de e-mail',
            html: `<p>Teste do envio de e-mail</p>`
        })

        console.log(nodemailer.getTestMessageUrl(message))

        return { tripId: trip.id }
    })
}