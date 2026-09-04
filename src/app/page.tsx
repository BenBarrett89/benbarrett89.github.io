import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center p-4 text-center mt-4">
      <h1 className="text-6xl font-bold">BenBarrett89</h1>
      <div className="py-8">
        <p className="py-2">
          Please check out some of my personal projects if you want:
        </p>
      </div>
      <p className="py-2">
        <Link href="/euclidean">Euclidean Rhythms</Link>
      </p>
    </div>
  )
}
