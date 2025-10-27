import App from '@/components/pages/app'
import { APP_URL } from '@/lib/constants'
import type { Metadata } from 'next'

const frame = {
  version: 'next',
  imageUrl: `${APP_URL}/images/feed.jpg`,
  button: {
    title: 'Play Base Block',
    action: {
      type: 'launch_frame',
      name: 'Base Block',
      url: APP_URL,
      splashImageUrl: `${APP_URL}/images/splash.jpg`,
      splashBackgroundColor: '#000',
    },
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Base Block',
    openGraph: {
      title: 'Base Block',
      description: 'Stack blocks with perfect precision to build the tallest tower!',
    },
    other: {
      'fc:frame': JSON.stringify(frame),
    },
  }
}

export default function Home() {
  return <App />
}

// Disable static generation for this page
export const dynamic = 'force-dynamic'
export const revalidate = 0

