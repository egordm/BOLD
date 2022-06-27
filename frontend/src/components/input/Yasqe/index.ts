import dynamic from 'next/dynamic'

export const Yasqe = dynamic(() =>
  import('./component').then((mod) => mod.Yasqe), {
    ssr: false,
  }
) as any;
