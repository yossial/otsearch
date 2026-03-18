'use client';

import dynamic from 'next/dynamic';

const NetworkMap = dynamic(() => import('./NetworkMap'), { ssr: false });

export default NetworkMap;
