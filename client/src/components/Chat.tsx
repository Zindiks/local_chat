import { useState } from "react"
import ReactMarkdown from "react-markdown"
import { Card } from "./ui/card"
import { Input } from "./ui/input"
import { Button } from "./ui/button"

export function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [userMessage] }),
      })

      if (!response.ok) throw new Error(response.statusText)

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      // Create initial assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const chunks = buffer.split("\n")
        buffer = chunks.pop() || "" // Save any incomplete chunk

        for (const chunk of chunks) {
          if (!chunk.trim()) continue

          try {
            const parsed = JSON.parse(chunk)
            const content = parsed.response || parsed.content || ""

            // Update the last assistant message
            setMessages((prev) => {
              const newMessages = [...prev]
              const lastMessage = newMessages[newMessages.length - 1]

              if (lastMessage?.role === "assistant") {
                newMessages[newMessages.length - 1] = {
                  ...lastMessage,
                  content: lastMessage.content + content,
                }
              }
              return newMessages
            })
          } catch (error) {
            console.error("Error parsing chunk:", chunk, error)
          }
        }
      }
    } catch (error) {
      console.error("Fetch error:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error: Unable to connect to the server",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="p-4 mb-4 h-96 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-4 ${msg.role === "user" ? "text-right" : ""}`}
          >
            <div
              className={`inline-block p-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
            >
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </Card>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send"}
        </Button>
      </form>
    </div>
  )
}
