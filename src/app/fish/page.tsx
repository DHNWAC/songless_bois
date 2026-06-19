import Header from '@/components/Header'
import FishGame from '@/components/fish/FishGame'
import './fish.css'

export const metadata = { title: 'Save the Fish #001 — Jimsengdle' }

export default function FishPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20" style={{ background: '#fdf6e4' }}>
        <FishGame />
      </main>
    </>
  )
}
