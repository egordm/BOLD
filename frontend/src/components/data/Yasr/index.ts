import dynamic from 'next/dynamic'

export const Yasr = dynamic(() =>
    import('./component').then((mod) => mod.Yasr), {
    ssr: false,
  }
) as any;
