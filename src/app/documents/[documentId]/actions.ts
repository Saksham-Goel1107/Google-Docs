'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function getDocuments(ids: Id<'documents'>[]) {
  return await convex.query(api.documents.getByIds, { ids });
}

export async function getUsers() {
  const { sessionClaims } = await auth();
  const clerk = await clerkClient();

  // Handle multiple possible organization ID fields
  const organizationId = sessionClaims?.org_id || sessionClaims?.organization_id;

  if (!organizationId) {
    console.warn('No organization ID found in session claims');
    return [];
  }

  const response = await clerk.users.getUserList({
    organizationId: [organizationId as string],
  });

  const users = response.data.map((user) => ({
    id: user.id,
    name: user.fullName ?? user.primaryEmailAddress?.emailAddress ?? 'Anonymous',
    avatar: user.imageUrl,
  }));

  return users;
}
