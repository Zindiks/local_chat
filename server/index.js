import Fastify from "fastify"
import cors from "@fastify/cors"
import fetch from "node-fetch"

const environment = process.env.NODE_ENV || "development"

const envToLogger = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
  production: true,
  test: false,
}

const app = Fastify({ logger: envToLogger[environment] ?? true })

// // Register CORS
app.register(cors, {
  origin: '*',
  methods: ["GET", "POST"],
})

// Chat completion endpoint
app.post("/api/chat", async (request, reply) => {
  const { messages } = request.body

  console.log(request.body)

  //connect to Ollama
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-r1:7b",
      prompt: messages[messages.length - 1].content,
      stream: true,
    }),
  })

  reply
    .header("Access-Control-Allow-Origin", "http://localhost:5173")
    .header("Content-Type", "text/event-stream") // For streaming
    .header("Cache-Control", "no-cache")
    .header("Connection", "keep-alive")

  if (!response.ok) {
    reply.status(response.status).send({ error: "Failed to fetch response" })
    return
  }

  // Properly handle the stream
  for await (const chunk of response.body) {
    const textChunk = new TextDecoder().decode(chunk)
    console.log(textChunk)
    reply.raw.write(chunk)
  }
  reply.raw.end()
})

const start = async () => {
  try {
    await app.listen({ port: 3000 })
    console.log("Server running on http://localhost:3000")
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
