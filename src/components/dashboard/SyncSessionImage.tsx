'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Invisible component: if the current session has no image but the therapist
 * profile has a photo, sync the photo into the JWT so the navbar avatar updates.
 */
export default function SyncSessionImage({ profilePhoto }: { profilePhoto: string | null }) {
  const { data: session, update } = useSession();

  useEffect(() => {
    if (!profilePhoto) return;
    const sessionImage = session?.user?.image;
    if (sessionImage === profilePhoto) return;
    void update({ image: profilePhoto });
  }, [profilePhoto, session?.user?.image, update]);

  return null;
}
