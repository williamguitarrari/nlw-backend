import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { dayjs } from "../lib/dayjs";
import { getMailClient } from "../lib/mail";
import nodemailer from 'nodemailer'

export async function confirmTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/confirm', {
        schema: {
            params: z.object({
                tripId: z.string().uuid(),
            })
        },
    } , async (request, reply) => { // Preciso do reply como parâmetro pra fazer redirecionamento.
            const { tripId } = request.params

            const trip = await prisma.trip.findUnique({
                where: {
                    id: tripId
                },
                include: {
                    participants: {
                        where: {
                            is_owner: false,
                        }
                    }
                }
            })

            if (!trip) {
                throw new Error("Trip not found.")
            }

            if (trip.is_confirmed) {
                return reply.redirect(`http://localhost:3000/trips/${tripId}`) // Faço o redirecionamento 
            }

            await prisma.trip.update({
                where: { id: tripId },
                data: { is_confirmed: true }
            })

            // const participants = await prisma.participant.findMany({
            //     where: {
            //         trip_id: tripId,
            //         is_owner: false
            //     }
            // }) 

            // O PRISMA ME PERMITE FAZER O JOIN USANDO O INCLUDE, NÃO SENDO NECESSÁRIO CRIAR UMA NOVA QUERY

            const formattedStartDate = dayjs(trip.starts_at).format('LL')
            const formattedEndDate = dayjs(trip.ends_at).format('LL')

            const mail = await getMailClient()

            // for (const participant of trip.participants) {
            //     await mail.sendMail() 
            // }

            // Utilizando o for, seria feito o disparo de somente 1 email por vez, podendo ocasionar uma lentidão na aplicação. 
            // Para solucionarmos esse problema, seria mais interessante o uso de um array promises (no metódo .all(), podemos monitorar mais de uma promisse por vez).

            await Promise.all( // O método all espera um array de promises no retorno, e uma função assícrona, sempre devolve uma promise.
                trip.participants.map(async (participant) => { 
                    const confirmationLink = `http://localhost:3333/participants/${participant.id}/confirm`

                    const message = await mail.sendMail({
                        from: {
                            name: 'Equipe plann.er',
                            address: 'oi@plann.er',
                        },
                        to: participant.email,
                        subject: `Confirme sua presença na viagem para ${trip.destination} em ${formattedStartDate}`,
                        html: `
                        <div>
                            <p>Você foi convidado para participar de uma viagem para
                            <strong>${trip.destination}</strong> nas datas de 
                            <strong>${formattedStartDate} até <strong>${formattedEndDate}</strong></p> 
                            <p></p>
                            <p></p>
                            <p>Para confirmar sua presença na viagem, clique no link abaixo</p>
                            <p>
                                <a href="${confirmationLink}">Confirmar viagem</a>
                            </p>
                        </div>
                        `.trim()
                    })
                    console.log(nodemailer.getTestMessageUrl(message))
                }) 
                
            )



            return reply.redirect(`http://localhost:3000/trips/${tripId}`)
    })
}