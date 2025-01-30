import { Chat } from "@/components/Chat"

const Home = () => {
  return (
    <div className="flex h-screen">
      <main className="flex-1 p-4">
        {/* Your main content goes here */}
        <h1>Main Content</h1>
        <Chat />
      </main>
    </div>
  )
}

export default Home
